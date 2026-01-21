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
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
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

  @Get()
  async list(@Req() req: Request, @Query() query: WebhookListQueryDto) {
    const userId = getUserId(req);
    return await this.webhookService.findAll(userId, query);
  }

  @Post()
  async create(@Req() req: Request, @Body() body: CreateWebhookDto) {
    const userId = getUserId(req);
    return await this.webhookService.create(userId, body);
  }

  @Get(":id")
  async get(@Req() req: Request, @Param("id") id: string) {
    const userId = getUserId(req);
    return await this.webhookService.findOne(userId, id);
  }

  @Patch(":id")
  async update(@Req() req: Request, @Param("id") id: string, @Body() body: UpdateWebhookDto) {
    const userId = getUserId(req);
    return await this.webhookService.update(userId, id, body);
  }

  @Delete(":id")
  async remove(@Req() req: Request, @Param("id") id: string) {
    const userId = getUserId(req);
    return await this.webhookService.remove(userId, id);
  }
}
