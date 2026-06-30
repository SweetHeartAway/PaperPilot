import { fetchPaperList } from "../api/papers";
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
  const response = await fetchPaperList({ skip, limit: pageSize, search });
  return {
    papers: response.items,
    total: response.total,
    totalPages: Math.ceil(response.total / pageSize) || 1,
  };
}
