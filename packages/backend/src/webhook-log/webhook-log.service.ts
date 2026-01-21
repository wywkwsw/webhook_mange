import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Webhook } from "../webhook/entities/webhook.entity";
import { WebhookService } from "../webhook/webhook.service";
import { WebhookLog } from "./entities/webhook-log.entity";

export type CreateWebhookLogInput = {
  webhookId: string;
  method: string;
  headers: Record<string, string>;
  payload: unknown | null;
  statusCode: number;
  response: unknown | null;
};

@Injectable()
export class WebhookLogService {
  constructor(
    @InjectRepository(WebhookLog)
    private readonly logRepository: Repository<WebhookLog>,
    private readonly webhookService: WebhookService,
  ) {}

  async create(input: CreateWebhookLogInput): Promise<WebhookLog> {
    const log = this.logRepository.create({
      method: input.method,
      headers: input.headers,
      payload: input.payload,
      statusCode: input.statusCode,
      response: input.response,
      webhook: { id: input.webhookId } as unknown as Webhook,
    });
    return await this.logRepository.save(log);
  }

  async listForWebhook(userId: string, webhookId: string): Promise<WebhookLog[]> {
    await this.webhookService.findOne(userId, webhookId);
    return await this.logRepository
      .createQueryBuilder("log")
      .where("log.webhookId = :webhookId", { webhookId })
      .orderBy("log.receivedAt", "DESC")
      .getMany();
  }
}
