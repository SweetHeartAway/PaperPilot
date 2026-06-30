import { useCallback } from "react";
import { useToastStore } from "../stores/toastStore";

export interface ToastApi {
  /** 成功提示，3 秒后自动消失 */
  success: (message: string) => void;
  /** 失败提示，5 秒后自动消失 */
  error: (message: string) => void;
  /** 加载中提示，需手动 dismiss。返回 dismiss 函数 */
  loading: (message: string) => () => void;
  /** 信息提示，3 秒后自动消失 */
  info: (message: string) => void;
  /** 手动关闭指定 id 的 toast */
  dismiss: (id: string) => void;
}

export function useToast(): ToastApi {
  const add = useToastStore((s) => s.add);
  const remove = useToastStore((s) => s.remove);

  const success = useCallback(
    (message: string) => {
      add({ type: "success", message, duration: 3000 });
    },
    [add],
  );

  const error = useCallback(
    (message: string) => {
      add({ type: "error", message, duration: 5000 });
    },
    [add],
  );

  const loading = useCallback(
    (message: string): (() => void) => {
      const id = add({ type: "loading", message, duration: 0 });
      return () => remove(id);
    },
    [add, remove],
  );

  const info = useCallback(
    (message: string) => {
      add({ type: "info", message, duration: 3000 });
    },
    [add],
  );

  return { success, error, loading, info, dismiss: remove };
}
