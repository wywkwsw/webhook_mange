import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

class ForwardConfigDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: "https://api.telegram.org/bot.../sendMessage" })
  @IsString()
  targetUrl: string;

  @ApiProperty({ example: "POST", enum: ["GET", "POST", "PUT", "PATCH"] })
  @IsEnum(["GET", "POST", "PUT", "PATCH"])
  method: "GET" | "POST" | "PUT" | "PATCH";

  @ApiPropertyOptional({ example: { "Content-Type": "application/json" } })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ example: '{"text": "{{payload}}"}' })
  @IsOptional()
  @IsString()
  bodyTemplate?: string;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  timeout?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  retryCount?: number;
}

export class WebhookImportItemDto {
  @ApiProperty({ example: "TradingView Alert" })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: "tradingview" })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  path: string;

  @ApiPropertyOptional({ example: "my_secret" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  secret?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: { event: "alert" } })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ForwardConfigDto)
  forwardConfig?: ForwardConfigDto | null;
}

export class ImportWebhookDto {
  @ApiProperty({ example: "1.0" })
  @IsString()
  version: string;

  @ApiProperty({ type: [WebhookImportItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WebhookImportItemDto)
  webhooks: WebhookImportItemDto[];
}

export enum ImportMode {
  /** 跳过已存在的 path */
  SKIP = "skip",
  /** 覆盖已存在的 path */
  OVERWRITE = "overwrite",
  /** 重命名冲突的 path（添加后缀） */
  RENAME = "rename",
}

export class ImportWebhookQueryDto {
  @ApiPropertyOptional({
    enum: ImportMode,
    default: ImportMode.SKIP,
    description: "导入模式：skip-跳过冲突, overwrite-覆盖, rename-重命名",
  })
  @IsOptional()
  @IsEnum(ImportMode)
  mode?: ImportMode;
}

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  overwritten: number;
  renamed: number;
  errors: { path: string; error: string }[];
}
