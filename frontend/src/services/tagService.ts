/** 标签服务层 — 数据转换与 API 调用编排 */

import {
  fetchTags as apiFetchTags,
  createTag as apiCreateTag,
  updateTag as apiUpdateTag,
  deleteTag as apiDeleteTag,
} from "../api/tags";
import type { Tag } from "../types/tag";

/** 获取所有标签 */
export function fetchTags(): Promise<Tag[]> {
  return apiFetchTags();
}

/** 创建标签 */
export function createTag(data: { name: string }): Promise<Tag> {
  return apiCreateTag(data);
}

/** 更新标签 */
export function updateTag(id: number, data: { name?: string; color?: string }): Promise<Tag> {
  return apiUpdateTag(id, data);
}

/** 删除标签 */
export function deleteTag(id: number): Promise<void> {
  return apiDeleteTag(id);
}
