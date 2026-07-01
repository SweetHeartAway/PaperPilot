import { memo, type ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../utils/format";

// ─── 自包含的数据接口 ───

/** PaperCard 需要的最小数据形状，复用时不依赖外部类型 */
export interface PaperCardData {
  id: number;
  title: string;
  authors?: string | null;
  abstract?: string | null;
  publication_date?: string | null;
  doi?: string | null;
  original_filename?: string | null;
  tags: { id: number; name: string }[];
}

// ─── Props ───

export interface PaperCardProps<T extends PaperCardData = PaperCardData> {
  paper: T;

  /** 右上角操作区插槽（收藏按钮、操作菜单等） */
  topRight?: ReactNode;

  /** 底部扩展区插槽（AI 摘要预览、标签管理、批量操作等） */
  footer?: ReactNode;

  /** 自定义点击行为，默认跳转详情页 */
  onClick?: (paper: T) => void;
}

// ─── 组件 ───

function PaperCardInner<T extends PaperCardData = PaperCardData>({
  paper,
  topRight,
  footer,
  onClick,
}: PaperCardProps<T>) {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(paper);
    } else {
      navigate(`/papers/${paper.id}`);
    }
  }, [paper, onClick, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-start justify-between gap-4">
        {/* ─── 主体：标题、作者、摘要、元信息、标签 ─── */}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900">{paper.title}</h3>

          {paper.authors && <p className="mt-1 truncate text-sm text-gray-500">{paper.authors}</p>}

          {paper.abstract && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
              {paper.abstract}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
            {paper.publication_date && <span>{formatDate(paper.publication_date)}</span>}
            {paper.doi && (
              <span className="max-w-[180px] truncate" title={paper.doi}>
                DOI: {paper.doi}
              </span>
            )}
            {paper.original_filename && (
              <span className="max-w-[200px] truncate">{paper.original_filename}</span>
            )}
          </div>

          {paper.tags.length > 0 && (
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

        {/* ─── 右上角插槽 ─── */}
        {topRight && <div className="flex-shrink-0">{topRight}</div>}
      </div>

      {/* ─── 底部扩展插槽 ─── */}
      {footer && <div className="mt-3 border-t border-gray-100 pt-3">{footer}</div>}
    </div>
  );
}

const PaperCard = memo(PaperCardInner) as typeof PaperCardInner;
export default PaperCard;
