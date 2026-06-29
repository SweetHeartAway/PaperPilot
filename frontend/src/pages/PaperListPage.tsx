import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePapers } from '../hooks/usePapers';
import Loading from '../components/ui/Loading';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { formatDate } from '../utils/format';
import type { Paper } from '../types/paper';

const PAGE_SIZE = 20;

function PaperCard({ paper }: { paper: Paper }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/papers/${paper.id}`)}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          navigate(`/papers/${paper.id}`);
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900">{paper.title}</h3>
          {paper.authors && (
            <p className="mt-1 truncate text-sm text-gray-500">{paper.authors}</p>
          )}
          {paper.abstract && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
              {paper.abstract}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
            {paper.publication_date && (
              <span>{formatDate(paper.publication_date)}</span>
            )}
            {paper.doi && (
              <span className="max-w-[180px] truncate" title={paper.doi}>
                DOI: {paper.doi}
              </span>
            )}
            {paper.original_filename && (
              <span className="truncate">{paper.original_filename}</span>
            )}
          </div>
          {paper.tags && paper.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {paper.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaperListPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: papers, isLoading, isError, error, refetch } = usePapers();

  // Local search filter
  const filteredPapers = useMemo(() => {
    if (!papers) return [];
    if (!searchQuery.trim()) return papers;
    const query = searchQuery.toLowerCase();
    return papers.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        (p.authors && p.authors.toLowerCase().includes(query)) ||
        (p.abstract && p.abstract.toLowerCase().includes(query)) ||
        (p.doi && p.doi.toLowerCase().includes(query)),
    );
  }, [papers, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPapers.length / PAGE_SIZE));
  const paginatedPapers = filteredPapers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="mx-auto max-w-5xl">
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
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
              aria-label="清除搜索"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={() => navigate('/papers/create')}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          上传论文
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <Loading message="正在加载论文列表..." />
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <svg
            className="mx-auto mb-3 h-10 w-10 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm font-medium text-red-600">
            加载论文列表失败
          </p>
          <p className="mt-1 text-xs text-red-500">
            {error instanceof Error ? error.message : '请检查网络连接后重试'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            重新加载
          </button>
        </div>
      ) : paginatedPapers.length === 0 && filteredPapers.length === 0 && !searchQuery ? (
        <EmptyState
          title="还没有论文"
          message={'点击上方"上传论文"按钮添加你的第一篇论文'}
          action={
            <button
              onClick={() => navigate('/papers/create')}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              上传第一篇论文
            </button>
          }
        />
      ) : paginatedPapers.length === 0 && searchQuery ? (
        <EmptyState
          title="未找到匹配的论文"
          message="尝试使用不同的关键词搜索"
        />
      ) : (
        <>
          <div className="space-y-3">
            {paginatedPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
