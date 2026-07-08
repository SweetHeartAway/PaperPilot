import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  usePaper,
  usePaperAISummary,
  useTriggerAIAnalysis,
  useUpdatePaper,
  useDeletePaper,
  useDeletePaperFile,
  usePaperAISummaryVersions,
  usePaperAISummaryDiff,
  useToggleFavorite,
} from "../hooks/usePapers";
import { useAddPaperTag, useRemovePaperTag } from "../hooks/useTags";
import { getPaperDownloadUrl, fetchPaperFileBlob } from "../api/papers";
import Content from "../layout/Content";
import PaperInfo from "../components/paper/PaperInfo";
import type { PaperEditForm } from "../components/paper/PaperInfo";
import PaperDetailSkeleton from "../components/paper/PaperDetailSkeleton";
import AISummaryPanel from "../components/paper/AISummaryPanel";
import PDFViewer from "../components/paper/PDFViewer";
import ChatPanel from "../components/paper/ChatPanel";
import TagManager from "../components/paper/TagManager";
import type { Tab } from "../components/ui/TabBar";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { getErrorMessage } from "../utils/error";

const AI_TABS: Tab[] = [
  { key: "summary", label: "摘要" },
  { key: "method", label: "方法" },
  { key: "result", label: "结果" },
  { key: "conclusion", label: "结论" },
  { key: "keywords", label: "关键词" },
];

function paperToEditForm(
  paper:
    | {
        title: string;
        abstract?: string | null;
        authors?: string | null;
        doi?: string | null;
        publication_date?: string | null;
      }
    | undefined,
): PaperEditForm {
  return {
    title: paper?.title ?? "",
    abstract: paper?.abstract ?? "",
    authors: paper?.authors ?? "",
    doi: paper?.doi ?? "",
    publication_date:
      typeof paper?.publication_date === "string" ? paper.publication_date.slice(0, 10) : "",
  };
}

export default function PaperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const paperId = Number(id);
  const navigate = useNavigate();

  // Hooks must be called unconditionally (rules-of-hooks).
  const { data: paper, isLoading, isError, error, refetch } = usePaper(paperId);
  const addTagMutation = useAddPaperTag(paperId);
  const removeTagMutation = useRemovePaperTag(paperId);
  const updateMutation = useUpdatePaper(paperId);
  const deleteMutation = useDeletePaper();
  const deleteFileMutation = useDeletePaperFile(paperId);
  const toggleFavoriteMutation = useToggleFavorite(paperId);

  // ─── Edit mode ───
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<PaperEditForm>(() => paperToEditForm(paper));

  // Sync form when paper loads / changes
  useEffect(() => {
    if (paper && !isEditing) {
      setEditForm(paperToEditForm(paper));
    }
  }, [paper, isEditing]);

  // ─── AI Summary ───
  const [activeTab, setActiveTab] = useState("summary");
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | undefined>(undefined);
  const [diffVersions, setDiffVersions] = useState<{ v1: number | null; v2: number | null }>({
    v1: null,
    v2: null,
  });

  const {
    data: analysis,
    isLoading: aiLoading,
    isError: aiError,
    error: aiErrorObj,
    refetch: aiRefetch,
  } = usePaperAISummary(paperId, activeTab, selectedVersion);
  const triggerMutation = useTriggerAIAnalysis(paperId, activeTab);
  const { data: versions, isLoading: versionsLoading } = usePaperAISummaryVersions(
    showHistory ? paperId : 0,
  );
  const { data: diff, isLoading: diffLoading } = usePaperAISummaryDiff(
    paperId,
    diffVersions.v1,
    diffVersions.v2,
  );

  // ─── PDF Viewer ───
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfVisible, setPdfVisible] = useState(false);

  useEffect(() => {
    if (!paper?.file_uuid) {
      setPdfData(null);
      setPdfError(null);
      setPdfLoading(false);
      return;
    }

    let cancelled = false;
    setPdfLoading(true);
    setPdfError(null);

    fetchPaperFileBlob(paper.id)
      .then((blob) => blob.arrayBuffer())
      .then((buffer) => {
        if (!cancelled) {
          setPdfData(buffer);
          setPdfLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPdfError(getErrorMessage(err, "加载 PDF 文件失败"));
          setPdfLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [paper?.id, paper?.file_uuid]);

  const handleRetryPdf = useCallback(() => {
    if (!paper?.id) return;
    setPdfLoading(true);
    setPdfError(null);
    fetchPaperFileBlob(paper.id)
      .then((blob) => blob.arrayBuffer())
      .then((buffer) => {
        setPdfData(buffer);
        setPdfLoading(false);
      })
      .catch((err) => {
        setPdfError(getErrorMessage(err, "加载 PDF 文件失败"));
        setPdfLoading(false);
      });
  }, [paper?.id]);

  // ─── Handlers ───

  const handleStartEdit = () => {
    setEditForm(paperToEditForm(paper));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditForm(paperToEditForm(paper));
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate(
      {
        title: editForm.title,
        abstract: editForm.abstract || undefined,
        authors: editForm.authors || undefined,
        doi: editForm.doi || undefined,
        publication_date: editForm.publication_date
          ? new Date(editForm.publication_date).toISOString()
          : undefined,
      },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleDeletePaper = () => {
    if (!window.confirm("确定要删除这篇论文吗？此操作不可撤销。")) return;
    deleteMutation.mutate(paperId, {
      onSuccess: () => navigate("/papers"),
    });
  };

  const handleDeleteFile = () => {
    if (!window.confirm("确定要删除上传的文件吗？")) return;
    deleteFileMutation.mutate();
  };

  const handleToggleHistory = () => {
    setShowHistory(!showHistory);
    if (showHistory) {
      setDiffVersions({ v1: null, v2: null });
    }
  };

  const handleSelectVersion = (version: number) => {
    setSelectedVersion(version === selectedVersion ? undefined : version);
  };

  const handleDiffVersions = (v1: number, v2: number) => {
    setDiffVersions({ v1, v2 });
  };

  const handleClearDiff = () => {
    setDiffVersions({ v1: null, v2: null });
  };

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
        <EmptyState title="论文不存在" message="该论文可能已被删除" />
      ) : (
        <>
          {/* Top row: PaperInfo + AISummaryPanel side by side */}
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1">
              <PaperInfo
                paper={paper}
                downloadUrl={paper.file_uuid ? getPaperDownloadUrl(paper.id) : undefined}
                titleActions={
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteMutation.mutate();
                    }}
                    className={`rounded p-1.5 transition-colors ${
                      paper.is_favorite
                        ? "text-yellow-500 hover:text-yellow-600"
                        : "text-gray-400 hover:text-yellow-500"
                    }`}
                    aria-label={paper.is_favorite ? "取消收藏" : "收藏"}
                    title={paper.is_favorite ? "取消收藏" : "收藏"}
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill={paper.is_favorite ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  </button>
                }
                // Edit mode
                editing={isEditing}
                editForm={editForm}
                onEditFormChange={(field, value) =>
                  setEditForm((prev) => ({ ...prev, [field]: value }))
                }
                onStartEdit={handleStartEdit}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
                savePending={updateMutation.isPending}
                // File operations
                onDeleteFile={handleDeleteFile}
                deleteFilePending={deleteFileMutation.isPending}
                // Delete paper
                onDeletePaper={handleDeletePaper}
                deletePaperPending={deleteMutation.isPending}
              />
            </div>
            <div className="w-full lg:w-96">
              <AISummaryPanel
                analysis={analysis}
                isLoading={aiLoading}
                isError={aiError}
                errorMessage={getErrorMessage(aiErrorObj, "AI 分析加载失败")}
                onRetry={() => aiRefetch()}
                onTriggerAnalysis={(opts) => triggerMutation.mutate(opts)}
                triggerPending={triggerMutation.isPending}
                activeTab={activeTab}
                tabs={AI_TABS}
                onTabChange={setActiveTab}
                // Version management
                showHistory={showHistory}
                onToggleHistory={handleToggleHistory}
                versions={versions ?? null}
                versionsLoading={versionsLoading}
                selectedVersion={selectedVersion}
                onSelectVersion={handleSelectVersion}
                diff={diff ?? null}
                diffLoading={diffLoading}
                onDiffVersions={handleDiffVersions}
                onClearDiff={handleClearDiff}
              />
            </div>
          </div>

          {/* PDF 内联查看 */}
          <div className="mt-6">
            <button
              onClick={() => setPdfVisible((v) => !v)}
              className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
            >
              <svg
                className={`h-4 w-4 transition-transform ${pdfVisible ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {paper.file_uuid ? "PDF 原文" : "PDF 文件"}
              {paper.file_uuid && (
                <span className="text-xs font-normal text-gray-400">
                  {pdfVisible ? "点击收起" : "点击查看"}
                </span>
              )}
            </button>
            {pdfVisible && (
              <PDFViewer
                data={pdfData}
                loading={pdfLoading}
                error={pdfError}
                onRetry={handleRetryPdf}
                fileName={paper.original_filename ?? undefined}
              />
            )}
          </div>

          {/* Chat: Paper Q&A */}
          <div className="mt-6">
            <ChatPanel paperId={paperId} hasContent={!!paper.file_uuid} />
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
