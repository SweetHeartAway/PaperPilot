import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPaperList, type PaperListQuery } from "../services/paperService";
import { fetchPaper, addPaperTag, removePaperTag } from "../api/papers";
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

export function usePaperAISummary(paperId: number) {
  return useQuery<AIAnalysisStatus | null>({
    queryKey: ["paper", paperId, "ai-summary"],
    queryFn: () => fetchPaperAISummary(paperId),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && (data.status === "pending" || data.status === "processing") ? 2000 : false;
    },
  });
}

export function useTriggerAIAnalysis(paperId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => triggerPaperAISummary(paperId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paper", paperId, "ai-summary"] });
    },
  });
}

// ─── Tags ───

export function useAddPaperTag(paperId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => addPaperTag(paperId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paper", paperId] });
    },
  });
}

export function useRemovePaperTag(paperId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: number) => removePaperTag(paperId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paper", paperId] });
    },
  });
}
