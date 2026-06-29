import { useEffect, useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import { getCurrentUser } from "../api/auth";
import type { User } from "../types/user";

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.initialize();
  }, [store.initialize]);

  const fetchUser = useCallback(async (): Promise<User | null> => {
    if (!store.isAuthenticated) return null;
    try {
      return await getCurrentUser();
    } catch {
      store.clearAuth();
      return null;
    }
  }, [store.isAuthenticated, store.clearAuth]);

  return {
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    setAuth: store.setAuth,
    clearAuth: store.clearAuth,
    fetchUser,
  };
}
