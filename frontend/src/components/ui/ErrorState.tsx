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
      <svg
        className="mx-auto mb-3 h-10 w-10 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
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
