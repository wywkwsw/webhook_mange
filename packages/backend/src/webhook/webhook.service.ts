import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../user/entities/user.entity";
import { CreateWebhookDto } from "./dto/create-webhook.dto";
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
}
