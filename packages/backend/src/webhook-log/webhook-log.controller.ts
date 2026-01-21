import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
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

@ApiTags("logs")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("logs")
export class LogsController {
  constructor(private readonly webhookLogService: WebhookLogService) {}

  @ApiOperation({ summary: "获取当前用户所有 webhook 日志" })
  @ApiOkResponse({
    schema: {
      example: [
        {
          id: "uuid",
          method: "POST",
          statusCode: 200,
          receivedAt: "2026-01-01T00:00:00.000Z",
          webhookName: "GitHub Webhook",
          webhookPath: "github-webhook",
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: "缺少或无效的 JWT" })
  @Get()
  async listAll(@Req() req: Request) {
    return await this.webhookLogService.listAllForUser(getUserId(req));
  }

  @ApiOperation({ summary: "删除单条日志" })
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  @ApiUnauthorizedResponse({ description: "缺少或无效的 JWT" })
  @Delete(":id")
  async deleteOne(@Req() req: Request, @Param("id") logId: string) {
    return await this.webhookLogService.deleteById(getUserId(req), logId);
  }

  @ApiOperation({ summary: "批量删除日志" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        ids: { type: "array", items: { type: "string" }, example: ["uuid1", "uuid2"] },
      },
    },
  })
  @ApiOkResponse({ schema: { example: { deletedCount: 2 } } })
  @ApiUnauthorizedResponse({ description: "缺少或无效的 JWT" })
  @Post("delete-batch")
  async deleteBatch(@Req() req: Request, @Body() body: { ids: string[] }) {
    return await this.webhookLogService.deleteByIds(getUserId(req), body.ids);
  }

  @ApiOperation({ summary: "按 Webhook ID 删除所有日志" })
  @ApiOkResponse({ schema: { example: { deletedCount: 10 } } })
  @ApiUnauthorizedResponse({ description: "缺少或无效的 JWT" })
  @Delete("webhook/:webhookId")
  async deleteByWebhook(@Req() req: Request, @Param("webhookId") webhookId: string) {
    return await this.webhookLogService.deleteByWebhookId(getUserId(req), webhookId);
  }

  @ApiOperation({ summary: "删除指定日期之前的日志" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        beforeDate: { type: "string", format: "date-time", example: "2026-01-01T00:00:00.000Z" },
      },
    },
  })
  @ApiOkResponse({ schema: { example: { deletedCount: 50 } } })
  @ApiUnauthorizedResponse({ description: "缺少或无效的 JWT" })
  @Post("delete-before-date")
  async deleteBeforeDate(@Req() req: Request, @Body() body: { beforeDate: string }) {
    const date = new Date(body.beforeDate);
    return await this.webhookLogService.deleteBeforeDate(getUserId(req), date);
  }
}
