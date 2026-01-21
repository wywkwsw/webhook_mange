import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UserService } from "../user/user.service";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  it("throws ConflictException when username already exists", async () => {
    const userService = {
      findByUsername: jest.fn(async () => ({ id: "u1" })),
    } as unknown as UserService;
    const jwtService = {
      signAsync: jest.fn(),
    } as unknown as JwtService;
    const configService = {
      get: jest.fn(() => "4"),
    } as unknown as ConfigService;

    const service = new AuthService(userService, jwtService, configService);
    await expect(
      service.register({ username: "demo", password: "password123" }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("throws UnauthorizedException when user not found", async () => {
    const userService = {
      findByUsername: jest.fn(async () => null),
    } as unknown as UserService;
    const jwtService = {
      signAsync: jest.fn(),
    } as unknown as JwtService;
    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService;

    const service = new AuthService(userService, jwtService, configService);
    await expect(
      service.login({ username: "demo", password: "password123" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("throws UnauthorizedException when password mismatch", async () => {
    const passwordHash = await bcrypt.hash("password123", 4);
    const userService = {
      findByUsername: jest.fn(async () => ({
        id: "u1",
        username: "demo",
        passwordHash,
      })),
    } as unknown as UserService;
    const jwtService = {
      signAsync: jest.fn(),
    } as unknown as JwtService;
    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService;

    const service = new AuthService(userService, jwtService, configService);
    await expect(
      service.login({ username: "demo", password: "wrong_password" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
