export interface Tag {
  id: number;
  name: string;
  color?: string;
  created_at: string;
}

export interface TagDetail extends Tag {
  paper_count: number;
}
