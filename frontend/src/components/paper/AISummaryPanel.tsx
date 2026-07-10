import Skeleton from "../ui/Skeleton";
import Spinner from "../ui/Spinner";
import TabBar, { type Tab } from "../ui/TabBar";
import type { AIAnalysisStatus } from "../../types/ai";
import type { AnalysisVersionItem, VersionDiff } from "../../api/ai";

// ─── Props ───

export interface AISummaryPanelProps {
  /** 当前分析结果 */
  analysis: AIAnalysisStatus | null | undefined;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否加载出错 */
  isError: boolean;
  /** 错误信息 */
  errorMessage?: string;
  /** 重新加载/重试 */
  onRetry: () => void;
  /** 触发 AI 分析（支持 forceRegenerate 参数） */
  onTriggerAnalysis: (options?: { forceRegenerate?: boolean; customPromptId?: number }) => void;
  /** 触发操作是否进行中 */
  triggerPending: boolean;
  /** 当前激活的 Tab */
  activeTab: string;
  /** Tab 定义 */
  tabs: Tab[];
  /** Tab 切换回调 */
  onTabChange: (tab: string) => void;
  // ─── 版本管理 ───
  /** 是否显示版本历史 */
  showHistory?: boolean;
  /** 切换版本历史显示 */
  onToggleHistory?: () => void;
  /** 版本列表 */
  versions?: AnalysisVersionItem[] | null;
  /** 版本列表加载中 */
  versionsLoading?: boolean;
  /** 选中的版本号 */
  selectedVersion?: number;
  /** 选择版本 */
  onSelectVersion?: (version: number) => void;
  /** 版本对比结果 */
  diff?: VersionDiff | null;
  /** 对比加载中 */
  diffLoading?: boolean;
  /** 对比两个版本 */
  onDiffVersions?: (v1: number, v2: number) => void;
  /** 清除对比 */
  onClearDiff?: () => void;
}

// ─── Tab 常量和 label 映射 ───

const TAB_LABELS: Record<string, string> = {
  summary: "摘要",
  method: "方法",
  result: "结果",
  conclusion: "结论",
  keywords: "关键词",
};

function getTabLabel(tab: string): string {
  return TAB_LABELS[tab] ?? tab;
}

// ─── Trigger buttons (shared across states) ───

function TriggerButton({
  label,
  pending,
  onTrigger,
  forceRegenerate,
  onForceRegenerateChange,
}: {
  label: string;
  pending: boolean;
  onTrigger: () => void;
  forceRegenerate?: boolean;
  onForceRegenerateChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onTrigger}
        disabled={pending}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <>
            <Spinner size="md" variant="white" />
            请求中...
          </>
        ) : (
          label
        )}
      </button>
      {onForceRegenerateChange && (
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={forceRegenerate ?? false}
            onChange={(e) => onForceRegenerateChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
          />
          忽略缓存，强制重新生成
        </label>
      )}
    </div>
  );
}

// ─── Diff View ───

function DiffView({ diff, onClear }: { diff: VersionDiff; onClear?: () => void }) {
  return (
    <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-700">
          版本 {diff.version_a} vs {diff.version_b} 对比
        </h4>
        {onClear && (
          <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-600">
            关闭
          </button>
        )}
      </div>

      {diff.summary_changed && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-gray-500">摘要变更</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-gray-300 bg-white p-2">
              <p className="mb-1 text-xs text-gray-400">旧 (v{diff.version_a})</p>
              <p className="text-xs text-gray-700">{diff.summary.old || "(空)"}</p>
            </div>
            <div className="rounded border border-green-300 bg-white p-2">
              <p className="mb-1 text-xs text-gray-400">新 (v{diff.version_b})</p>
              <p className="text-xs text-gray-700">{diff.summary.new || "(空)"}</p>
            </div>
          </div>
        </div>
      )}

      {diff.keywords_added.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-xs font-medium text-green-600">新增关键词</p>
          <div className="flex flex-wrap gap-1">
            {diff.keywords_added.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700"
              >
                +{kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {diff.keywords_removed.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-xs font-medium text-red-600">移除关键词</p>
          <div className="flex flex-wrap gap-1">
            {diff.keywords_removed.map((kw) => (
              <span key={kw} className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
                -{kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {diff.main_points_added.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-xs font-medium text-green-600">新增观点</p>
          <ul className="list-inside list-disc text-xs text-gray-700">
            {diff.main_points_added.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {diff.main_points_removed.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-red-600">移除观点</p>
          <ul className="list-inside list-disc text-xs text-gray-700">
            {diff.main_points_removed.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {!diff.summary_changed &&
        diff.keywords_added.length === 0 &&
        diff.keywords_removed.length === 0 &&
        diff.main_points_added.length === 0 &&
        diff.main_points_removed.length === 0 && (
          <p className="text-xs text-gray-400">两个版本之间没有差异</p>
        )}
    </div>
  );
}

// ─── Version History Panel ───

function VersionHistory({
  versions,
  loading,
  selectedVersion,
  onSelect,
  onDiff,
  onClearDiff,
  diff,
  diffLoading,
}: {
  versions?: AnalysisVersionItem[] | null;
  loading?: boolean;
  selectedVersion?: number;
  onSelect?: (v: number) => void;
  onDiff?: (v1: number, v2: number) => void;
  onClearDiff?: () => void;
  diff?: VersionDiff | null;
  diffLoading?: boolean;
}) {
  const [diffV1, setDiffV1] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 px-5 pb-4">
        <Spinner size="sm" />
        <span className="text-xs text-gray-400">加载版本列表...</span>
      </div>
    );
  }

  if (!versions || versions.length === 0) return null;

  const handleVersionClick = (v: number) => {
    if (diffV1 === null) {
      // First version selected for diff
      setDiffV1(v);
      onSelect?.(v);
    } else {
      // Second version selected — trigger diff
      if (diffV1 !== v) {
        onDiff?.(Math.min(diffV1, v), Math.max(diffV1, v));
      }
      setDiffV1(null);
    }
  };

  const handleClear = () => {
    setDiffV1(null);
    onClearDiff?.();
  };

  return (
    <div className="border-t border-gray-100 px-5 pb-4 pt-3">
      <p className="mb-2 text-xs font-medium text-gray-500">
        版本历史
        <span className="ml-1 font-normal text-gray-400">（点击两个版本进行对比）</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {versions.map((v) => {
          const isSelected = v.version === selectedVersion;
          const isDiffTarget = v.version === diffV1;
          const isCompleted = v.status === "completed";
          return (
            <button
              key={v.version}
              onClick={() => handleVersionClick(v.version)}
              disabled={!isCompleted}
              title={
                isCompleted
                  ? `v${v.version} - ${v.completed_at ?? ""}${v.model_name ? ` (${v.model_name})` : ""}`
                  : `v${v.version} - ${v.status}`
              }
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                isDiffTarget
                  ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                  : isSelected
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
              aria-label={`版本 ${v.version}`}
            >
              v{v.version}
              {isDiffTarget && <span className="text-yellow-500">①</span>}
              {isCompleted && v.tokens_used !== null && (
                <span className="text-gray-400">({v.tokens_used} tokens)</span>
              )}
            </button>
          );
        })}
      </div>

      {diffLoading && (
        <div className="mt-3 flex items-center gap-2">
          <Spinner size="sm" />
          <span className="text-xs text-gray-400">加载版本对比...</span>
        </div>
      )}

      {diff && <DiffView diff={diff} onClear={handleClear} />}
    </div>
  );
}

// 在文件顶部添加 useState 导入
import { useState } from "react";

// ─── 组件 ───

export default function AISummaryPanel({
  analysis,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onTriggerAnalysis,
  triggerPending,
  activeTab,
  tabs,
  onTabChange,
  showHistory,
  onToggleHistory,
  versions,
  versionsLoading,
  selectedVersion,
  onSelectVersion,
  diff,
  diffLoading,
  onDiffVersions,
  onClearDiff,
}: AISummaryPanelProps) {
  const [forceRegenerate, setForceRegenerate] = useState(false);

  const handleTrigger = () => {
    onTriggerAnalysis(forceRegenerate ? { forceRegenerate: true } : undefined);
  };

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <TabBar tabs={tabs} active={activeTab} onChange={onTabChange} />
        <div className="p-5" role="status" aria-label="加载中">
          <Skeleton className="mb-4 h-6 w-24" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  // ─── Query Error ───
  if (isError) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <TabBar tabs={tabs} active={activeTab} onChange={onTabChange} />
        <div className="p-5 text-center">
          <p className="text-sm font-medium text-red-600">{getTabLabel(activeTab)} 分析加载失败</p>
          <p className="mt-1 text-xs text-red-500">{errorMessage ?? "请检查网络连接后重试"}</p>
          <button
            onClick={onRetry}
            className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // ─── No analysis yet (null = not triggered) ───
  if (analysis === null) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <TabBar tabs={tabs} active={activeTab} onChange={onTabChange} />
        <div className="flex flex-col items-center p-5 py-8">
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
          <p className="text-sm text-gray-500">尚未进行 {getTabLabel(activeTab)} 分析</p>
          <div className="mt-4 w-full max-w-[200px]">
            <TriggerButton
              label={`AI ${getTabLabel(activeTab)}`}
              pending={triggerPending}
              onTrigger={handleTrigger}
              forceRegenerate={forceRegenerate}
              onForceRegenerateChange={setForceRegenerate}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── analysis 不应为 undefined ───
  if (analysis === undefined) {
    return null;
  }

  // ─── Pending / Processing ───
  if (analysis.status === "pending" || analysis.status === "processing") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <TabBar tabs={tabs} active={activeTab} onChange={onTabChange} />
        <div className="flex flex-col items-center p-5 py-8">
          <Spinner size="lg" variant="blue" className="mb-4" />
          <p className="text-sm font-medium text-blue-600">{getTabLabel(activeTab)} 分析中...</p>
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
      <div className="rounded-lg border border-red-200 bg-white">
        <TabBar tabs={tabs} active={activeTab} onChange={onTabChange} />
        <div className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">{getTabLabel(activeTab)}</h2>
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
              分析失败
            </span>
          </div>
          {analysis.error_message && (
            <p className="text-sm text-red-600">{analysis.error_message}</p>
          )}
          <div className="mt-4 w-full max-w-[200px]">
            <TriggerButton
              label="重新分析"
              pending={triggerPending}
              onTrigger={handleTrigger}
              forceRegenerate={true}
              onForceRegenerateChange={setForceRegenerate}
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── Completed ───
  const result = analysis.result;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <TabBar tabs={tabs} active={activeTab} onChange={onTabChange} />
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">{getTabLabel(activeTab)}</h2>
          <button
            onClick={onToggleHistory}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              showHistory
                ? "bg-blue-100 text-blue-700"
                : "bg-green-50 text-green-600 hover:bg-green-100"
            }`}
            aria-label="查看版本历史"
            title="查看版本历史"
          >
            v{analysis.version}
            <svg
              className={`h-3 w-3 transition-transform ${showHistory ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
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

        {/* 重新分析按钮 */}
        <div className="mt-4">
          <TriggerButton
            label="重新分析"
            pending={triggerPending}
            onTrigger={handleTrigger}
            forceRegenerate={forceRegenerate}
            onForceRegenerateChange={setForceRegenerate}
          />
        </div>
      </div>

      {/* 版本历史 */}
      {showHistory && (
        <VersionHistory
          versions={versions}
          loading={versionsLoading}
          selectedVersion={selectedVersion}
          onSelect={onSelectVersion}
          onDiff={onDiffVersions}
          onClearDiff={onClearDiff}
          diff={diff}
          diffLoading={diffLoading}
        />
      )}
    </div>
  );
}
