import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "demo" })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: "demo@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;
}
