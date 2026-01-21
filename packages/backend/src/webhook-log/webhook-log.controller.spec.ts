import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { AddressInfo } from "node:net";
import { JwtStrategy } from "../auth/jwt.strategy";
import { WebhookLogController } from "./webhook-log.controller";
import { WebhookLogService } from "./webhook-log.service";

describe("WebhookLogController", () => {
  let app: INestApplication;
  let baseUrl: string;
  let jwtService: JwtService;

  type MockWebhookLogService = {
    listForWebhook(userId: string, webhookId: string): Promise<Array<{ id: string }>>;
  };

  const mockWebhookLogService: MockWebhookLogService = {
    async listForWebhook(userId, webhookId) {
      void userId;
      void webhookId;
      return [{ id: "log_1" }];
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = "test_secret";
    process.env.JWT_EXPIRES_IN = "1h";

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PassportModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
        }),
      ],
      controllers: [WebhookLogController],
      providers: [
        JwtStrategy,
        {
          provide: WebhookLogService,
          useValue: mockWebhookLogService as unknown as WebhookLogService,
        },
      ],
    }).compile();

    jwtService = moduleRef.get(JwtService);
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();

    const server = await app.listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("denies access without JWT", async () => {
    const res = await fetch(`${baseUrl}/api/webhooks/wh_1/logs`);
    expect(res.status).toBe(401);
  });

  it("returns logs for webhook", async () => {
    const userId = randomUUID();
    const token = jwtService.sign({ sub: userId, username: "demo" });

    const res = await fetch(`${baseUrl}/api/webhooks/wh_1/logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]?.id).toBe("log_1");
  });
});
