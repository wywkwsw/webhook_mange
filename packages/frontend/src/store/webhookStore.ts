import { create } from "zustand";
import client from "../api/client";
import type {
  Webhook,
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookLog,
} from "../types/webhook";

interface WebhookState {
  webhooks: Webhook[];
  currentWebhook: Webhook | null;
  webhookLogs: WebhookLog[];
  loading: boolean;
  error: string | null;
  fetchWebhooks: () => Promise<void>;
  fetchWebhook: (id: string) => Promise<void>;
  fetchWebhookLogs: (id: string) => Promise<void>;
  createWebhook: (data: CreateWebhookDto) => Promise<void>;
  updateWebhook: (id: string, data: UpdateWebhookDto) => Promise<void>;
  deleteWebhook: (id: string) => Promise<void>;
}

export const useWebhookStore = create<WebhookState>((set, get) => ({
  webhooks: [],
  currentWebhook: null,
  webhookLogs: [],
  loading: false,
  error: null,

  fetchWebhooks: async () => {
    set({ loading: true, error: null });
    try {
      interface PaginatedResponse {
        items: Webhook[];
        total: number;
        page: number;
        limit: number;
      }
      const response = await client.get<PaginatedResponse>("/webhooks");
      set({ webhooks: response.data.items, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch webhooks";
      set({ error: message, loading: false });
    }
  },

  fetchWebhook: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await client.get<Webhook>(`/webhooks/${id}`);
      set({ currentWebhook: response.data, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch webhook";
      set({ error: message, loading: false });
    }
  },

  fetchWebhookLogs: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await client.get<WebhookLog[]>(`/webhooks/${id}/logs`);
      set({ webhookLogs: response.data, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch logs";
      set({ error: message, loading: false });
    }
  },

  createWebhook: async (data: CreateWebhookDto) => {
    set({ loading: true, error: null });
    try {
      const response = await client.post<Webhook>("/webhooks", data);
      set((state) => ({
        webhooks: [response.data, ...state.webhooks],
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create webhook";
      set({ error: message, loading: false });
      throw error;
    }
  },

  updateWebhook: async (id: string, data: UpdateWebhookDto) => {
    set({ loading: true, error: null });
    try {
      const response = await client.patch<Webhook>(`/webhooks/${id}`, data);
      set((state) => ({
        webhooks: state.webhooks.map((w) =>
          w.id === id ? response.data : w,
        ),
        currentWebhook: get().currentWebhook?.id === id ? response.data : get().currentWebhook,
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update webhook";
      set({ error: message, loading: false });
      throw error;
    }
  },

  deleteWebhook: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await client.delete(`/webhooks/${id}`);
      set((state) => ({
        webhooks: state.webhooks.filter((w) => w.id !== id),
        loading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete webhook";
      set({ error: message, loading: false });
      throw error;
    }
  },
}));
