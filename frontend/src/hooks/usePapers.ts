import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPaperList, type PaperListQuery } from "../services/paperService";
import { fetchPaper } from "../api/papers";
import { fetchPaperAISummary, triggerPaperAISummary } from "../api/ai";
import type { Paper } from "../types/paper";
import type { AIAnalysisStatus } from "../types/ai";

export function usePaperList(query: PaperListQuery) {
  return useQuery({
    queryKey: ["papers", "list", query.page, query.pageSize, query.search ?? ""],
    queryFn: () => getPaperList(query),
    placeholderData: (previousData) => previousData,
  });
}

export function usePaper(id: number) {
  return useQuery<Paper>({
    queryKey: ["paper", id],
    queryFn: () => fetchPaper(id),
    enabled: id > 0,
  });
}

// ─── AI Summary ───

export function usePaperAISummary(paperId: number, analysisType?: string) {
  return useQuery<AIAnalysisStatus | null>({
    queryKey: ["paper", paperId, "ai-summary", analysisType ?? "summary"],
    queryFn: () => fetchPaperAISummary(paperId, analysisType),
    enabled: paperId > 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && (data.status === "pending" || data.status === "processing") ? 2000 : false;
    },
  });
}

export function useTriggerAIAnalysis(paperId: number, analysisType?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => triggerPaperAISummary(paperId, { analysisType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paper", paperId, "ai-summary"] });
    },
  });
}

// Tags hooks 已移至 useTags.ts
