import { formatDate, formatFileSize } from "../../utils/format";
import type { Paper } from "../../types/paper";

interface PaperInfoProps {
  paper: Paper;
  /** 论文文件下载 URL（需由父层拼接，避免组件直接引用 api/） */
  downloadUrl?: string;
}

export default function PaperInfo({ paper, downloadUrl }: PaperInfoProps) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">{paper.title}</h1>

      {paper.authors && <p className="mt-2 text-sm text-gray-600">{paper.authors}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
        {paper.publication_date && (
          <time dateTime={paper.publication_date}>{formatDate(paper.publication_date)}</time>
        )}
        {paper.doi && (
          <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-[200px] truncate text-blue-500 underline transition-colors hover:text-blue-700"
            title={paper.doi}
          >
            DOI: {paper.doi}
          </a>
        )}
      </div>

      {paper.abstract && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-800">摘要</h2>
          <p className="text-sm leading-relaxed text-gray-600">{paper.abstract}</p>
        </div>
      )}

      {paper.file_uuid && downloadUrl && (
        <div className="mt-6">
          <a
            href={downloadUrl}
            download
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            下载论文
            {paper.file_size && (
              <span className="text-xs text-gray-400">({formatFileSize(paper.file_size)})</span>
            )}
          </a>
        </div>
      )}
    </div>
  );
}
