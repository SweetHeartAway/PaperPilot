import { isAxiosError } from "axios";
import client from "./client";
import type { AIAnalysisStatus } from "../types/ai";

/** 获取论文 AI 分析结果（返回 null 表示尚未分析） */
export async function fetchPaperAISummary(
  paperId: number,
  analysisType?: string,
  version?: number,
): Promise<AIAnalysisStatus | null> {
  try {
    const params: Record<string, string> = {};
    if (analysisType) params.analysis_type = analysisType;
    if (version !== undefined) params.version = String(version);
    const res = await client.get(`/api/v1/papers/${paperId}/ai-summary`, { params });
    return res.data;
  } catch (err: unknown) {
    if (isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

/** 触发论文 AI 分析（支持 force_regenerate 和 custom_prompt_id） */
export function triggerPaperAISummary(
  paperId: number,
  options?: {
    analysisType?: string;
    forceRegenerate?: boolean;
    customPromptId?: number;
  },
): Promise<AIAnalysisStatus> {
  const body: Record<string, string | number | boolean> = {};
  if (options?.analysisType) body.analysis_type = options.analysisType;
  if (options?.forceRegenerate) body.force_regenerate = true;
  if (options?.customPromptId) body.custom_prompt_id = options.customPromptId;
  return client.post(`/api/v1/papers/${paperId}/ai-summary`, body).then((res) => res.data);
}

/** 批量触发 AI 分析 */
export interface BatchAnalysisResult {
  paper_id: number;
  status: string;
  analysis_id: number | null;
  reason: string | null;
}

export interface BatchAnalysisResponse {
  total: number;
  accepted: number;
  skipped: number;
  results: BatchAnalysisResult[];
}

export function batchTriggerAIAnalysis(
  paperIds: number[],
  analysisType?: string,
): Promise<BatchAnalysisResponse> {
  return client
    .post("/api/v1/papers/batch/ai-summary", {
      paper_ids: paperIds,
      analysis_type: analysisType || "summary",
    })
    .then((res) => res.data);
}

/** 获取 AI 分析版本列表 */
export interface AnalysisVersionItem {
  version: number;
  status: string;
  model_name: string | null;
  tokens_used: number | null;
  created_at: string | null;
  completed_at: string | null;
}

export function fetchPaperAISummaryVersions(paperId: number): Promise<AnalysisVersionItem[]> {
  return client.get(`/api/v1/papers/${paperId}/ai-summary/versions`).then((res) => res.data);
}

/** 对比两个 AI 分析版本 */
export interface VersionDiff {
  version_a: number;
  version_b: number;
  summary_changed: boolean;
  summary: { old: string; new: string };
  keywords_added: string[];
  keywords_removed: string[];
  main_points_added: string[];
  main_points_removed: string[];
}

export function fetchPaperAISummaryDiff(
  paperId: number,
  v1: number,
  v2: number,
): Promise<VersionDiff> {
  return client
    .get(`/api/v1/papers/${paperId}/ai-summary/versions/diff`, {
      params: { v1, v2 },
    })
    .then((res) => res.data);
}
