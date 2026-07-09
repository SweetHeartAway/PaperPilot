import type { Tag } from "./tag";
import type { Collection } from "./collection";

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
  collections?: Collection[];
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

export interface DOILookupResponse {
  title: string;
  authors: string;
  abstract: string | null;
  publication_date: string | null;
}

export interface TagDistributionItem {
  id: number;
  name: string;
  paper_count: number;
}

export interface AIAnalysisStats {
  total: number;
  completed: number;
  failed: number;
  total_tokens: number;
}

export interface MonthlyPaperCount {
  month: string;
  count: number;
}

export interface PaperStats {
  total_papers: number;
  favorited_papers: number;
  total_tags: number;
  papers_with_files: number;
  average_file_size: number | null;
  tag_distribution: TagDistributionItem[];
  ai_analysis: AIAnalysisStats;
  papers_by_month: MonthlyPaperCount[];
}
