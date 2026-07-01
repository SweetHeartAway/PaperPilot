import { useEffect, useRef } from "react";
import Spinner from "./Spinner";
import { XCircleIcon } from "./Icons";
import { useToastStore } from "../../stores/toastStore";
import type { ToastType } from "../../stores/toastStore";

/* ─── 图标映射 ─── */

const icons: Record<ToastType, string> = {
  success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  error: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  loading: "", // uses spinner
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

/* ─── 颜色映射 ─── */

const colors: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "text-green-500",
    text: "text-green-800",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-500",
    text: "text-red-800",
  },
  loading: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-500",
    text: "text-blue-800",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-500",
    text: "text-blue-800",
  },
};

/* ─── 单条 Toast ─── */

function ToastItem({
  type,
  message,
  onDismiss,
}: {
  type: ToastType;
  message: string;
  onDismiss: () => void;
}) {
  const c = colors[type];

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg ${c.bg} ${c.border} animate-slide-in`}
    >
      {/* Icon */}
      {type === "loading" ? (
        <Spinner size="md" variant="blue" className="shrink-0" />
      ) : (
        <svg
          className={`h-5 w-5 shrink-0 ${c.icon}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={icons[type]} />
        </svg>
      )}

      {/* Message */}
      <p className={`flex-1 text-sm ${c.text}`}>{message}</p>

      {/* Close button */}
      <button
        onClick={onDismiss}
        className={`shrink-0 rounded p-0.5 transition-colors hover:bg-black/5 ${c.text}`}
        aria-label="关闭通知"
      >
        <XCircleIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── 容器 ─── */

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Auto-dismiss
  useEffect(() => {
    for (const toast of toasts) {
      if (toast.duration > 0 && !timersRef.current.has(toast.id)) {
        const timer = setTimeout(() => remove(toast.id), toast.duration);
        timersRef.current.set(toast.id, timer);
      }
    }
    // Cleanup timers for removed toasts
    for (const [id, timer] of timersRef.current) {
      if (!toasts.find((t) => t.id === id)) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    }
  }, [toasts, remove]);

  // Cleanup all on unmount
  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2"
      aria-live="polite"
      aria-label="通知列表"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onDismiss={() => remove(toast.id)}
        />
      ))}
    </div>
  );
}
