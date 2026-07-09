import type { Tag } from "./tag";

export interface Paper {
  id: number;
  title: string;
  abstract?: string;
  authors?: string;
  publication_date?: string;
  doi?: string;
  is_favorite: boolean;
  file_uuid?: string;
  original_filename?: string;
  file_size?: number;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface PaperListParams {
  skip?: number;
  limit?: number;
  search?: string;
}

export interface PaperListResponse {
  items: Paper[];
  total: number;
}

export interface BatchActionItem {
  paper_id: number;
  status: "success" | "failed";
  reason: string | null;
}

export interface BatchActionResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: BatchActionItem[];
}
