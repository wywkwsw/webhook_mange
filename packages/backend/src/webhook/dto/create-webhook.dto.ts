import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateWebhookDto {
  @ApiProperty({ example: "GitHub", description: "Webhook 名称（1-100 字符）" })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: "github",
    description: "Webhook 路径（URL-safe，唯一）",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: "path must be url-safe (letters, numbers, '_' or '-')",
  })
  path: string;

  @ApiPropertyOptional({ example: "my_secret", description: "签名密钥（可选）" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  secret?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: "是否启用（默认 true）",
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: { event: "push" },
    description: "自定义配置（可选 JSON）",
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
