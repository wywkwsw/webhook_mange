import { ConflictException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { CreateWebhookDto } from "./dto/create-webhook.dto";
import { UpdateWebhookDto } from "./dto/update-webhook.dto";
import { WebhookListQueryDto } from "./dto/webhook-list-query.dto";
import { Webhook } from "./entities/webhook.entity";
import { WebhookService } from "./webhook.service";

type QueryBuilderMock = {
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
  getOne: jest.Mock;
  delete: jest.Mock;
  from: jest.Mock;
  execute: jest.Mock;
};

function createQueryBuilderMock(): QueryBuilderMock {
  const qb: QueryBuilderMock = {
    where: jest.fn(() => qb),
    andWhere: jest.fn(() => qb),
    orderBy: jest.fn(() => qb),
    skip: jest.fn(() => qb),
    take: jest.fn(() => qb),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
    delete: jest.fn(() => qb),
    from: jest.fn(() => qb),
    execute: jest.fn(),
  };
  return qb;
}

describe("WebhookService", () => {
  it("create() throws ConflictException when path exists", async () => {
    const repository = {
      findOne: jest.fn(async () => ({ id: "w1" })),
    } as unknown as Repository<Webhook>;

    const service = new WebhookService(repository);
    const dto: CreateWebhookDto = {
      name: "GitHub",
      path: "github",
      secret: undefined,
      isActive: true,
      config: undefined,
    };

    await expect(service.create("u1", dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it("create() saves webhook", async () => {
    const saved = { id: "w1", name: "GitHub", path: "github" };
    const repository = {
      findOne: jest.fn(async () => null),
      create: jest.fn((v) => v),
      save: jest.fn(async () => saved),
    } as unknown as Repository<Webhook>;

    const service = new WebhookService(repository);
    const dto: CreateWebhookDto = { name: "GitHub", path: "github" } as CreateWebhookDto;

    const result = await service.create("u1", dto);
    expect(result).toEqual(saved);
  });

  it("findByPath() delegates to repository", async () => {
    const repository = {
      findOne: jest.fn(async () => ({ id: "w1" })),
    } as unknown as Repository<Webhook>;
    const service = new WebhookService(repository);

    const result = await service.findByPath("github");
    expect(result).toEqual({ id: "w1" });
  });

  it("findAll() applies pagination + filters", async () => {
    const qb = createQueryBuilderMock();
    qb.getManyAndCount.mockResolvedValue([[{ id: "w1" }], 1]);

    const repository = {
      createQueryBuilder: jest.fn(() => qb),
    } as unknown as Repository<Webhook>;
    const service = new WebhookService(repository);

    const query: WebhookListQueryDto = {
      page: 2,
      limit: 10,
      search: "git",
      isActive: true,
    };
    const result = await service.findAll("u1", query);

    expect(qb.where).toHaveBeenCalledWith("webhook.userId = :userId", { userId: "u1" });
    expect(qb.andWhere).toHaveBeenCalledWith("webhook.isActive = :isActive", {
      isActive: true,
    });
    expect(qb.andWhere).toHaveBeenCalledWith("webhook.name ILIKE :search", {
      search: "%git%",
    });
    expect(qb.skip).toHaveBeenCalledWith(10);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  it("findOne() throws NotFoundException when missing", async () => {
    const qb = createQueryBuilderMock();
    qb.getOne.mockResolvedValue(null);

    const repository = {
      createQueryBuilder: jest.fn(() => qb),
    } as unknown as Repository<Webhook>;
    const service = new WebhookService(repository);

    await expect(service.findOne("u1", "w1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("update() throws ConflictException when path exists", async () => {
    const repository = {
      findOne: jest.fn(async () => ({ id: "existing" })),
      save: jest.fn(),
    } as unknown as Repository<Webhook>;
    const service = new WebhookService(repository);
    jest.spyOn(service, "findOne").mockResolvedValue({
      id: "w1",
      name: "GitHub",
      path: "github",
      secret: null,
      isActive: true,
      config: null,
    } as unknown as Webhook);

    const dto: UpdateWebhookDto = { path: "other" };
    await expect(service.update("u1", "w1", dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it("remove() throws NotFoundException when affected = 0", async () => {
    const qb = createQueryBuilderMock();
    qb.execute.mockResolvedValue({ affected: 0 });

    const repository = {
      createQueryBuilder: jest.fn(() => qb),
    } as unknown as Repository<Webhook>;
    const service = new WebhookService(repository);

    await expect(service.remove("u1", "w1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("remove() returns deleted true when affected > 0", async () => {
    const qb = createQueryBuilderMock();
    qb.execute.mockResolvedValue({ affected: 1 });

    const repository = {
      createQueryBuilder: jest.fn(() => qb),
    } as unknown as Repository<Webhook>;
    const service = new WebhookService(repository);

    await expect(service.remove("u1", "w1")).resolves.toEqual({ deleted: true });
  });
});
