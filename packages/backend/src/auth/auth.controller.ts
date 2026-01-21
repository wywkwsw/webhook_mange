import { Body, Controller, Get, HttpCode, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

type AuthenticatedUser = {
  userId: string;
  username: string;
};

function getUserId(req: Request): string {
  const user = req.user as AuthenticatedUser | undefined;
  if (!user?.userId) {
    throw new UnauthorizedException();
  }
  return user.userId;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "用户注册" })
  @ApiCreatedResponse({
    description: "注册成功",
    schema: {
      example: {
        id: "uuid",
        username: "demo",
        email: "demo@example.com",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiConflictResponse({ description: "用户名已存在" })
  @Post("register")
  async register(@Body() body: RegisterDto) {
    return await this.authService.register(body);
  }

  @ApiOperation({ summary: "用户登录" })
  @ApiOkResponse({
    description: "登录成功",
    schema: { example: { accessToken: "jwt_token" } },
  })
  @ApiUnauthorizedResponse({ description: "用户名或密码错误" })
  @HttpCode(200)
  @Post("login")
  async login(@Body() body: LoginDto) {
    return await this.authService.login(body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "获取当前用户信息" })
  @ApiOkResponse({ schema: { example: { userId: "uuid", username: "demo" } } })
  @ApiUnauthorizedResponse({ description: "缺少或无效的 JWT" })
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async profile(@Req() req: Request) {
    return req.user;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "修改密码" })
  @ApiOkResponse({
    description: "密码修改成功",
    schema: { example: { message: "Password changed successfully" } },
  })
  @ApiUnauthorizedResponse({ description: "当前密码错误或 JWT 无效" })
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post("change-password")
  async changePassword(@Req() req: Request, @Body() body: ChangePasswordDto) {
    const userId = getUserId(req);
    return await this.authService.changePassword(userId, body);
  }
}
