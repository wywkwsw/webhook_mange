import { Controller, Get, Param, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { WebhookLogService } from "./webhook-log.service";

type AuthenticatedUser = {
  userId: string;
  username: string;
};

function getUserId(req: Request): string {
  const user = req.user as AuthenticatedUser | undefined;
  if (!user?.userId) {
    throw new UnauthorizedException();
  }
  return user.userId;
}

@ApiTags("webhook-logs")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("webhooks")
export class WebhookLogController {
  constructor(private readonly webhookLogService: WebhookLogService) {}

  @Get(":id/logs")
  async list(@Req() req: Request, @Param("id") webhookId: string) {
    return await this.webhookLogService.listForWebhook(getUserId(req), webhookId);
  }
}
