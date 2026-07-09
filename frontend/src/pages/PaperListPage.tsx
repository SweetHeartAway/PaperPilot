import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  usePaperList,
  useDeletePaper,
  useBatchAIAnalysis,
  useToggleFavorite,
  useBatchDeletePapers,
  useBatchAddTag,
} from "../hooks/usePapers";
import { useAllTags } from "../hooks/useTagManagement";
import Content from "../layout/Content";
import PaperList from "../components/paper/PaperList";
import PaperCardSkeleton from "../components/paper/PaperCardSkeleton";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import Pagination from "../components/ui/Pagination";
import { XIcon } from "../components/ui/Icons";
import { getErrorMessage } from "../utils/error";
import type { Paper } from "../types/paper";

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: "updated_at", label: "更新时间" },
  { value: "created_at", label: "创建时间" },
  { value: "title", label: "标题" },
  { value: "publication_date", label: "发表日期" },
] as const;

export default function PaperListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const deleteMutation = useDeletePaper();
  const batchAnalysisMutation = useBatchAIAnalysis();
  const toggleFavoriteMutation = useToggleFavorite();
  const batchDeleteMutation = useBatchDeletePapers();
  const batchAddTagMutation = useBatchAddTag();
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sortBy, setSortBy] = useState("updated_at");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // ─── Batch mode ───
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showTagModal, setShowTagModal] = useState(false);
  const [batchTagName, setBatchTagName] = useState("");

  const { data: allTags } = useAllTags();

  // Debounce search input + 同时重置到第 1 页
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isError, error, refetch } = usePaperList({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    favoriteOnly,
    sortBy,
    sortOrder: sortBy === "title" ? "asc" : "desc",
    tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
  });

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
    setPage(1);
  };

  // ─── Handlers ───

  const handleDelete = (e: React.MouseEvent, paper: Paper) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm(`确定删除「${paper.title}」吗？此操作不可撤销。`)) return;
    deleteMutation.mutate(paper.id);
  };

  const toggleBatchMode = () => {
    if (batchMode) {
      setSelectedIds(new Set());
    }
    setBatchMode(!batchMode);
  };

  const toggleSelect = useCallback((e: React.MouseEvent, paperId: number) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(paperId)) {
        next.delete(paperId);
      } else {
        next.add(paperId);
      }
      return next;
    });
  }, []);

  const handleBatchAnalysis = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    batchAnalysisMutation.mutate(
      { paperIds: ids, analysisType: "summary" },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setBatchMode(false);
        },
      },
    );
  };

  const handleBatchDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!window.confirm(`确定删除选中的 ${ids.length} 篇论文吗？此操作不可撤销。`)) return;
    batchDeleteMutation.mutate(ids, {
      onSuccess: () => {
        setSelectedIds(new Set());
        setBatchMode(false);
      },
    });
  };

  const handleBatchTagSubmit = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || !batchTagName.trim()) return;
    batchAddTagMutation.mutate(
      { paperIds: ids, tagName: batchTagName.trim() },
      {
        onSuccess: () => {
          setBatchTagName("");
          setShowTagModal(false);
          setSelectedIds(new Set());
          setBatchMode(false);
        },
      },
    );
  };

  const renderTopRight = (paper: Paper) => {
    if (batchMode) {
      return (
        <div
          onClick={(e) => toggleSelect(e, paper.id)}
          className="flex cursor-pointer items-center p-1"
        >
          <input
            type="checkbox"
            checked={selectedIds.has(paper.id)}
            readOnly
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label={`选择 ${paper.title}`}
          />
        </div>
      );
    }
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleFavoriteMutation.mutate(paper.id);
          }}
          className={`rounded p-1 transition-colors ${
            paper.is_favorite
              ? "text-yellow-500 hover:text-yellow-600"
              : "text-gray-400 hover:text-yellow-500"
          }`}
          aria-label={paper.is_favorite ? "取消收藏" : "收藏"}
          title={paper.is_favorite ? "取消收藏" : "收藏"}
        >
          <svg
            className="h-4 w-4"
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
        <button
          onClick={(e) => handleDelete(e, paper)}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label={`删除 ${paper.title}`}
          title="删除论文"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </>
    );
  };

  return (
    <>
      <Content maxWidth="max-w-5xl">
        {/* Search and Upload Bar */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索论文标题、作者或摘要..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-4 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                aria-label="清除搜索"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 排序 */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="排序方式"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setFavoriteOnly(!favoriteOnly);
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              favoriteOnly
                ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
            title={favoriteOnly ? "显示全部论文" : "仅显示收藏论文"}
          >
            <svg
              className={`h-4 w-4 ${favoriteOnly ? "fill-yellow-500 text-yellow-500" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
            {favoriteOnly ? "收藏" : "收藏"}
          </button>
          <button
            onClick={() => navigate("/papers/create")}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
            上传论文
          </button>
          <button
            onClick={toggleBatchMode}
            className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              batchMode
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            批量操作
          </button>
        </div>

        {/* Batch action bar */}
        {batchMode && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
            <span className="text-sm text-blue-700">
              {selectedIds.size === 0
                ? "点击卡片上的复选框选择论文"
                : `已选择 ${selectedIds.size} 篇论文`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchAnalysis}
                disabled={selectedIds.size === 0 || batchAnalysisMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {batchAnalysisMutation.isPending ? "分析中..." : `AI 分析 (${selectedIds.size})`}
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0 || batchDeleteMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {batchDeleteMutation.isPending ? "删除中..." : `删除 (${selectedIds.size})`}
              </button>
              <button
                onClick={() => {
                  setShowTagModal(true);
                }}
                disabled={selectedIds.size === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                添加标签
              </button>
              <button
                onClick={toggleBatchMode}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                退出批量
              </button>
            </div>
          </div>
        )}

        {/* Tag filter */}
        {allTags && allTags.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-400">标签：</span>
            {allTags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tag.name}
                  {isSelected && <XIcon className="ml-1 h-3 w-3" />}
                </button>
              );
            })}
            {selectedTagIds.length > 0 && (
              <button
                onClick={() => {
                  setSelectedTagIds([]);
                  setPage(1);
                }}
                className="text-xs text-gray-400 underline transition-colors hover:text-gray-600"
              >
                清除筛选
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {isLoading && !data ? (
          <PaperCardSkeleton count={6} />
        ) : isError ? (
          <ErrorState
            title="加载论文列表失败"
            message={getErrorMessage(error, "请检查网络连接后重试")}
            onRetry={() => refetch()}
          />
        ) : data && data.papers.length === 0 ? (
          debouncedSearch ? (
            <EmptyState title="未找到匹配的论文" message="尝试使用不同的关键词搜索" />
          ) : (
            <EmptyState
              title="还没有论文"
              message={'点击上方"上传论文"按钮添加你的第一篇论文'}
              action={
                <button
                  onClick={() => navigate("/papers/create")}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  上传第一篇论文
                </button>
              }
            />
          )
        ) : (
          data && (
            <>
              <PaperList papers={data.papers} renderTopRight={renderTopRight} />
              <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
            </>
          )
        )}
      </Content>

      {/* Tag modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              为 {selectedIds.size} 篇论文添加标签
            </h3>
            <input
              type="text"
              value={batchTagName}
              onChange={(e) => setBatchTagName(e.target.value)}
              placeholder="输入标签名称..."
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleBatchTagSubmit();
                if (e.key === "Escape") {
                  setShowTagModal(false);
                  setBatchTagName("");
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowTagModal(false);
                  setBatchTagName("");
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleBatchTagSubmit}
                disabled={!batchTagName.trim() || batchAddTagMutation.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {batchAddTagMutation.isPending ? "添加中..." : "确定"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
