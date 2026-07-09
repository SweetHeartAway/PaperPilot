import { useState, useEffect } from "react";
import {
  useAllCollections,
  useAddPapersToCollection,
  useRemovePaperFromCollection,
} from "../../hooks/useCollections";
import { getErrorMessage } from "../../utils/error";
import type { Collection } from "../../types/collection";

interface CollectionSelectorModalProps {
  /** 论文 ID */
  paperId: number;
  /** 论文当前已加入的阅读列表 */
  paperCollections: Collection[];
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

export default function CollectionSelectorModal({
  paperId,
  paperCollections,
  open,
  onClose,
}: CollectionSelectorModalProps) {
  const { data: allCollections, isLoading, isError, error } = useAllCollections();

  // ─── Local selection state ───
  const initialIds = new Set(paperCollections.map((c) => c.id));
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set(initialIds));

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(paperCollections.map((c) => c.id)));
    }
  }, [open, paperCollections]);

  // ─── Mutations ───
  const addMutation = useAddPapersToCollection();
  const removeMutation = useRemovePaperFromCollection();
  const isPending = addMutation.isPending || removeMutation.isPending;

  const toggleCollection = (collectionId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    const currentIds = new Set(paperCollections.map((c) => c.id));
    const toAdd: number[] = [];
    const toRemove: number[] = [];

    selectedIds.forEach((id) => {
      if (!currentIds.has(id)) {
        toAdd.push(id);
      }
    });
    currentIds.forEach((id) => {
      if (!selectedIds.has(id)) {
        toRemove.push(id);
      }
    });

    if (toAdd.length === 0 && toRemove.length === 0) {
      onClose();
      return;
    }

    try {
      // Run additions and removals in parallel
      const promises: Promise<unknown>[] = [];

      for (const collectionId of toAdd) {
        promises.push(addMutation.mutateAsync({ collectionId, paperIds: [paperId] }));
      }
      for (const collectionId of toRemove) {
        promises.push(removeMutation.mutateAsync({ collectionId, paperId }));
      }

      await Promise.all(promises);
      onClose();
    } catch {
      // Toast notifications are handled by the mutation hooks
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-medium text-gray-900">管理阅读列表</h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
            <span className="ml-2 text-sm text-gray-500">加载列表中...</span>
          </div>
        ) : isError ? (
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-sm text-red-600">{getErrorMessage(error, "加载阅读列表失败")}</p>
          </div>
        ) : allCollections && allCollections.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-500">还没有任何阅读列表</p>
            <p className="mt-1 text-xs text-gray-400">请先在「列表管理」页面创建列表</p>
          </div>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {allCollections?.map((col) => {
              const isSelected = selectedIds.has(col.id);
              return (
                <label
                  key={col.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50 ${
                    isSelected ? "bg-green-50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCollection(col.id)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{col.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{col.paper_count} 篇</span>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || isError || isPending}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
