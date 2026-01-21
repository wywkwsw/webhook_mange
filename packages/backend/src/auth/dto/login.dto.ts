import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "demo", description: "用户名（最少 3 个字符）" })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: "password123", description: "密码" })
  @IsString()
  @MinLength(1)
  password: string;
}
