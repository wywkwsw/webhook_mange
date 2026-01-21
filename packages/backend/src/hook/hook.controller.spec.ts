import { INestApplication, RequestMethod } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AddressInfo } from "node:net";
import { HookController } from "./hook.controller";
import { WebhookService } from "../webhook/webhook.service";

describe("HookController", () => {
  let app: INestApplication;
  let baseUrl: string;

  type HookWebhook = {
    path: string;
    secret: string | null;
    isActive: boolean;
  };

  const webhooks = new Map<string, HookWebhook>([
    [
      "demo",
      {
        path: "demo",
        secret: "s",
        isActive: true,
      },
    ],
  ]);

  type MockWebhookService = {
    findByPath(path: string): Promise<HookWebhook | null>;
  };

  const mockWebhookService: MockWebhookService = {
    async findByPath(path) {
      const hook = webhooks.get(path);
      return hook ? { ...hook } : null;
    },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HookController],
      providers: [
        {
          provide: WebhookService,
          useValue: mockWebhookService as unknown as WebhookService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api", {
      exclude: [
        { path: "hook", method: RequestMethod.ALL },
        { path: "hook/(.*)", method: RequestMethod.ALL },
      ],
    });
    await app.init();

    const server = await app.listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 404 when webhook missing", async () => {
    const res = await fetch(`${baseUrl}/hook/missing`);
    expect(res.status).toBe(404);
  });

  it("requires secret when configured", async () => {
    const res = await fetch(`${baseUrl}/hook/demo`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("accepts any method and returns 200 on success", async () => {
    const res = await fetch(`${baseUrl}/hook/demo`, {
      method: "PUT",
      headers: { "x-webhook-secret": "s" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("rejects invalid secret", async () => {
    const res = await fetch(`${baseUrl}/hook/demo?secret=bad`, { method: "POST" });
    expect(res.status).toBe(401);
  });
});
