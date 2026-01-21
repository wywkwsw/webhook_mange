import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * 转发配置 DTO
 */
export class ForwardConfigDto {
  @ApiProperty({ example: true, description: "是否启用转发" })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    example: "https://api.telegram.org/bot<token>/sendMessage",
    description: "目标 URL",
  })
  @IsString()
  @IsUrl({}, { message: "targetUrl 必须是有效的 URL" })
  targetUrl: string;

  @ApiPropertyOptional({
    example: "POST",
    default: "POST",
    description: "HTTP 方法",
    enum: ["GET", "POST", "PUT", "PATCH"],
  })
  @IsOptional()
  @IsEnum(["GET", "POST", "PUT", "PATCH"])
  method?: "GET" | "POST" | "PUT" | "PATCH";

  @ApiPropertyOptional({
    example: { Authorization: "Bearer xxx" },
    description: "自定义请求头",
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    example: '{"chat_id": "123", "text": "收到消息: {{payload.message}}"}',
    description:
      "消息模板（支持变量：{{payload}}, {{payload.xxx}}, {{time}}, {{time_cn}}, {{method}}, {{webhookName}}, {{webhookPath}}）",
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  bodyTemplate?: string;

  @ApiPropertyOptional({
    example: 10000,
    default: 10000,
    description: "超时时间（毫秒）",
  })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(60000)
  timeout?: number;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: "重试次数",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  retryCount?: number;
}

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

  @ApiPropertyOptional({
    description: "转发配置",
    type: ForwardConfigDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ForwardConfigDto)
  forwardConfig?: ForwardConfigDto;
}
