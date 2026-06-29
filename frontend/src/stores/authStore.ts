import { create } from 'zustand';
import { getToken, setToken, removeToken } from '../utils/token';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string) => void;
  clearAuth: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
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
