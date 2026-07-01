import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import Spinner from "../ui/Spinner";
import ErrorState from "../ui/ErrorState";
import EmptyState from "../ui/EmptyState";
import { getErrorMessage } from "../../utils/error";

// ─── Worker 初始化 ───
// Vite 将 pdfjs-dist 的 worker 文件解析为可直接访问的 URL
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).href;

// ─── Props ───

export interface PDFViewerProps {
  /** PDF 二进制数据（null = 无文件） */
  data: ArrayBuffer | null;
  /** 是否正在获取数据 */
  loading: boolean;
  /** 获取数据失败的错误信息 */
  error: string | null;
  /** 重试回调 */
  onRetry?: () => void;
  /** 原始文件名 */
  fileName?: string;
}

// ─── Types ───

type ViewerStatus =
  | { type: "idle" }
  | { type: "error"; message: string }
  | { type: "ready"; doc: PDFDocumentProxy; numPages: number };

// ─── Component ───

export default function PDFViewer({ data, loading, error, onRetry, fileName }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ViewerStatus>({ type: "idle" });
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [pageInput, setPageInput] = useState("1");

  // ─── 加载 PDF ───

  useEffect(() => {
    // 清理旧文档
    if (status.type === "ready") {
      status.doc.destroy();
    }
    setStatus({ type: "idle" });
    setCurrentPage(1);
    setScale(1.2);
    setPageInput("1");

    if (!data) return;

    let cancelled = false;

    const loadPdf = async () => {
      try {
        const doc = await getDocument({ data }).promise;
        if (cancelled) {
          doc.destroy();
          return;
        }
        setStatus({ type: "ready", doc, numPages: doc.numPages });
      } catch (err) {
        if (!cancelled) {
          setStatus({
            type: "error",
            message: getErrorMessage(err, "无法解析 PDF 文件"),
          });
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 渲染页面 ───

  useEffect(() => {
    if (status.type !== "ready" || !canvasRef.current) return;

    let cancelled = false;

    const renderPage = async () => {
      try {
        const page = await status.doc.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;

        // 适配 HiDPI 屏幕
        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const ctx = canvas.getContext("2d")!;
        ctx.scale(dpr, dpr);
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) {
        if (!cancelled) {
          console.error("PDF 页面渲染失败:", err);
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [status, currentPage, scale]);

  // ─── 导航 ───

  const totalPages = status.type === "ready" ? status.numPages : 0;

  const goToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
    setPageInput(String(clamped));
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const page = parseInt(pageInput, 10);
      if (!isNaN(page)) goToPage(page);
    }
  };

  // ─── 缩放 ───

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const zoomReset = () => setScale(1.2);

  // ─── No file ───

  if (!data && !loading && !error) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <EmptyState
          title="无 PDF 文件"
          message={fileName ? `论文「${fileName}」未上传 PDF 文件` : "该论文未上传 PDF 文件"}
        />
      </div>
    );
  }

  // ─── Fetch loading ───

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-col items-center py-8">
          <Spinner size="lg" variant="blue" className="mb-4" />
          <p className="text-sm text-gray-500">正在加载 PDF 文件...</p>
        </div>
      </div>
    );
  }

  // ─── Fetch error ───

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-white p-5">
        <ErrorState title="加载 PDF 失败" message={error} onRetry={onRetry} />
      </div>
    );
  }

  // ─── PDF loading (pdfjs) ───

  if (status.type === "idle") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-col items-center py-8">
          <Spinner size="lg" variant="blue" className="mb-4" />
          <p className="text-sm text-gray-500">正在解析 PDF...</p>
        </div>
      </div>
    );
  }

  // ─── PDF parse error ───

  if (status.type === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-white p-5">
        <ErrorState title="PDF 解析失败" message={status.message} />
      </div>
    );
  }

  // ─── Ready ───

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* 工具栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2">
          {/* 文件名 */}
          {fileName && (
            <span className="text-xs text-gray-500 truncate max-w-[200px]">{fileName}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* 缩放 */}
          <div className="flex items-center gap-1">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
              aria-label="缩小"
              title="缩小"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={zoomReset}
              className="min-w-[48px] text-center text-xs font-medium text-gray-600 hover:text-gray-800"
              title="重置缩放"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={zoomIn}
              disabled={scale >= 3}
              className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
              aria-label="放大"
              title="放大"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* 页面导航 */}
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded p-1 transition-colors hover:bg-gray-100 disabled:opacity-30"
              aria-label="上一页"
              title="上一页"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="flex items-center gap-1">
              <input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                onKeyDown={handlePageInputKeyDown}
                className="w-10 rounded border border-gray-300 px-1 py-0.5 text-center text-xs"
                aria-label="页码"
              />
              <span className="text-gray-400">/ {totalPages}</span>
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded p-1 transition-colors hover:bg-gray-100 disabled:opacity-30"
              aria-label="下一页"
              title="下一页"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 画布容器 */}
      <div
        ref={containerRef}
        className="flex justify-center overflow-auto bg-gray-100 p-4"
        style={{ maxHeight: "70vh" }}
      >
        <canvas ref={canvasRef} className="shadow-lg" />
      </div>
    </div>
  );
}
