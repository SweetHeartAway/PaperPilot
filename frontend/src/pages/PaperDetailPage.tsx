import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePaper, usePaperAISummary, useTriggerAIAnalysis } from "../hooks/usePapers";
import { useAddPaperTag, useRemovePaperTag } from "../hooks/useTags";
import { getPaperDownloadUrl } from "../api/papers";
import Content from "../layout/Content";
import PaperInfo from "../components/paper/PaperInfo";
import PaperDetailSkeleton from "../components/paper/PaperDetailSkeleton";
import AISummaryPanel from "../components/paper/AISummaryPanel";
import TagManager from "../components/paper/TagManager";
import type { Tab } from "../components/ui/TabBar";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { getErrorMessage } from "../utils/error";

const AI_TABS: Tab[] = [
  { key: "summary", label: "摘要" },
  { key: "method", label: "Method" },
  { key: "result", label: "Result" },
  { key: "conclusion", label: "Conclusion" },
];

export default function PaperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const paperId = Number(id);
  const navigate = useNavigate();

  // Hooks must be called unconditionally (rules-of-hooks).
  // usePaper already has enabled: id > 0, so paperId <= 0 disables the query.
  const { data: paper, isLoading, isError, error, refetch } = usePaper(paperId);
  const addTagMutation = useAddPaperTag(paperId);
  const removeTagMutation = useRemovePaperTag(paperId);

  // ─── AI Summary ───
  const [activeTab, setActiveTab] = useState("summary");
  const {
    data: analysis,
    isLoading: aiLoading,
    isError: aiError,
    error: aiErrorObj,
    refetch: aiRefetch,
  } = usePaperAISummary(paperId, activeTab);
  const triggerMutation = useTriggerAIAnalysis(paperId, activeTab);

  if (!id || isNaN(paperId) || paperId <= 0) {
    return (
      <Content maxWidth="max-w-6xl">
        <EmptyState title="论文不存在" message="无效的论文 ID" />
      </Content>
    );
  }

  return (
    <Content maxWidth="max-w-6xl">
      {/* Back button */}
      <button
        onClick={() => navigate("/papers")}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
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
        返回论文列表
      </button>

      {/* Loading state */}
      {isLoading ? (
        <PaperDetailSkeleton />
      ) : isError ? (
        <ErrorState
          title="加载论文失败"
          message={getErrorMessage(error, "请检查网络连接后重试")}
          onRetry={() => refetch()}
        />
      ) : !paper ? (
        /* Not found state */
        <EmptyState title="论文不存在" message="该论文可能已被删除" />
      ) : (
        /* Normal state */
        <>
          {/* Top row: PaperInfo + AISummaryPanel side by side */}
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1">
              <PaperInfo
                paper={paper}
                downloadUrl={paper.file_uuid ? getPaperDownloadUrl(paper.id) : undefined}
              />
            </div>
            <div className="w-full lg:w-96">
              <AISummaryPanel
                analysis={analysis}
                isLoading={aiLoading}
                isError={aiError}
                errorMessage={getErrorMessage(aiErrorObj, "AI 分析加载失败")}
                onRetry={() => aiRefetch()}
                onTriggerAnalysis={() => triggerMutation.mutate()}
                triggerPending={triggerMutation.isPending}
                activeTab={activeTab}
                tabs={AI_TABS}
                onTabChange={setActiveTab}
              />
            </div>
          </div>

          {/* Bottom: TagManager full width */}
          <div className="mt-8">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <TagManager
                tags={paper.tags}
                onAdd={(name) => addTagMutation.mutate(name)}
                onRemove={(tagId) => removeTagMutation.mutate(tagId)}
                addPending={addTagMutation.isPending}
                removePendingTagId={
                  removeTagMutation.isPending ? removeTagMutation.variables : null
                }
              />
            </div>
          </div>
        </>
      )}
    </Content>
  );
}
