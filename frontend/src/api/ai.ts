import client from "./client";
import type { AIAnalysis, PaperRecommendation } from "../types/ai";

export function fetchAIAnalysis(paperId: number): Promise<AIAnalysis> {
  return client.get(`/api/v1/ai/analysis/${paperId}`).then((res) => res.data);
}

export function fetchRecommendations(paperId: number): Promise<PaperRecommendation[]> {
  return client.get(`/api/v1/ai/recommendations/${paperId}`).then((res) => res.data);
}
