import { useNavigate } from "react-router-dom";
import { WarningIcon } from "../components/ui/Icons";

interface ErrorPageProps {
  error: unknown;
  resetErrorBoundary?: () => void;
}

export default function ErrorPage({ error, resetErrorBoundary }: ErrorPageProps) {
  const navigate = useNavigate();
  const errorMessage =
    error instanceof Error ? error.message : typeof error === "string" ? error : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
        <WarningIcon className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h1 className="mb-2 text-lg font-semibold text-gray-900">出错了</h1>
        {errorMessage && <p className="mb-4 text-sm text-gray-500">{errorMessage}</p>}
        <div className="flex justify-center gap-3">
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              刷新页面
            </button>
          )}
          <button
            onClick={() => navigate("/papers")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
