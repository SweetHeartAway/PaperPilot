import { useNavigate } from "react-router-dom";
import { formatDate } from "../../utils/format";
import type { Paper } from "../../types/paper";

export interface PaperCardProps {
  paper: Paper;
}

export default function PaperCard({ paper }: PaperCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/papers/${paper.id}`)}
      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          navigate(`/papers/${paper.id}`);
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
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
            {paper.original_filename && <span className="truncate">{paper.original_filename}</span>}
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
