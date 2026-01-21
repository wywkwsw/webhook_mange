import { Controller, Get, Param, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
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

  @ApiOperation({ summary: "获取 webhook 请求日志" })
  @ApiOkResponse({
    schema: {
      example: [
        {
          id: "uuid",
          method: "POST",
          statusCode: 200,
          receivedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: "缺少或无效的 JWT" })
  @Get(":id/logs")
  async list(@Req() req: Request, @Param("id") webhookId: string) {
    return await this.webhookLogService.listForWebhook(getUserId(req), webhookId);
  }
}
