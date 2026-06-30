import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import FileUploadArea from "../components/ui/FileUploadArea";
import UploadProgress from "../components/ui/UploadProgress";
import { createPaper, uploadPaperFile } from "../api/papers";

type PageStatus = "form" | "creating" | "uploading" | "success" | "error";

export default function PaperCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [abstract, setAbstract] = useState("");
  const [doi, setDoi] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");

  // Upload state
  const [status, setStatus] = useState<PageStatus>("form");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const isSubmitting = status === "creating" || status === "uploading";

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
  }, []);

  // ─── Submit handler ───

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !file) return;

    setStatus("creating");
    setErrorMessage("");

    try {
      // Step 1: Create paper metadata
      const paper = await createPaper({
        title: title.trim(),
        authors: authors.trim() || undefined,
        abstract: abstract.trim() || undefined,
        doi: doi.trim() || undefined,
      });

      // Step 2: Upload PDF
      setStatus("uploading");
      await uploadPaperFile(paper.id, file, (pct: number) => setProgress(pct));

      // Step 3: Success
      setStatus("success");

      // Invalidate paper list cache so list refreshes
      queryClient.invalidateQueries({ queryKey: ["papers"] });

      // Redirect to paper list after brief delay
      setTimeout(() => navigate("/papers"), 1500);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "上传失败，请重试");
    }
  }, [title, authors, abstract, doi, file, navigate, queryClient]);

  const handleRetry = useCallback(() => {
    setStatus("form");
    setProgress(0);
    setErrorMessage("");
  }, []);

  // ─── Render ───

  const renderForm = () => (
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
        <input
          id="paper-doi"
          type="text"
          value={doi}
          onChange={(e) => setDoi(e.target.value)}
          disabled={isSubmitting}
          placeholder="10.xxxx/xxxxx"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
        />
      </div>

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
          statusText={`上传失败：${errorMessage}`}
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
  );

  const renderSuccess = () => (
    <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
      <svg
        className="mx-auto mb-3 h-12 w-12 text-green-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <h2 className="text-lg font-medium text-green-800">上传成功</h2>
      <p className="mt-1 text-sm text-green-600">正在返回论文列表...</p>
      <div className="mt-4">
        <UploadProgress percent={100} variant="success" statusText="上传成功" />
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">上传论文</h1>
      {status === "success" ? renderSuccess() : renderForm()}
    </div>
  );
}
