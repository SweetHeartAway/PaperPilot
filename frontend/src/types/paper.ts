import type { Tag } from './tag';

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
