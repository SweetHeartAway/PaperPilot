import { isAxiosError } from "axios";
import client from "./client";
import type { AIAnalysisStatus } from "../types/ai";

/** 获取论文 AI 分析结果（返回 null 表示尚未分析） */
export async function fetchPaperAISummary(paperId: number): Promise<AIAnalysisStatus | null> {
  try {
    const res = await client.get(`/api/v1/papers/${paperId}/ai-summary`);
    return res.data;
  } catch (err: unknown) {
    if (isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

/** 触发论文 AI 分析 */
export function triggerPaperAISummary(paperId: number): Promise<AIAnalysisStatus> {
  return client.post(`/api/v1/papers/${paperId}/ai-summary`).then((res) => res.data);
}
