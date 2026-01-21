import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateWebhookDto } from "./dto/create-webhook.dto";
import { UpdateWebhookDto } from "./dto/update-webhook.dto";
import { WebhookListQueryDto } from "./dto/webhook-list-query.dto";
import { WebhookService } from "./webhook.service";

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

@ApiTags("webhooks")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("webhooks")
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @ApiOperation({ summary: "获取 webhook 列表" })
  @ApiOkResponse({ schema: { example: { items: [], total: 0, page: 1, limit: 20 } } })
  @ApiUnauthorizedResponse({ description: "缺少或无效的 JWT" })
  @Get()
  async list(@Req() req: Request, @Query() query: WebhookListQueryDto) {
    const userId = getUserId(req);
    return await this.webhookService.findAll(userId, query);
  }

  @ApiOperation({ summary: "创建 webhook" })
  @ApiCreatedResponse({
    schema: {
      example: {
        id: "uuid",
        name: "GitHub",
        path: "github",
        secret: null,
        isActive: true,
        config: { event: "push" },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiConflictResponse({ description: "path 已存在" })
  @ApiUnauthorizedResponse({ description: "缺少或无效的 JWT" })
  @Post()
  async create(@Req() req: Request, @Body() body: CreateWebhookDto) {
    const userId = getUserId(req);
    return await this.webhookService.create(userId, body);
  }

  @ApiOperation({ summary: "获取单个 webhook" })
  @ApiOkResponse({ schema: { example: { id: "uuid", name: "GitHub", path: "github" } } })
  @ApiNotFoundResponse({ description: "webhook 不存在" })
  @ApiUnauthorizedResponse({ description: "缺少或无效的 JWT" })
  @Get(":id")
  async get(@Req() req: Request, @Param("id") id: string) {
    const userId = getUserId(req);
    return await this.webhookService.findOne(userId, id);
  }

  @ApiOperation({ summary: "更新 webhook" })
  @ApiOkResponse({ schema: { example: { id: "uuid", name: "GitHub", path: "github" } } })
  @ApiNotFoundResponse({ description: "webhook 不存在" })
  @ApiConflictResponse({ description: "path 已存在" })
  @ApiUnauthorizedResponse({ description: "缺少或无效的 JWT" })
  @Patch(":id")
  async update(@Req() req: Request, @Param("id") id: string, @Body() body: UpdateWebhookDto) {
    const userId = getUserId(req);
    return await this.webhookService.update(userId, id, body);
  }

  @ApiOperation({ summary: "删除 webhook" })
  @ApiOkResponse({ schema: { example: { deleted: true } } })
  @ApiNotFoundResponse({ description: "webhook 不存在" })
  @ApiUnauthorizedResponse({ description: "缺少或无效的 JWT" })
  @Delete(":id")
  async remove(@Req() req: Request, @Param("id") id: string) {
    const userId = getUserId(req);
    return await this.webhookService.remove(userId, id);
  }
}
