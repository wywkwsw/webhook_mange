import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import type { User, LoginDto } from "../types/auth";

interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
  };
}

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
        const response = await axios.post<LoginResponse>("/api/auth/login", credentials);
        const { access_token, user } = response.data;

        set({
          user: {
            id: user.id,
            username: user.username,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
          },
          token: access_token,
          isAuthenticated: true,
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
