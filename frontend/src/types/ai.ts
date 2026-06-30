export interface AIAnalysisResult {
  summary: string;
  keywords: string[];
  main_points: string[];
}

export interface AIAnalysisStatus {
  id: number;
  paper_id: number;
  analysis_type: string;
  status: "pending" | "processing" | "completed" | "failed" | "stale";
  result: AIAnalysisResult | null;
  error_message: string | null;
  version: number;
  model_name: string | null;
  tokens_used: number | null;
  created_at: string | null;
  completed_at: string | null;
}
