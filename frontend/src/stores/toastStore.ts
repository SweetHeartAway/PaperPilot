import { create } from "zustand";

export type ToastType = "success" | "error" | "loading" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  /** Auto-dismiss delay in ms. 0 = persistent (must be dismissed manually). */
  duration: number;
}

interface ToastState {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, "id">) => string;
  remove: (id: string) => void;
  clear: () => void;
}

let _nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  add: (toast) => {
    const id = `toast-${++_nextId}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    return id;
  },

  remove: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  clear: () => {
    set({ toasts: [] });
  },
}));
