import {
  All,
  Controller,
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

@ApiExcludeController()
@Controller("hook")
export class HookController {
  constructor(private readonly webhookService: WebhookService) {}

  @All(":path")
  @HttpCode(200)
  async receive(@Param("path") path: string, @Req() req: Request) {
    const webhook = await this.webhookService.findByPath(path);
    if (!webhook || !webhook.isActive) {
      throw new NotFoundException("Webhook not found");
    }

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

    return { ok: true };
  }
}
