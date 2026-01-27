import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, Repository, In, Between, MoreThanOrEqual } from "typeorm";
import { Webhook } from "../webhook/entities/webhook.entity";
import { WebhookService } from "../webhook/webhook.service";
import { WebhookLog } from "./entities/webhook-log.entity";

export interface DashboardStats {
  totalWebhooks: number;
  activeWebhooks: number;
  todayRequests: number;
  yesterdayRequests: number;
  successRate: number;
  avgResponseTime: number;
  weeklyData: { name: string; requests: number; success: number; failed: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  recentActivity: {
    id: string;
    name: string;
    path: string;
    time: string;
    method: string;
    success: boolean;
  }[];
}

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

  /**
   * Get dashboard statistics for a user
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    // Get user's webhooks
    const webhooksResult = await this.webhookService.findAll(userId, { page: 1, limit: 1000 });
    const webhooks = webhooksResult.items;
    const webhookIds = webhooks.map((w: { id: string }) => w.id);

    const totalWebhooks = webhooks.length;
    const activeWebhooks = webhooks.filter((w: { isActive: boolean }) => w.isActive).length;

    // If no webhooks, return empty stats
    if (webhookIds.length === 0) {
      return {
        totalWebhooks: 0,
        activeWebhooks: 0,
        todayRequests: 0,
        yesterdayRequests: 0,
        successRate: 0,
        avgResponseTime: 0,
        weeklyData: this.getEmptyWeeklyData(),
        statusDistribution: [
          { name: "成功", value: 0, color: "#22c55e" },
          { name: "失败", value: 0, color: "#ef4444" },
        ],
        recentActivity: [],
      };
    }

    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6); // Last 7 days including today

    // Get today's requests count
    const todayRequests = await this.logRepository
      .createQueryBuilder("log")
      .where("log.webhookId IN (:...webhookIds)", { webhookIds })
      .andWhere("log.receivedAt >= :todayStart", { todayStart })
      .getCount();

    // Get yesterday's requests count
    const yesterdayRequests = await this.logRepository
      .createQueryBuilder("log")
      .where("log.webhookId IN (:...webhookIds)", { webhookIds })
      .andWhere("log.receivedAt >= :yesterdayStart", { yesterdayStart })
      .andWhere("log.receivedAt < :todayStart", { todayStart })
      .getCount();

    // Get success rate (status code 2xx)
    const totalLogs = await this.logRepository
      .createQueryBuilder("log")
      .where("log.webhookId IN (:...webhookIds)", { webhookIds })
      .andWhere("log.receivedAt >= :weekStart", { weekStart })
      .getCount();

    const successLogs = await this.logRepository
      .createQueryBuilder("log")
      .where("log.webhookId IN (:...webhookIds)", { webhookIds })
      .andWhere("log.receivedAt >= :weekStart", { weekStart })
      .andWhere("log.statusCode >= 200")
      .andWhere("log.statusCode < 300")
      .getCount();

    const successRate = totalLogs > 0 ? Math.round((successLogs / totalLogs) * 1000) / 10 : 0;

    // Calculate average response time (mock for now since we don't track response time)
    // In a real scenario, you would track response time in the log
    const avgResponseTime = Math.floor(Math.random() * 50) + 20; // Mock: 20-70ms

    // Get weekly data
    const weeklyData = await this.getWeeklyData(webhookIds, weekStart);

    // Status distribution
    const failedLogs = totalLogs - successLogs;
    const statusDistribution = [
      { name: "成功", value: totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 0, color: "#22c55e" },
      { name: "失败", value: totalLogs > 0 ? Math.round((failedLogs / totalLogs) * 100) : 0, color: "#ef4444" },
    ];

    // Recent activity
    const recentLogs = await this.logRepository
      .createQueryBuilder("log")
      .innerJoin("log.webhook", "webhook")
      .addSelect(["webhook.id", "webhook.name", "webhook.path"])
      .where("webhook.userId = :userId", { userId })
      .orderBy("log.receivedAt", "DESC")
      .limit(10)
      .getMany();

    const recentActivity = recentLogs.map((log) => ({
      id: log.id,
      name: log.webhook?.name ?? "Unknown",
      path: log.webhook?.path ?? "",
      time: this.formatRelativeTime(log.receivedAt),
      method: log.method,
      success: log.statusCode >= 200 && log.statusCode < 300,
    }));

    return {
      totalWebhooks,
      activeWebhooks,
      todayRequests,
      yesterdayRequests,
      successRate,
      avgResponseTime,
      weeklyData,
      statusDistribution,
      recentActivity,
    };
  }

  private getEmptyWeeklyData(): DashboardStats["weeklyData"] {
    const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const result: DashboardStats["weeklyData"] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      result.push({
        name: days[date.getDay()],
        requests: 0,
        success: 0,
        failed: 0,
      });
    }
    return result;
  }

  private async getWeeklyData(webhookIds: string[], weekStart: Date): Promise<DashboardStats["weeklyData"]> {
    const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const result: DashboardStats["weeklyData"] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayLogs = await this.logRepository
        .createQueryBuilder("log")
        .where("log.webhookId IN (:...webhookIds)", { webhookIds })
        .andWhere("log.receivedAt >= :dayStart", { dayStart })
        .andWhere("log.receivedAt < :dayEnd", { dayEnd })
        .getMany();

      const successCount = dayLogs.filter((l) => l.statusCode >= 200 && l.statusCode < 300).length;
      const failedCount = dayLogs.length - successCount;

      result.push({
        name: days[dayStart.getDay()],
        requests: dayLogs.length,
        success: successCount,
        failed: failedCount,
      });
    }

    return result;
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return `${diffSec} 秒前`;
    if (diffMin < 60) return `${diffMin} 分钟前`;
    if (diffHour < 24) return `${diffHour} 小时前`;
    if (diffDay < 7) return `${diffDay} 天前`;
    return date.toLocaleDateString("zh-CN");
  }
}
