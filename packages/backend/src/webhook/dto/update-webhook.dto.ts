import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateWebhookDto {
  @ApiPropertyOptional({
    example: "GitHub",
    description: "Webhook 名称（1-100 字符）",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: "github",
    description: "Webhook 路径（URL-safe，唯一）",
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: "path must be url-safe (letters, numbers, '_' or '-')",
  })
  path?: string;

  @ApiPropertyOptional({
    example: "my_secret",
    description: "签名密钥（可选，支持传 null 清空）",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  secret?: string | null;

  @ApiPropertyOptional({ example: true, description: "是否启用" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: { event: "push" },
    description: "自定义配置（可选，支持传 null 清空）",
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;
}
