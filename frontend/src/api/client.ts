import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      const currentPath = window.location.pathname;
      // 保留来源路径，登录后可以跳转回来
      if (currentPath !== "/login" && currentPath !== "/register") {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      } else {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default client;
