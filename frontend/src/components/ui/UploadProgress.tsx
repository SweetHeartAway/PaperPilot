import type { ReactNode } from "react";

export interface UploadProgressProps {
  /** Progress percentage 0-100 */
  percent: number;
  /** Status text shown below the bar */
  statusText?: string;
  /** Visual variant */
  variant?: "uploading" | "success" | "error";
  /** Optional retry button (shown on error) */
  onRetry?: () => void;
}

export default function UploadProgress({
  percent,
  statusText,
  variant = "uploading",
  onRetry,
}: UploadProgressProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  const barColor: Record<string, string> = {
    uploading: "bg-blue-500",
    success: "bg-green-500",
    error: "bg-red-500",
  };

  const iconMap: Record<string, ReactNode> = {
    uploading: null,
    success: (
      <svg
        className="h-5 w-5 text-green-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg
        className="h-5 w-5 text-red-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <div className="space-y-2">
      {/* Icon and status text row */}
      {(variant === "success" || variant === "error") && (
        <div className="flex items-center gap-2">
          {iconMap[variant]}
          <span
            className={`text-sm font-medium ${
              variant === "success" ? "text-green-700" : "text-red-700"
            }`}
          >
            {variant === "success" ? "上传成功" : statusText || "上传失败"}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={statusText || "上传进度"}
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${barColor[variant]}`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>

      {/* Uploading status text */}
      {variant === "uploading" && statusText && (
        <p className="text-xs text-gray-500">{statusText}</p>
      )}

      {/* Error state retry button */}
      {variant === "error" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
        >
          重试
        </button>
      )}
    </div>
  );
}
