import type { ReactNode } from "react";
import { formatDate, formatFileSize } from "../../utils/format";
import type { Paper } from "../../types/paper";

export interface PaperEditForm {
  title: string;
  abstract: string;
  authors: string;
  doi: string;
  publication_date: string;
}

interface PaperInfoProps {
  paper: Paper;
  /** 论文文件下载 URL（需由父层拼接，避免组件直接引用 api/） */
  downloadUrl?: string;
  /** 标题右侧操作区插槽（收藏按钮等） */
  titleActions?: ReactNode;
  /** 引用导出 URL（BibTeX/RIS） */
  exportUrls?: { bibtex?: string; ris?: string };
  // ─── Edit mode ───
  editing?: boolean;
  editForm?: PaperEditForm;
  onEditFormChange?: (field: keyof PaperEditForm, value: string) => void;
  onStartEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  savePending?: boolean;
  // ─── File operations ───
  onDeleteFile?: () => void;
  deleteFilePending?: boolean;
  // ─── Delete paper ───
  onDeletePaper?: () => void;
  deletePaperPending?: boolean;
}

export default function PaperInfo({
  paper,
  downloadUrl,
  titleActions,
  exportUrls,
  editing,
  editForm,
  onEditFormChange,
  onStartEdit,
  onSave,
  onCancel,
  savePending,
  onDeleteFile,
  deleteFilePending,
  onDeletePaper,
  deletePaperPending,
}: PaperInfoProps) {
  // ─── Read mode ───
  if (!editing) {
    return (
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold text-gray-900">{paper.title}</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            {titleActions}
            <button
              onClick={onStartEdit}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
              aria-label="编辑论文"
            >
              编辑
            </button>
          </div>
        </div>

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

        {paper.file_uuid && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {downloadUrl && (
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
            )}
            <button
              onClick={onDeleteFile}
              disabled={deleteFilePending}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="删除文件"
            >
              {deleteFilePending ? "删除中..." : "删除文件"}
            </button>
          </div>
        )}

        {exportUrls && (exportUrls.bibtex || exportUrls.ris) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-400">引用导出：</span>
            {exportUrls.bibtex && (
              <a
                href={exportUrls.bibtex}
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                BibTeX
              </a>
            )}
            {exportUrls.ris && (
              <a
                href={exportUrls.ris}
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                RIS
              </a>
            )}
          </div>
        )}

        {onDeletePaper && (
          <div className="mt-8 border-t border-red-100 pt-4">
            <button
              onClick={onDeletePaper}
              disabled={deletePaperPending}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="删除论文"
            >
              {deletePaperPending ? "删除中..." : "删除论文"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Edit mode ───
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500">标题</label>
          <input
            type="text"
            value={editForm?.title ?? ""}
            onChange={(e) => onEditFormChange?.("title", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base font-semibold text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium text-gray-500">作者</label>
        <input
          type="text"
          value={editForm?.authors ?? ""}
          onChange={(e) => onEditFormChange?.("authors", e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500">发表日期</label>
          <input
            type="date"
            value={editForm?.publication_date ?? ""}
            onChange={(e) => onEditFormChange?.("publication_date", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500">DOI</label>
          <input
            type="text"
            value={editForm?.doi ?? ""}
            onChange={(e) => onEditFormChange?.("doi", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium text-gray-500">摘要</label>
        <textarea
          value={editForm?.abstract ?? ""}
          onChange={(e) => onEditFormChange?.("abstract", e.target.value)}
          rows={5}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={savePending}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savePending ? "保存中..." : "保存"}
        </button>
        <button
          onClick={onCancel}
          disabled={savePending}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          取消
        </button>
      </div>
    </div>
  );
}
