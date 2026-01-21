import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, LoginDto } from "../types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (credentials: LoginDto) => {
        // Mock login
        return new Promise((resolve) => {
          setTimeout(() => {
            const mockUser = {
              id: "1",
              username: credentials.username,
              avatar:
                "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                credentials.username,
            };
            const mockToken = "mock-jwt-token-" + Date.now();

            set({
              user: mockUser,
              token: mockToken,
              isAuthenticated: true,
            });
            resolve();
          }, 500);
        });
      },
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
