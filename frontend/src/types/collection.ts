import type { Paper } from "./paper";

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionDetail extends Collection {
  paper_count: number;
  papers?: Paper[];
}

export interface CollectionCreate {
  name: string;
  description?: string | null;
}

export interface CollectionUpdate {
  name?: string;
  description?: string | null;
}

export interface AddToCollectionRequest {
  paper_ids: number[];
}
