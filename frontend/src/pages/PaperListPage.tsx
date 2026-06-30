import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePaperList } from "../hooks/usePapers";
import Content from "../layout/Content";
import PaperList from "../components/paper/PaperList";
import PaperCardSkeleton from "../components/paper/PaperCardSkeleton";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import Pagination from "../components/ui/Pagination";

const PAGE_SIZE = 20;

export default function PaperListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isError, error, refetch } = usePaperList({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
  });

  return (
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
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
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
      </div>

      {/* Content */}
      {isLoading && !data ? (
        <PaperCardSkeleton count={6} />
      ) : isError ? (
        <ErrorState
          title="加载论文列表失败"
          message={error instanceof Error ? error.message : "请检查网络连接后重试"}
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
            <PaperList papers={data.papers} />
            <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
          </>
        )
      )}
    </Content>
  );
}
