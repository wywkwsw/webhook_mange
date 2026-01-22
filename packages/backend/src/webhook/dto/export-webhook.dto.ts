import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

export class ExportWebhookDto {
  @ApiPropertyOptional({
    example: ["uuid1", "uuid2"],
    description: "要导出的 Webhook ID 列表，不传则导出全部",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}

/**
 * 导出的 Webhook 配置格式
 */
export interface WebhookExportItem {
  name: string;
  path: string;
  secret: string | null;
  isActive: boolean;
  config: Record<string, unknown> | null;
  forwardConfig: {
    enabled: boolean;
    targetUrl: string;
    method: "GET" | "POST" | "PUT" | "PATCH";
    headers?: Record<string, string>;
    bodyTemplate?: string;
    timeout?: number;
    retryCount?: number;
  } | null;
}

export interface WebhookExportData {
  version: string;
  exportedAt: string;
  webhooks: WebhookExportItem[];
}
