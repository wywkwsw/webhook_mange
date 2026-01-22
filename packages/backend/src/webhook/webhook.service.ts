import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { User } from "../user/entities/user.entity";
import { CreateWebhookDto } from "./dto/create-webhook.dto";
import { WebhookExportData, WebhookExportItem } from "./dto/export-webhook.dto";
import {
  ImportMode,
  ImportResult,
  WebhookImportItemDto,
} from "./dto/import-webhook.dto";
import { UpdateWebhookDto } from "./dto/update-webhook.dto";
import { WebhookListQueryDto } from "./dto/webhook-list-query.dto";
import { Webhook } from "./entities/webhook.entity";

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
  ) {}

  async create(userId: string, dto: CreateWebhookDto): Promise<Webhook> {
    const existing = await this.webhookRepository.findOne({
      where: { path: dto.path },
    });
    if (existing) {
      throw new ConflictException("Webhook path already exists");
    }

    const webhook = this.webhookRepository.create({
      name: dto.name,
      path: dto.path,
      secret: dto.secret ?? null,
      isActive: dto.isActive ?? true,
      config: dto.config ?? null,
      user: { id: userId } as unknown as User,
    });
    return await this.webhookRepository.save(webhook);
  }

  async findByPath(path: string): Promise<Webhook | null> {
    return await this.webhookRepository.findOne({
      where: { path },
    });
  }

  async findAll(
    userId: string,
    query: WebhookListQueryDto,
  ): Promise<{ items: Webhook[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.webhookRepository
      .createQueryBuilder("webhook")
      .where("webhook.userId = :userId", { userId });

    if (typeof query.isActive === "boolean") {
      qb.andWhere("webhook.isActive = :isActive", {
        isActive: query.isActive,
      });
    }

    if (query.search) {
      qb.andWhere("webhook.name ILIKE :search", {
        search: `%${query.search}%`,
      });
    }

    const [items, total] = await qb
      .orderBy("webhook.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async findOne(userId: string, id: string): Promise<Webhook> {
    const webhook = await this.webhookRepository
      .createQueryBuilder("webhook")
      .where("webhook.id = :id", { id })
      .andWhere("webhook.userId = :userId", { userId })
      .getOne();
    if (!webhook) {
      throw new NotFoundException("Webhook not found");
    }
    return webhook;
  }

  async update(userId: string, id: string, dto: UpdateWebhookDto): Promise<Webhook> {
    const webhook = await this.findOne(userId, id);

    if (dto.path && dto.path !== webhook.path) {
      const existing = await this.webhookRepository.findOne({
        where: { path: dto.path },
      });
      if (existing) {
        throw new ConflictException("Webhook path already exists");
      }
    }

    Object.assign(webhook, {
      name: dto.name ?? webhook.name,
      path: dto.path ?? webhook.path,
      secret: dto.secret === undefined ? webhook.secret : dto.secret,
      isActive: dto.isActive ?? webhook.isActive,
      config: dto.config === undefined ? webhook.config : dto.config,
    });

    return await this.webhookRepository.save(webhook);
  }

  async remove(userId: string, id: string): Promise<{ deleted: true }> {
    const result = await this.webhookRepository
      .createQueryBuilder()
      .delete()
      .from(Webhook)
      .where("id = :id", { id })
      .andWhere("userId = :userId", { userId })
      .execute();
    if (!result.affected) {
      throw new NotFoundException("Webhook not found");
    }
    return { deleted: true };
  }

  /**
   * 导出 Webhook 配置
   */
  async exportWebhooks(userId: string, ids?: string[]): Promise<WebhookExportData> {
    let webhooks: Webhook[];

    if (ids && ids.length > 0) {
      webhooks = await this.webhookRepository.find({
        where: {
          id: In(ids),
          user: { id: userId },
        },
      });
    } else {
      webhooks = await this.webhookRepository.find({
        where: { user: { id: userId } },
        order: { createdAt: "DESC" },
      });
    }

    const exportItems: WebhookExportItem[] = webhooks.map((w) => ({
      name: w.name,
      path: w.path,
      secret: w.secret,
      isActive: w.isActive,
      config: w.config,
      forwardConfig: w.forwardConfig,
    }));

    return {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      webhooks: exportItems,
    };
  }

  /**
   * 导入 Webhook 配置
   */
  async importWebhooks(
    userId: string,
    webhooks: WebhookImportItemDto[],
    mode: ImportMode = ImportMode.SKIP,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total: webhooks.length,
      imported: 0,
      skipped: 0,
      overwritten: 0,
      renamed: 0,
      errors: [],
    };

    for (const item of webhooks) {
      try {
        const existing = await this.webhookRepository.findOne({
          where: { path: item.path },
        });

        if (existing) {
          // 检查是否属于当前用户
          const isOwnWebhook = await this.webhookRepository.findOne({
            where: { path: item.path, user: { id: userId } },
          });

          if (mode === ImportMode.SKIP) {
            result.skipped++;
            continue;
          }

          if (mode === ImportMode.OVERWRITE) {
            if (!isOwnWebhook) {
              result.errors.push({
                path: item.path,
                error: "路径已被其他用户使用，无法覆盖",
              });
              continue;
            }
            // 更新现有 webhook
            Object.assign(existing, {
              name: item.name,
              secret: item.secret ?? null,
              isActive: item.isActive ?? true,
              config: item.config ?? null,
              forwardConfig: item.forwardConfig ?? null,
            });
            await this.webhookRepository.save(existing);
            result.overwritten++;
            continue;
          }

          if (mode === ImportMode.RENAME) {
            // 生成新路径
            let newPath = item.path;
            let suffix = 1;
            while (
              await this.webhookRepository.findOne({ where: { path: newPath } })
            ) {
              newPath = `${item.path}-${suffix}`;
              suffix++;
            }

            const webhook = this.webhookRepository.create({
              name: item.name,
              path: newPath,
              secret: item.secret ?? null,
              isActive: item.isActive ?? true,
              config: item.config ?? null,
              forwardConfig: item.forwardConfig ?? null,
              user: { id: userId } as unknown as User,
            });
            await this.webhookRepository.save(webhook);
            result.renamed++;
            continue;
          }
        } else {
          // 创建新 webhook
          const webhook = this.webhookRepository.create({
            name: item.name,
            path: item.path,
            secret: item.secret ?? null,
            isActive: item.isActive ?? true,
            config: item.config ?? null,
            forwardConfig: item.forwardConfig ?? null,
            user: { id: userId } as unknown as User,
          });
          await this.webhookRepository.save(webhook);
          result.imported++;
        }
      } catch (error) {
        result.errors.push({
          path: item.path,
          error: error instanceof Error ? error.message : "未知错误",
        });
      }
    }

    return result;
  }
}
