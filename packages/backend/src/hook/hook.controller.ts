import {
  All,
  Controller,
  HttpException,
  HttpCode,
  NotFoundException,
  Param,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { timingSafeEqual } from "node:crypto";
import { Request } from "express";
import { WebhookService } from "../webhook/webhook.service";
import { WebhookLogService } from "../webhook-log/webhook-log.service";

function readQuerySecret(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

const SENSITIVE_HEADERS = new Set(["authorization", "cookie", "set-cookie", "x-webhook-secret"]);

function normalizeHeaders(headers: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const normalizedKey = key.toLowerCase();
    if (SENSITIVE_HEADERS.has(normalizedKey)) {
      result[key] = "[redacted]";
      continue;
    }

    if (typeof value === "string") {
      result[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      result[key] = value.map((v) => String(v)).join(",");
      continue;
    }

    if (value == null) {
      result[key] = "";
      continue;
    }

    result[key] = String(value);
  }
  return result;
}

@ApiExcludeController()
@Controller("hook")
export class HookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly webhookLogService: WebhookLogService,
  ) {}

  @All(":path")
  @HttpCode(200)
  async receive(@Param("path") path: string, @Req() req: Request) {
    const webhook = await this.webhookService.findByPath(path);
    if (!webhook || !webhook.isActive) {
      throw new NotFoundException("Webhook not found");
    }

    const requestPayload = {
      method: req.method,
      headers: normalizeHeaders(req.headers as unknown as Record<string, unknown>),
      payload: (req.body ?? null) as unknown,
    };

    const writeLog = async (input: { statusCode: number; response: unknown | null }) => {
      try {
        await this.webhookLogService.create({
          webhookId: webhook.id,
          method: requestPayload.method,
          headers: requestPayload.headers,
          payload: requestPayload.payload,
          statusCode: input.statusCode,
          response: input.response,
        });
      } catch {
        // best-effort logging; never block webhook response
      }
    };

    try {
      if (webhook.secret) {
        const provided = req.header("x-webhook-secret") ?? readQuerySecret(req.query.secret);
        if (!provided) {
          throw new UnauthorizedException("Missing secret");
        }

        const ok = timingSafeEqualString(provided, webhook.secret);
        if (!ok) {
          throw new UnauthorizedException("Invalid secret");
        }
      }

      const response = { ok: true };
      await writeLog({ statusCode: 200, response });
      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        await writeLog({
          statusCode: error.getStatus(),
          response: error.getResponse() as unknown,
        });
      } else {
        await writeLog({
          statusCode: 500,
          response: { message: "Internal server error" },
        });
      }
      throw error;
    }
  }
}
