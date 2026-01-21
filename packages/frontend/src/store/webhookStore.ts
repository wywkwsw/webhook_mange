import { create } from "zustand";
import type {
  Webhook,
  CreateWebhookDto,
  UpdateWebhookDto,
} from "../types/webhook";

interface WebhookState {
  webhooks: Webhook[];
  loading: boolean;
  error: string | null;
  fetchWebhooks: () => Promise<void>;
  createWebhook: (data: CreateWebhookDto) => Promise<void>;
  updateWebhook: (id: string, data: UpdateWebhookDto) => Promise<void>;
  deleteWebhook: (id: string) => Promise<void>;
}

export const useWebhookStore = create<WebhookState>((set) => ({
  webhooks: [],
  loading: false,
  error: null,

  fetchWebhooks: async () => {
    set({ loading: true, error: null });
    // Mock API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const mockWebhooks: Webhook[] = [
        {
          id: "1",
          name: "Payment Notification",
          url: "https://api.example.com/hooks/payment",
          method: "POST",
          status: "active",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "User Signup",
          url: "https://api.example.com/hooks/signup",
          method: "POST",
          status: "inactive",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      set({ webhooks: mockWebhooks, loading: false });
    } catch {
      set({ error: "Failed to fetch webhooks", loading: false });
    }
  },

  createWebhook: async (data: CreateWebhookDto) => {
    set({ loading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newWebhook: Webhook = {
        id: Date.now().toString(),
        name: data.name,
        url: "https://api.example.com/generated/" + Date.now(),
        method: data.method,
        status: "active",
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        webhooks: [newWebhook, ...state.webhooks],
        loading: false,
      }));
    } catch {
      set({ error: "Failed to create webhook", loading: false });
    }
  },

  updateWebhook: async (id: string, data: UpdateWebhookDto) => {
    set({ loading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      set((state) => ({
        webhooks: state.webhooks.map((w) =>
          w.id === id ? { ...w, ...data } : w,
        ),
        loading: false,
      }));
    } catch {
      set({ error: "Failed to update webhook", loading: false });
    }
  },

  deleteWebhook: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      set((state) => ({
        webhooks: state.webhooks.filter((w) => w.id !== id),
        loading: false,
      }));
    } catch {
      set({ error: "Failed to delete webhook", loading: false });
    }
  },
}));
