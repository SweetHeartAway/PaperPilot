import { WarningIcon } from "./Icons";

interface ErrorStateProps {
  /** 错误标题 */
  title: string;
  /** 错误详情（可选，显示在标题下方） */
  message?: string;
  /** 重试回调（提供则显示重试按钮） */
  onRetry?: () => void;
  /** 重试按钮文本 */
  retryLabel?: string;
}

export default function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = "重新加载",
}: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <WarningIcon className="mx-auto mb-3 h-10 w-10 text-red-400" />
      <p className="text-sm font-medium text-red-600">{title}</p>
      {message && <p className="mt-1 text-xs text-red-500">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
