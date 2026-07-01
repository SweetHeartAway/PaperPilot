import { isAxiosError } from "axios";

/** 从 unknown 错误中提取可读的错误消息 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    return (err.response?.data as { detail?: string } | undefined)?.detail ?? fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}
