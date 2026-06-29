export interface AIAnalysis {
  id: number;
  paper_id: number;
  summary?: string;
  keywords?: string;
  created_at: string;
}

export interface PaperRecommendation {
  id: number;
  paper_id: number;
  recommended_paper_id: number;
  score: number;
  reason?: string;
}
