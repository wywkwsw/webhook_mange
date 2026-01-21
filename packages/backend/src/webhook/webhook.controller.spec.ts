import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { AddressInfo } from "node:net";
import { JwtStrategy } from "../auth/jwt.strategy";
import { WebhookController } from "./webhook.controller";
import { WebhookService } from "./webhook.service";
import { CreateWebhookDto } from "./dto/create-webhook.dto";
import { UpdateWebhookDto } from "./dto/update-webhook.dto";
import { WebhookListQueryDto } from "./dto/webhook-list-query.dto";

describe("WebhookController", () => {
  let app: INestApplication;
  let baseUrl: string;
  let jwtService: JwtService;

  type WebhookRecord = {
    id: string;
    userId: string;
    name: string;
    path: string;
    secret: string | null;
    isActive: boolean;
    config: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
  };

  const store = new Map<string, WebhookRecord>();

  type MockWebhookService = {
    create(userId: string, dto: CreateWebhookDto): Promise<WebhookRecord>;
    findAll(
      userId: string,
      query: WebhookListQueryDto,
    ): Promise<{ items: WebhookRecord[]; total: number; page: number; limit: number }>;
    findOne(userId: string, id: string): Promise<WebhookRecord>;
    update(userId: string, id: string, dto: UpdateWebhookDto): Promise<WebhookRecord>;
    remove(userId: string, id: string): Promise<{ deleted: true }>;
  };

  const mockWebhookService: MockWebhookService = {
    async create(userId, dto) {
      for (const item of store.values()) {
        if (item.path === dto.path) {
          throw new Error("Webhook path already exists");
        }
      }

      const id = randomUUID();
      const now = new Date();
      const record: WebhookRecord = {
        id,
        userId,
        name: dto.name,
        path: dto.path,
        secret: dto.secret ?? null,
        isActive: dto.isActive ?? true,
        config: dto.config ?? null,
        createdAt: now,
        updatedAt: now,
      };
      store.set(id, record);
      return record;
    },
    async findAll(userId, query) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;

      const filtered = [...store.values()].filter((item) => {
        if (item.userId !== userId) return false;
        if (typeof query.isActive === "boolean" && item.isActive !== query.isActive) return false;
        if (query.search && !item.name.toLowerCase().includes(String(query.search).toLowerCase()))
          return false;
        return true;
      });

      const total = filtered.length;
      const items = filtered.slice((page - 1) * limit, page * limit);
      return { items, total, page, limit };
    },
    async findOne(userId, id) {
      const item = store.get(id);
      if (!item || item.userId !== userId) {
        throw new Error("Webhook not found");
      }
      return item;
    },
    async update(userId, id, dto) {
      const item = await this.findOne(userId, id);
      const updated: WebhookRecord = {
        ...item,
        name: dto.name ?? item.name,
        path: dto.path ?? item.path,
        secret: dto.secret === undefined ? item.secret : dto.secret,
        isActive: dto.isActive ?? item.isActive,
        config: dto.config === undefined ? item.config : dto.config,
        updatedAt: new Date(),
      };
      store.set(id, updated);
      return updated;
    },
    async remove(userId, id) {
      await this.findOne(userId, id);
      store.delete(id);
      return { deleted: true };
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
      controllers: [WebhookController],
      providers: [
        JwtStrategy,
        JwtService,
        {
          provide: WebhookService,
          useValue: mockWebhookService as unknown as WebhookService,
        },
      ],
    }).compile();

    jwtService = moduleRef.get(JwtService);
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    const server = await app.listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("denies access without JWT", async () => {
    const res = await fetch(`${baseUrl}/api/webhooks`);
    expect(res.status).toBe(401);
  });

  it("CRUD + pagination/filtering", async () => {
    const userId = randomUUID();
    const token = jwtService.sign({ sub: userId, username: "demo" });

    const createRes = await fetch(`${baseUrl}/api/webhooks`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "GitHub",
        path: `github_${Math.random().toString(16).slice(2)}`,
        secret: "s",
        isActive: true,
        config: { event: "push" },
      }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created).toMatchObject({ userId, name: "GitHub", isActive: true });

    const listRes = await fetch(`${baseUrl}/api/webhooks?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.total).toBe(1);
    expect(listBody.items).toHaveLength(1);

    const inactiveRes = await fetch(`${baseUrl}/api/webhooks?isActive=false`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(inactiveRes.status).toBe(200);
    const inactiveBody = await inactiveRes.json();
    expect(inactiveBody.total).toBe(0);

    const patchRes = await fetch(`${baseUrl}/api/webhooks/${created.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    expect(patchRes.status).toBe(200);

    const inactiveRes2 = await fetch(`${baseUrl}/api/webhooks?isActive=false`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(inactiveRes2.status).toBe(200);
    const inactiveBody2 = await inactiveRes2.json();
    expect(inactiveBody2.total).toBe(1);

    const delRes = await fetch(`${baseUrl}/api/webhooks/${created.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(delRes.status).toBe(200);

    const listRes2 = await fetch(`${baseUrl}/api/webhooks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listBody2 = await listRes2.json();
    expect(listBody2.total).toBe(0);
  });
});
