import axios from "axios";
import { useAuthStore } from "../store/authStore";

const client = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

// Request interceptor
client.interceptors.request.use(
  (config) => {
    // Use token from Zustand store
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // 401 Unauthorized: Logout and redirect (via state change)
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default client;
