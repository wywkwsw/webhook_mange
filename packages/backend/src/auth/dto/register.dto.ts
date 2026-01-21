import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "demo", description: "用户名（最少 3 个字符）" })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: "password123", description: "密码（最少 6 个字符）" })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: "demo@example.com", description: "邮箱（可选）" })
  @IsOptional()
  @IsEmail()
  email?: string;
}
