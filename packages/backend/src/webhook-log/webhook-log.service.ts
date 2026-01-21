import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository, In } from "typeorm";
import { Webhook } from "../webhook/entities/webhook.entity";
import { WebhookService } from "../webhook/webhook.service";
import { WebhookLog } from "./entities/webhook-log.entity";

export type CreateWebhookLogInput = {
  webhookId: string;
  method: string;
  headers: Record<string, string>;
  payload: Record<string, unknown> | null;
  statusCode: number;
  response: Record<string, unknown> | null;
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

  async listAllForUser(userId: string): Promise<
    Array<WebhookLog & { webhookName: string; webhookPath: string }>
  > {
    const logs = await this.logRepository
      .createQueryBuilder("log")
      .innerJoin("log.webhook", "webhook")
      .addSelect(["webhook.id", "webhook.name", "webhook.path"])
      .where("webhook.userId = :userId", { userId })
      .orderBy("log.receivedAt", "DESC")
      .limit(100)
      .getMany();

    return logs.map((log) => ({
      ...log,
      webhookName: log.webhook?.name ?? "Unknown",
      webhookPath: log.webhook?.path ?? "",
    }));
  }

  /**
   * Delete a single log by ID (verify ownership)
   */
  async deleteById(userId: string, logId: string): Promise<{ deleted: boolean }> {
    const log = await this.logRepository
      .createQueryBuilder("log")
      .innerJoin("log.webhook", "webhook")
      .where("log.id = :logId", { logId })
      .andWhere("webhook.userId = :userId", { userId })
      .getOne();

    if (!log) {
      return { deleted: false };
    }

    await this.logRepository.delete(logId);
    return { deleted: true };
  }

  /**
   * Delete multiple logs by IDs (verify ownership)
   */
  async deleteByIds(userId: string, logIds: string[]): Promise<{ deletedCount: number }> {
    if (logIds.length === 0) {
      return { deletedCount: 0 };
    }

    // Find logs that belong to the user
    const logs = await this.logRepository
      .createQueryBuilder("log")
      .innerJoin("log.webhook", "webhook")
      .where("log.id IN (:...logIds)", { logIds })
      .andWhere("webhook.userId = :userId", { userId })
      .getMany();

    if (logs.length === 0) {
      return { deletedCount: 0 };
    }

    const idsToDelete = logs.map((log) => log.id);
    await this.logRepository.delete(idsToDelete);
    return { deletedCount: idsToDelete.length };
  }

  /**
   * Delete all logs for a specific webhook (verify ownership)
   */
  async deleteByWebhookId(userId: string, webhookId: string): Promise<{ deletedCount: number }> {
    // Verify webhook belongs to user
    await this.webhookService.findOne(userId, webhookId);

    const result = await this.logRepository.delete({ webhook: { id: webhookId } });
    return { deletedCount: result.affected ?? 0 };
  }

  /**
   * Delete logs before a specific date (verify ownership)
   */
  async deleteBeforeDate(userId: string, beforeDate: Date): Promise<{ deletedCount: number }> {
    // Get all webhook IDs for this user
    const webhooks = await this.webhookService.findAll(userId, { page: 1, limit: 1000 });
    const webhookIds = webhooks.items.map((w: { id: string }) => w.id);

    if (webhookIds.length === 0) {
      return { deletedCount: 0 };
    }

    const result = await this.logRepository
      .createQueryBuilder()
      .delete()
      .from(WebhookLog)
      .where("webhookId IN (:...webhookIds)", { webhookIds })
      .andWhere("receivedAt < :beforeDate", { beforeDate })
      .execute();

    return { deletedCount: result.affected ?? 0 };
  }
}
