import { useState } from "react";
import type { Tag } from "../../types/tag";

interface TagManagerProps {
  tags: Tag[];
  /** 添加标签回调 */
  onAdd: (name: string) => void;
  /** 移除标签回调 */
  onRemove: (tagId: number) => void;
  /** 添加操作是否进行中（控制输入框禁用/loading） */
  addPending?: boolean;
  /** 当前正在移除的标签 ID（控制单标签 loading） */
  removePendingTagId?: number | null;
}

export default function TagManager({
  tags,
  onAdd,
  onRemove,
  addPending = false,
  removePendingTagId = null,
}: TagManagerProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const name = inputValue.trim();
    if (!name) return;
    onAdd(name);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-gray-900">标签</h2>

      <div className="flex flex-wrap items-center gap-2">
        {tags.length === 0 ? (
          <span className="text-sm text-gray-400">暂无标签</span>
        ) : (
          tags.map((tag) => {
            const isRemoving = removePendingTagId === tag.id;
            return (
              <span
                key={tag.id}
                className={`inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 ${
                  isRemoving ? "opacity-50" : ""
                }`}
              >
                {tag.name}
                <button
                  onClick={() => onRemove(tag.id)}
                  disabled={isRemoving}
                  className="inline-flex items-center justify-center text-blue-400 transition-colors hover:text-blue-700 disabled:cursor-not-allowed"
                  aria-label={`移除标签 ${tag.name}`}
                >
                  {isRemoving ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  ) : (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </span>
            );
          })
        )}

        <div className="inline-flex items-center gap-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="添加标签..."
            disabled={addPending}
            className="w-28 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {addPending && (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          )}
        </div>
      </div>
    </section>
  );
}
