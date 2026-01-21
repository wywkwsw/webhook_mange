import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ example: "oldPassword123", description: "当前密码" })
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @ApiProperty({ example: "newPassword456", description: "新密码（最少 6 个字符）" })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
