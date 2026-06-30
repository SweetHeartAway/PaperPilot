import { isAxiosError } from "axios";
import client from "./client";
import type { AIAnalysisStatus } from "../types/ai";

/** 获取论文 AI 分析结果（返回 null 表示尚未分析） */
export async function fetchPaperAISummary(
  paperId: number,
  analysisType?: string,
): Promise<AIAnalysisStatus | null> {
  try {
    const params: Record<string, string> = {};
    if (analysisType) params.analysis_type = analysisType;
    const res = await client.get(`/api/v1/papers/${paperId}/ai-summary`, { params });
    return res.data;
  } catch (err: unknown) {
    if (isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

/** 触发论文 AI 分析 */
export function triggerPaperAISummary(
  paperId: number,
  options?: { analysisType?: string },
): Promise<AIAnalysisStatus> {
  const body: Record<string, string> = {};
  if (options?.analysisType) body.analysis_type = options.analysisType;
  return client.post(`/api/v1/papers/${paperId}/ai-summary`, body).then((res) => res.data);
}
