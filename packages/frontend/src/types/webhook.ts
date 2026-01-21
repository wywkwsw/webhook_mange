export interface Webhook {
  id: string;
  name: string;
  path: string;
  secret: string | null;
  isActive: boolean;
  config: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookDto {
  name: string;
  path: string;
  secret?: string;
  isActive?: boolean;
  config?: Record<string, unknown>;
}

export interface UpdateWebhookDto {
  name?: string;
  path?: string;
  secret?: string | null;
  isActive?: boolean;
  config?: Record<string, unknown> | null;
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
