import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import { AddressInfo } from "node:net";
import { UserService } from "../user/user.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";

describe("AuthController", () => {
  let app: INestApplication;
  let baseUrl: string;

  type MockUser = {
    id: string;
    username: string;
    passwordHash?: string;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  type MockUserService = {
    create(input: {
      username: string;
      passwordHash: string;
      email?: string | null;
    }): Promise<MockUser>;
    findOne(id: string): Promise<MockUser | null>;
    findByUsername(username: string): Promise<MockUser | null>;
  };

  const users = new Map<
    string,
    {
      id: string;
      username: string;
      passwordHash: string;
      email: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  >();

  const mockUserService: MockUserService = {
    async create(input) {
      const id = randomUUID();
      const now = new Date();
      users.set(input.username, {
        id,
        username: input.username,
        passwordHash: input.passwordHash,
        email: input.email ?? null,
        createdAt: now,
        updatedAt: now,
      });

      return {
        id,
        username: input.username,
        email: input.email ?? null,
        createdAt: now,
        updatedAt: now,
      };
    },
    async findOne(id) {
      for (const user of users.values()) {
        if (user.id === id) {
          return {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          };
        }
      }
      return null;
    },
    async findByUsername(username) {
      const user = users.get(username);
      return user
        ? {
            id: user.id,
            username: user.username,
            passwordHash: user.passwordHash,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }
        : null;
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = "test_secret";
    process.env.JWT_EXPIRES_IN = "1h";
    process.env.BCRYPT_SALT_ROUNDS = "4";

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PassportModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        {
          provide: UserService,
          useValue: mockUserService as unknown as UserService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    const server = await app.listen(0);
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("denies profile without JWT", async () => {
    const res = await fetch(`${baseUrl}/api/auth/profile`);
    expect(res.status).toBe(401);
  });

  it("register -> login -> profile", async () => {
    const username = `u_${Math.random().toString(16).slice(2)}`;
    const email = `${username}@example.com`;

    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username,
        password: "password123",
        email,
      }),
    });

    expect(registerRes.status).toBe(201);
    const registered = await registerRes.json();
    expect(registered).toMatchObject({ username, email });
    expect(registered).not.toHaveProperty("passwordHash");

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username,
        password: "password123",
      }),
    });

    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.json();
    expect(loginBody.accessToken).toEqual(expect.any(String));

    const profileRes = await fetch(`${baseUrl}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${loginBody.accessToken}` },
    });

    expect(profileRes.status).toBe(200);
    const profile = await profileRes.json();
    expect(profile).toMatchObject({ userId: registered.id, username });
  });
});
