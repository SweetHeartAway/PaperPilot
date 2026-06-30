import {
  fetchPaperList as apiFetchPaperList,
  fetchPaper as apiFetchPaper,
  addPaperTag as apiAddPaperTag,
  removePaperTag as apiRemovePaperTag,
} from "../api/papers";
import type { Paper } from "../types/paper";

export interface PaperListQuery {
  page: number;
  pageSize: number;
  search?: string;
}

export interface PaperListData {
  papers: Paper[];
  total: number;
  totalPages: number;
}

export async function getPaperList(query: PaperListQuery): Promise<PaperListData> {
  const { page, pageSize, search } = query;
  const skip = (page - 1) * pageSize;
  const response = await apiFetchPaperList({ skip, limit: pageSize, search });
  return {
    papers: response.items,
    total: response.total,
    totalPages: Math.ceil(response.total / pageSize) || 1,
  };
}

/** 获取单篇论文 */
export function fetchPaper(id: number): Promise<Paper> {
  return apiFetchPaper(id);
}

/** 为论文添加标签 */
export function addPaperTag(paperId: number, name: string): Promise<Paper> {
  return apiAddPaperTag(paperId, name);
}

/** 从论文移除标签 */
export function removePaperTag(paperId: number, tagId: number): Promise<void> {
  return apiRemovePaperTag(paperId, tagId);
}
