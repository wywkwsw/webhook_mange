import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UserService } from "../user/user.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(input: { username: string; password: string; email?: string }) {
    const existing = await this.userService.findByUsername(input.username);
    if (existing) {
      throw new ConflictException("Username already exists");
    }

    const saltRoundsRaw = this.configService.get<string>("BCRYPT_SALT_ROUNDS") ?? "10";
    const saltRounds = Number.parseInt(saltRoundsRaw, 10);
    const passwordHash = await bcrypt.hash(
      input.password,
      Number.isNaN(saltRounds) ? 10 : saltRounds,
    );

    return await this.userService.create({
      username: input.username,
      passwordHash,
      email: input.email ?? null,
    });
  }

  async login(input: { username: string; password: string }) {
    const user = await this.userService.findByUsername(input.username);
    if (!user?.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = { sub: user.id, username: user.username };
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}
