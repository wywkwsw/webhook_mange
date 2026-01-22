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
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateWebhookDto } from "./dto/create-webhook.dto";
import { ExportWebhookDto } from "./dto/export-webhook.dto";
import { ImportMode, ImportWebhookDto, ImportWebhookQueryDto } from "./dto/import-webhook.dto";
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

  @ApiOperation({ summary: "导出 webhook 配置" })
  @ApiOkResponse({
    description: "导出的 JSON 配置",
    schema: {
      example: {
        version: "1.0",
        exportedAt: "2026-01-22T10:00:00.000Z",
        webhooks: [
          {
            name: "TradingView",
            path: "tradingview",
            secret: null,
            isActive: true,
            config: null,
            forwardConfig: null,
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "缺少或无效的 JWT" })
  @ApiBody({ type: ExportWebhookDto, required: false })
  @Post("export")
  async exportWebhooks(@Req() req: Request, @Body() body?: ExportWebhookDto) {
    const userId = getUserId(req);
    return await this.webhookService.exportWebhooks(userId, body?.ids);
  }

  @ApiOperation({ summary: "导入 webhook 配置" })
  @ApiOkResponse({
    description: "导入结果",
    schema: {
      example: {
        total: 3,
        imported: 2,
        skipped: 1,
        overwritten: 0,
        renamed: 0,
        errors: [],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "缺少或无效的 JWT" })
  @ApiQuery({
    name: "mode",
    enum: ImportMode,
    required: false,
    description: "导入模式：skip-跳过冲突, overwrite-覆盖, rename-重命名",
  })
  @Post("import")
  async importWebhooks(
    @Req() req: Request,
    @Body() body: ImportWebhookDto,
    @Query() query: ImportWebhookQueryDto,
  ) {
    const userId = getUserId(req);
    return await this.webhookService.importWebhooks(
      userId,
      body.webhooks,
      query.mode ?? ImportMode.SKIP,
    );
  }
}
