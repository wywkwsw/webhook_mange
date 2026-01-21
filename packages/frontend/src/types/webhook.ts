export interface Webhook {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  status: "active" | "inactive";
  createdAt: string;
}

export interface CreateWebhookDto {
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
}

export interface UpdateWebhookDto {
  name?: string;
  status?: "active" | "inactive";
}
