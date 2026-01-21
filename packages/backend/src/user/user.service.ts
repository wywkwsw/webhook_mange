import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";

export type CreateUserInput = {
  username: string;
  passwordHash: string;
  email?: string | null;
};

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const user = this.userRepository.create({
      username: input.username,
      passwordHash: input.passwordHash,
      email: input.email ?? null,
    });

    const saved = await this.userRepository.save(user);
    const created = await this.findOne(saved.id);
    if (!created) {
      throw new Error("User created but not found");
    }
    return created;
  }

  async findOne(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.username = :username", { username })
      .getOne();
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.id = :id", { id })
      .getOne();
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    await this.userRepository.update(userId, { passwordHash: newPasswordHash });
  }
}
