import { usePaperAISummary, useTriggerAIAnalysis } from "../../hooks/usePapers";
import Skeleton from "../ui/Skeleton";

interface AISummaryPanelProps {
  paperId: number;
}

export default function AISummaryPanel({ paperId }: AISummaryPanelProps) {
  const { data: analysis, isLoading, isError, error, refetch } = usePaperAISummary(paperId);
  const triggerMutation = useTriggerAIAnalysis(paperId);

  // ─── Loading / Checking state ───
  if (isLoading) {
    return (
      <div
        className="rounded-lg border border-gray-200 bg-white p-5"
        role="status"
        aria-label="加载中"
      >
        <Skeleton className="mb-4 h-6 w-24" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  // ─── Query error ───
  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-center">
        <p className="text-sm font-medium text-red-600">AI 分析加载失败</p>
        <p className="mt-1 text-xs text-red-500">
          {error instanceof Error ? error.message : "请检查网络连接后重试"}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          重新加载
        </button>
      </div>
    );
  }

  // ─── No analysis yet ───
  if (analysis === null) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">AI 分析</h2>
        <div className="flex flex-col items-center py-8">
          <svg
            className="mb-3 h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
            />
          </svg>
          <p className="text-sm text-gray-500">尚未进行 AI 分析</p>
          <button
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {triggerMutation.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                请求中...
              </>
            ) : (
              "AI 分析"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Guard for undefined (should not happen after early returns)
  if (!analysis) {
    return null;
  }

  // ─── Pending / Processing ───
  if (analysis.status === "pending" || analysis.status === "processing") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-gray-900">AI 分析</h2>
        <div className="flex flex-col items-center py-8">
          <div
            className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"
            role="status"
            aria-label="AI 分析中"
          />
          <p className="text-sm font-medium text-blue-600">AI 分析中...</p>
          <p className="mt-1 text-xs text-gray-400">
            {analysis.status === "processing" ? "正在处理" : "等待中"}
          </p>
        </div>
      </div>
    );
  }

  // ─── Failed ───
  if (analysis.status === "failed") {
    return (
      <div className="rounded-lg border border-red-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">AI 分析</h2>
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
            分析失败
          </span>
        </div>
        {analysis.error_message && <p className="text-sm text-red-600">{analysis.error_message}</p>}
        <button
          onClick={() => triggerMutation.mutate()}
          disabled={triggerMutation.isPending}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {triggerMutation.isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              请求中...
            </>
          ) : (
            "重新分析"
          )}
        </button>
      </div>
    );
  }

  // ─── Completed ───
  const result = analysis.result;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-base font-semibold text-gray-900">AI 分析</h2>
        <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600">
          v{analysis.version}
        </span>
      </div>

      {result?.summary && (
        <div className="mb-5">
          <h3 className="mb-1.5 text-sm font-semibold text-gray-800">摘要</h3>
          <p className="text-sm leading-relaxed text-gray-600">{result.summary}</p>
        </div>
      )}

      {result?.keywords && result.keywords.length > 0 && (
        <div className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-gray-800">关键词</h3>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {result?.main_points && result.main_points.length > 0 && (
        <div className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-gray-800">主要观点</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
            {result.main_points.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
        {analysis.model_name && <span className="mr-4">模型: {analysis.model_name}</span>}
        {analysis.tokens_used !== null && analysis.tokens_used !== undefined && (
          <span className="mr-4">Token: {analysis.tokens_used.toLocaleString()}</span>
        )}
        {analysis.completed_at && <span>完成于 {analysis.completed_at}</span>}
      </div>
    </div>
  );
}
