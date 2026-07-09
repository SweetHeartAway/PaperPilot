import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import FileUploadArea from "../components/ui/FileUploadArea";
import UploadProgress from "../components/ui/UploadProgress";
import { useCreatePaper } from "../hooks/useCreatePaper";
import { uploadPaperFile, lookupDOI } from "../api/papers";
import { useAllTags } from "../hooks/useTagManagement";
import { useToast } from "../hooks/useToast";

type PageStatus = "form" | "creating" | "uploading" | "error";

export default function PaperCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const createPaperMutation = useCreatePaper();

  // Form state
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [abstract, setAbstract] = useState("");
  const [doi, setDoi] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");

  // Load tags for selector
  const { data: allTags } = useAllTags();

  // Upload state
  const [status, setStatus] = useState<PageStatus>("form");
  const [progress, setProgress] = useState(0);

  /** 缓存已创建的论文 ID，重试时避免重复创建 */
  const paperIdRef = useRef<number | null>(null);

  const isSubmitting = status === "creating" || status === "uploading";

  // Track toast id so we can dismiss it after creating → uploading transition
  const loadingToastRef = useRef<(() => void) | null>(null);

  // ─── File validation ───

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (selectedFile.type === "application/pdf" || selectedFile.name.endsWith(".pdf")) {
      setFile(selectedFile);
      setFileError("");
    } else {
      setFileError("仅支持 PDF 文件");
    }
  }, []);

  const handleFileRemove = useCallback(() => {
    setFile(null);
    setFileError("");
    setProgress(0);
  }, []);

  // ─── DOI auto-complete ───

  const [doiLoading, setDoiLoading] = useState(false);
  const [doiError, setDoiError] = useState("");

  const handleDOILookup = useCallback(async () => {
    const d = doi.trim();
    if (!d) return;
    setDoiLoading(true);
    setDoiError("");
    try {
      const result = await lookupDOI(d);
      if (result.title) setTitle(result.title);
      if (result.authors) setAuthors(result.authors);
      if (result.abstract) setAbstract(result.abstract);
      if (result.publication_date) {
        setPublicationDate(result.publication_date.slice(0, 10));
      }
    } catch (err) {
      setDoiError(err instanceof Error ? err.message : "DOI 查询失败");
    } finally {
      setDoiLoading(false);
    }
  }, [doi]);

  // ─── Submit handler ───

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !file) return;

    const hasCachedPaper = paperIdRef.current !== null;

    if (!hasCachedPaper) {
      setStatus("creating");
      loadingToastRef.current = toast.loading("正在创建论文...");
    } else {
      // 有缓存 paperId → 重试场景，跳过创建直接上传
      setStatus("uploading");
    }

    try {
      let paperId: number;

      if (hasCachedPaper) {
        paperId = paperIdRef.current!;
      } else {
        const paper = await createPaperMutation.mutateAsync({
          title: title.trim(),
          authors: authors.trim() || undefined,
          abstract: abstract.trim() || undefined,
          doi: doi.trim() || undefined,
          publication_date: publicationDate ? new Date(publicationDate).toISOString() : undefined,
          tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        });
        paperIdRef.current = paper.id;
        paperId = paper.id;

        // Dismiss "creating" toast
        loadingToastRef.current?.();
        loadingToastRef.current = null;
        setStatus("uploading");
      }

      // Upload PDF
      await uploadPaperFile(paperId, file, (pct: number) => setProgress(pct));

      // Success
      toast.success("论文上传成功");
      paperIdRef.current = null; // 清理缓存
      navigate("/papers");
    } catch (err) {
      setStatus("error");
      loadingToastRef.current?.();
      loadingToastRef.current = null;
      toast.error(err instanceof Error ? err.message : "上传失败，请重试");
    }
  }, [title, authors, abstract, doi, file, navigate, toast, createPaperMutation]);

  const handleRetry = useCallback(() => {
    setStatus("form");
    setProgress(0);
    // 注意：paperIdRef 不清空，重试时复用已有论文 ID 避免重复创建
  }, []);

  // ─── Render ───

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">上传论文</h1>

      <div className="space-y-6">
        {/* File upload area */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            PDF 文件 <span className="text-red-500">*</span>
          </label>
          <FileUploadArea
            file={file}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            disabled={isSubmitting}
            error={fileError}
          />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="paper-title" className="mb-1 block text-sm font-medium text-gray-700">
            标题 <span className="text-red-500">*</span>
          </label>
          <input
            id="paper-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            placeholder="输入论文标题"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          />
        </div>

        {/* Authors */}
        <div>
          <label htmlFor="paper-authors" className="mb-1 block text-sm font-medium text-gray-700">
            作者
          </label>
          <input
            id="paper-authors"
            type="text"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
            disabled={isSubmitting}
            placeholder="作者姓名，多个作者用逗号分隔"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          />
        </div>

        {/* DOI */}
        <div>
          <label htmlFor="paper-doi" className="mb-1 block text-sm font-medium text-gray-700">
            DOI
          </label>
          <div className="flex gap-2">
            <input
              id="paper-doi"
              type="text"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              disabled={isSubmitting}
              placeholder="10.xxxx/xxxxx"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            />
            <button
              type="button"
              onClick={handleDOILookup}
              disabled={!doi.trim() || doiLoading || isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {doiLoading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
              {doiLoading ? "查询中..." : "自动补全"}
            </button>
          </div>
          {doiError && <p className="mt-1 text-xs text-red-500">{doiError}</p>}
        </div>

        {/* Publication Date */}
        <div>
          <label htmlFor="paper-date" className="mb-1 block text-sm font-medium text-gray-700">
            发表日期
          </label>
          <input
            id="paper-date"
            type="date"
            value={publicationDate}
            onChange={(e) => setPublicationDate(e.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          />
        </div>

        {/* Tags */}
        {allTags && allTags.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">标签</label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      setSelectedTagIds((prev) =>
                        isSelected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
                      );
                    }}
                    disabled={isSubmitting}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {tag.name}
                    {isSelected && (
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Abstract */}
        <div>
          <label htmlFor="paper-abstract" className="mb-1 block text-sm font-medium text-gray-700">
            摘要
          </label>
          <textarea
            id="paper-abstract"
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            disabled={isSubmitting}
            rows={4}
            placeholder="论文摘要内容"
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          />
        </div>

        {/* Submit / Progress area */}
        {status === "uploading" ? (
          <UploadProgress
            percent={progress}
            variant="uploading"
            statusText={`正在上传... ${progress}%`}
          />
        ) : status === "error" ? (
          <UploadProgress
            percent={progress}
            variant="error"
            statusText="上传失败"
            onRetry={handleRetry}
          />
        ) : status === "creating" ? (
          <UploadProgress percent={0} variant="uploading" statusText="正在创建论文..." />
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !file || isSubmitting}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              上传
            </button>
            <button
              onClick={() => navigate("/papers")}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
