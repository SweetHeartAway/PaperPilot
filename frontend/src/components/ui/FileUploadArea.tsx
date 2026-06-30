import { type ReactNode, useCallback, useRef, useState } from "react";
import { formatFileSize } from "../../utils/format";

export interface FileUploadAreaProps {
  /** Currently selected file, null = empty state */
  file: File | null;
  /** Called when user selects a file (drag/drop or click) */
  onFileSelect: (file: File) => void;
  /** Called to clear the selected file */
  onFileRemove: () => void;
  /** Disable interaction during upload */
  disabled?: boolean;
  /** Accepted MIME types, default ['application/pdf'] */
  accept?: string[];
  /** Error message to display */
  error?: string;
}

export default function FileUploadArea({
  file,
  onFileSelect,
  onFileRemove,
  disabled = false,
  accept = ["application/pdf"],
  error,
}: FileUploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = useCallback(
    (f: File): boolean => {
      return accept.some((mime) => {
        if (mime === "application/pdf") {
          return f.type === "application/pdf" || f.name.endsWith(".pdf");
        }
        return f.type === mime;
      });
    },
    [accept],
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;
      if (validateFile(selectedFile)) {
        onFileSelect(selectedFile);
      }
      // Reset input value so re-selecting the same file triggers onChange again
      e.target.value = "";
    },
    [onFileSelect, validateFile],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const droppedFile = e.dataTransfer.files?.[0];
      if (!droppedFile) return;
      if (validateFile(droppedFile)) {
        onFileSelect(droppedFile);
      }
    },
    [disabled, onFileSelect, validateFile],
  );

  const renderContent = (): ReactNode => {
    if (file) {
      return (
        <div className="flex items-center gap-3">
          {/* PDF icon */}
          <svg
            className="h-8 w-8 shrink-0 text-red-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFileRemove();
            }}
            disabled={disabled}
            aria-label="移除文件"
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      );
    }

    if (isDragging) {
      return (
        <div className="text-center">
          <svg
            className="mx-auto mb-2 h-8 w-8 text-blue-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-sm font-medium text-blue-600">释放文件以上传</p>
        </div>
      );
    }

    return (
      <div className="text-center">
        <svg
          className="mx-auto mb-2 h-8 w-8 text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="text-sm text-gray-600">拖拽 PDF 文件到此处，或点击选择文件</p>
      </div>
    );
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="选择 PDF 文件"
        aria-disabled={disabled}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors
          ${
            error
              ? "border-red-300 bg-red-50"
              : isDragging
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 bg-white hover:border-gray-400"
          }
          ${disabled ? "cursor-not-allowed opacity-50" : ""}
        `}
      >
        {renderContent()}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
        disabled={disabled}
      />

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
