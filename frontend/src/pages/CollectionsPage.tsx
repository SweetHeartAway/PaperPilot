import { useState } from "react";
import {
  useAllCollections,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
} from "../hooks/useCollections";
import Content from "../layout/Content";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../utils/error";

export default function CollectionsPage() {
  const { data: collections, isLoading, isError, error, refetch } = useAllCollections();
  const createMutation = useCreateCollection();
  const updateMutation = useUpdateCollection();
  const deleteMutation = useDeleteCollection();
  const toast = useToast();

  // ─── Create form ───
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // ─── Inline editing ───
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // ─── Delete confirmation ───
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ─── Create handler ───

  const handleCreate = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      toast.error("列表名称不能为空");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: trimmedName,
        description: newDescription.trim() || null,
      });
      toast.success("阅读列表已创建");
      setNewName("");
      setNewDescription("");
      setShowCreate(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "创建阅读列表失败"));
    }
  };

  // ─── Edit handlers ───

  const startEditing = (id: number, name: string, description: string | null) => {
    setEditingId(id);
    setEditName(name);
    setEditDescription(description ?? "");
    setDeletingId(null);
    setShowCreate(false);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleSaveEdit = async () => {
    if (editingId === null) return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.error("列表名称不能为空");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        data: {
          name: trimmedName,
          description: editDescription.trim() || null,
        },
      });
      toast.success("阅读列表已更新");
      setEditingId(null);
      setEditName("");
      setEditDescription("");
    } catch (err) {
      toast.error(getErrorMessage(err, "更新阅读列表失败"));
    }
  };

  // ─── Delete handler ───

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("阅读列表已删除");
      setDeletingId(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "删除阅读列表失败"));
    }
  };

  return (
    <Content maxWidth="max-w-3xl">
      {/* Header with create button */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">列表管理</h1>
        {!showCreate && (
          <button
            onClick={() => {
              setShowCreate(true);
              setEditingId(null);
              setDeletingId(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
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
            新建列表
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="mb-3">
            <label className="block text-xs font-medium text-green-700">列表名称</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setShowCreate(false);
                  setNewName("");
                  setNewDescription("");
                }
              }}
              placeholder="输入列表名称"
              className="mt-1 w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              autoFocus
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-green-700">描述（可选）</label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="输入列表描述"
              className="mt-1 w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || !newName.trim()}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "创建中..." : "创建"}
            </button>
            <button
              onClick={() => {
                setShowCreate(false);
                setNewName("");
                setNewDescription("");
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
      ) : isError ? (
        <ErrorState
          title="加载阅读列表失败"
          message={getErrorMessage(error, "请检查网络连接后重试")}
          onRetry={() => refetch()}
        />
      ) : collections && collections.length === 0 ? (
        <EmptyState
          title="还没有阅读列表"
          message="创建列表后可将论文分类管理"
          action={
            <button
              onClick={() => {
                setShowCreate(true);
                setEditingId(null);
                setDeletingId(null);
              }}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              创建第一个列表
            </button>
          }
        />
      ) : (
        /* Collection list */
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  列表名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  描述
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  论文数
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {collections?.map((col) => (
                <tr key={col.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {editingId === col.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") cancelEditing();
                        }}
                        className="w-48 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{col.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === col.id ? (
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="描述（可选）"
                        className="w-48 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-500">
                        {col.description || <span className="italic text-gray-400">无描述</span>}
                      </span>
                    )}
                    {editingId === col.id && (
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={updateMutation.isPending}
                          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                          aria-label="保存列表"
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
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      {col.paper_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">
                    {new Date(col.created_at).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {deletingId === col.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm text-red-600">确认删除?</span>
                        <button
                          onClick={() => handleDelete(col.id)}
                          disabled={deleteMutation.isPending}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                          aria-label="确认删除列表"
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
                          onClick={() => startEditing(col.id, col.name, col.description)}
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
                          aria-label={`编辑列表 ${col.name}`}
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(col.id);
                            setEditingId(null);
                          }}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          aria-label={`删除列表 ${col.name}`}
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
