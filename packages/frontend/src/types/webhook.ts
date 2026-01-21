/**
 * 转发配置
 */
export interface ForwardConfig {
  /** 是否启用转发 */
  enabled: boolean;
  /** 目标 URL */
  targetUrl: string;
  /** HTTP 方法 */
  method: "GET" | "POST" | "PUT" | "PATCH";
  /** 自定义请求头 */
  headers?: Record<string, string>;
  /** 消息模板 */
  bodyTemplate?: string;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 重试次数 */
  retryCount?: number;
}

export interface Webhook {
  id: string;
  name: string;
  path: string;
  secret: string | null;
  isActive: boolean;
  config: Record<string, unknown> | null;
  forwardConfig: ForwardConfig | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookDto {
  name: string;
  path: string;
  secret?: string;
  isActive?: boolean;
  config?: Record<string, unknown>;
  forwardConfig?: ForwardConfig;
}

export interface UpdateWebhookDto {
  name?: string;
  path?: string;
  secret?: string | null;
  isActive?: boolean;
  config?: Record<string, unknown> | null;
  forwardConfig?: ForwardConfig | null;
}

export interface WebhookLog {
  id: string;
  method: string;
  headers: Record<string, string>;
  payload: Record<string, unknown> | null;
  statusCode: number;
  response: Record<string, unknown> | null;
  receivedAt: string;
}
