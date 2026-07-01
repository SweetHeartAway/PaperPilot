import { useState } from "react";
import { useAllTags, useCreateTag, useUpdateTag, useDeleteTag } from "../hooks/useTagManagement";
import Content from "../layout/Content";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../utils/error";

export default function TagsPage() {
  const { data: tags, isLoading, isError, error, refetch } = useAllTags();
  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();
  const deleteTagMutation = useDeleteTag();
  const toast = useToast();

  // ─── Create tag ───
  const [showCreate, setShowCreate] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  // Inline editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ─── Create handler ───

  const handleCreate = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) {
      toast.error("标签名称不能为空");
      return;
    }
    try {
      await createTagMutation.mutateAsync({ name: trimmed });
      toast.success("标签已创建");
      setNewTagName("");
      setShowCreate(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "创建标签失败"));
    }
  };

  // ─── Edit handlers ───

  const startEditing = (id: number, name: string) => {
    setEditingId(id);
    setEditName(name);
    setDeletingId(null);
    setShowCreate(false);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleSaveEdit = async () => {
    if (editingId === null) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error("标签名称不能为空");
      return;
    }
    try {
      await updateTagMutation.mutateAsync({ id: editingId, name: trimmed });
      toast.success("标签已更新");
      setEditingId(null);
      setEditName("");
    } catch (err) {
      toast.error(getErrorMessage(err, "更新标签失败"));
    }
  };

  // ─── Delete handler ───

  const handleDelete = async (id: number) => {
    try {
      await deleteTagMutation.mutateAsync(id);
      toast.success("标签已删除");
      setDeletingId(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "删除标签失败"));
    }
  };

  return (
    <Content maxWidth="max-w-3xl">
      {/* Header with create button */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">标签管理</h1>
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
            新建标签
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <label className="block text-xs font-medium text-blue-700">新标签名称</label>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setShowCreate(false);
                  setNewTagName("");
                }
              }}
              placeholder="输入标签名称"
              className="w-48 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={createTagMutation.isPending || !newTagName.trim()}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {createTagMutation.isPending ? "创建中..." : "创建"}
            </button>
            <button
              onClick={() => {
                setShowCreate(false);
                setNewTagName("");
              }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : /* Error state */
      isError ? (
        <ErrorState
          title="加载标签失败"
          message={getErrorMessage(error, "请检查网络连接后重试")}
          onRetry={() => refetch()}
        />
      ) : /* Empty state */
      tags && tags.length === 0 ? (
        <EmptyState
          title="还没有标签"
          message="创建标签后可在论文详情页中为论文添加标签"
          action={
            <button
              onClick={() => {
                setShowCreate(true);
                setEditingId(null);
                setDeletingId(null);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              创建第一个标签
            </button>
          }
        />
      ) : (
        /* Tag list */
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  标签名称
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tags?.map((tag) => (
                <tr key={tag.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {editingId === tag.id ? (
                      /* Inline edit mode */
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") cancelEditing();
                          }}
                          className="w-48 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          disabled={updateTagMutation.isPending}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                          aria-label="保存标签"
                        >
                          保存
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                          aria-label="取消编辑"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{tag.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {deletingId === tag.id ? (
                      /* Delete confirmation */
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm text-red-600">确认删除?</span>
                        <button
                          onClick={() => handleDelete(tag.id)}
                          disabled={deleteTagMutation.isPending}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                          aria-label="确认删除标签"
                        >
                          确认
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                          aria-label="取消删除"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEditing(tag.id, tag.name)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                          aria-label={`编辑标签 ${tag.name}`}
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(tag.id);
                            setEditingId(null);
                          }}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          aria-label={`删除标签 ${tag.name}`}
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Content>
  );
}
