import { useState } from "react";
import {
  usePromptTemplates,
  useCreatePromptTemplate,
  useUpdatePromptTemplate,
  useDeletePromptTemplate,
  useSetDefaultPromptTemplate,
} from "../hooks/usePrompts";
import Content from "../layout/Content";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import { getErrorMessage } from "../utils/error";
import type { PromptTemplate } from "../types/prompt";

const ANALYSIS_TYPE_OPTIONS = [
  { value: "summary", label: "摘要 (Summary)" },
  { value: "method", label: "Method" },
  { value: "result", label: "Result" },
  { value: "conclusion", label: "Conclusion" },
  { value: "keywords", label: "关键词 (Keywords)" },
  { value: "full_analysis", label: "完整分析 (Full Analysis)" },
];

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  summary: "摘要",
  method: "Method",
  result: "Result",
  conclusion: "Conclusion",
  keywords: "关键词",
  full_analysis: "完整分析",
};

// ─── 空表单 ───

const EMPTY_FORM = {
  name: "",
  description: "",
  analysis_type: "summary",
  system_prompt: "",
  user_prompt_template: "",
};

type FormState = typeof EMPTY_FORM;

// ─── 表单组件 ───

function PromptForm({
  form,
  onChange,
  onSave,
  onCancel,
  savePending,
  isEdit,
}: {
  form: FormState;
  onChange: (field: keyof FormState, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  savePending: boolean;
  isEdit: boolean;
}) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
      <h3 className="mb-4 text-sm font-semibold text-blue-800">
        {isEdit ? "编辑模板" : "新建模板"}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-600">名称 *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="模板名称"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600">分析类型 *</label>
          <select
            value={form.analysis_type}
            onChange={(e) => onChange("analysis_type", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {ANALYSIS_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600">描述</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="可选的模板描述"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600">系统提示词 *</label>
          <textarea
            value={form.system_prompt}
            onChange={(e) => onChange("system_prompt", e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            placeholder="You are an AI research assistant..."
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600">
            用户提示模板
            <span className="ml-1 font-normal text-gray-400">
              (可选，支持 {"{content}"} {"{title}"} {"{abstract}"} 占位符)
            </span>
          </label>
          <textarea
            value={form.user_prompt_template}
            onChange={(e) => onChange("user_prompt_template", e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            placeholder="留空则仅传入论文内容"
          />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={savePending || !form.name.trim() || !form.system_prompt.trim()}
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

// ─── 主页面 ───

export default function PromptsPage() {
  const { data: templates, isLoading, isError, error, refetch } = usePromptTemplates();
  const createMutation = useCreatePromptTemplate();
  const updateMutation = useUpdatePromptTemplate();
  const deleteMutation = useDeletePromptTemplate();
  const setDefaultMutation = useSetDefaultPromptTemplate();

  // Create mode
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);

  // Edit mode
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ─── Helpers ───

  const resetCreate = () => {
    setShowCreate(false);
    setCreateForm(EMPTY_FORM);
  };

  const startEdit = (t: PromptTemplate) => {
    setEditingId(t.id);
    setEditForm({
      name: t.name,
      description: t.description ?? "",
      analysis_type: t.analysis_type,
      system_prompt: t.system_prompt,
      user_prompt_template: t.user_prompt_template ?? "",
    });
    setDeletingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  };

  // ─── Handlers ───

  const handleCreate = () => {
    if (!createForm.name.trim() || !createForm.system_prompt.trim()) return;
    createMutation.mutate(
      {
        name: createForm.name.trim(),
        description: createForm.description || undefined,
        analysis_type: createForm.analysis_type,
        system_prompt: createForm.system_prompt.trim(),
        user_prompt_template: createForm.user_prompt_template || undefined,
      },
      { onSuccess: () => resetCreate() },
    );
  };

  const handleUpdate = () => {
    if (editingId === null || !editForm.name.trim() || !editForm.system_prompt.trim()) return;
    updateMutation.mutate(
      {
        id: editingId,
        data: {
          name: editForm.name.trim(),
          description: editForm.description || undefined,
          analysis_type: editForm.analysis_type,
          system_prompt: editForm.system_prompt.trim(),
          user_prompt_template: editForm.user_prompt_template || undefined,
        },
      },
      { onSuccess: () => cancelEdit() },
    );
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => setDeletingId(null),
    });
  };

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate(id);
  };

  return (
    <Content maxWidth="max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Prompt 模板管理</h1>
        {!showCreate && (
          <button
            onClick={() => {
              setShowCreate(true);
              setEditingId(null);
              setDeletingId(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
            新建模板
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6">
          <PromptForm
            form={createForm}
            onChange={(field, value) => setCreateForm((prev) => ({ ...prev, [field]: value }))}
            onSave={handleCreate}
            onCancel={resetCreate}
            savePending={createMutation.isPending}
            isEdit={false}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="加载模板失败"
          message={getErrorMessage(error, "请检查网络连接后重试")}
          onRetry={() => refetch()}
        />
      ) : templates && templates.length === 0 ? (
        <EmptyState
          title="还没有 Prompt 模板"
          message="创建模板后可自定义 AI 分析的提示词"
          action={
            <button
              onClick={() => {
                setShowCreate(true);
                setEditingId(null);
                setDeletingId(null);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              创建第一个模板
            </button>
          }
        />
      ) : (
        /* Template list */
        <div className="space-y-4">
          {templates?.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-sm"
            >
              {editingId === t.id ? (
                /* ─── Edit mode ─── */
                <PromptForm
                  form={editForm}
                  onChange={(field, value) => setEditForm((prev) => ({ ...prev, [field]: value }))}
                  onSave={handleUpdate}
                  onCancel={cancelEdit}
                  savePending={updateMutation.isPending}
                  isEdit
                />
              ) : deletingId === t.id ? (
                /* ─── Delete confirmation ─── */
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        确认删除模板「{t.name}」？
                      </p>
                      <p className="mt-1 text-xs text-gray-500">此操作不可撤销</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={deleteMutation.isPending}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleteMutation.isPending ? "删除中..." : "确认删除"}
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ─── Display mode ─── */
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">{t.name}</h3>
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                          {ANALYSIS_TYPE_LABELS[t.analysis_type] ?? t.analysis_type}
                        </span>
                        {t.is_default && (
                          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600">
                            默认
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <p className="mt-1 text-sm text-gray-500">{t.description}</p>
                      )}
                      <div className="mt-3 rounded-md bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-500">系统提示词</p>
                        <p className="mt-1 text-sm text-gray-700 line-clamp-3">{t.system_prompt}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startEdit(t)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                          aria-label={`编辑模板 ${t.name}`}
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(t.id);
                            setEditingId(null);
                          }}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          aria-label={`删除模板 ${t.name}`}
                        >
                          删除
                        </button>
                      </div>
                      {!t.is_default && (
                        <button
                          onClick={() => handleSetDefault(t.id)}
                          disabled={setDefaultMutation.isPending}
                          className="rounded-md px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50"
                          aria-label={`设为默认 ${t.name}`}
                        >
                          设为默认
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Content>
  );
}
