import { create } from "zustand";
import { getToken, setToken, removeToken } from "../utils/token";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string) => void;
  clearAuth: () => void;
  initialize: () => void;
}

// 同步初始化：创建 store 时立即从 localStorage 读取 token
const initialToken = getToken();

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  isAuthenticated: !!initialToken,
  setAuth: (token: string) => {
    setToken(token);
    set({ token, isAuthenticated: true });
  },
  clearAuth: () => {
    removeToken();
    set({ token: null, isAuthenticated: false });
  },
  initialize: () => {
    const token = getToken();
    if (token) {
      set({ token, isAuthenticated: true });
    }
  },
}));
