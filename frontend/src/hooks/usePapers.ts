import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPaperList, type PaperListQuery } from "../services/paperService";
import {
  fetchPaper,
  updatePaper,
  deletePaper,
  deletePaperFile,
  toggleFavorite,
  batchDeletePapers,
  batchAddTag,
} from "../api/papers";
import {
  fetchPaperAISummary,
  triggerPaperAISummary,
  batchTriggerAIAnalysis,
  fetchPaperAISummaryVersions,
  fetchPaperAISummaryDiff,
} from "../api/ai";
import { queryKeys } from "../utils/queryKeys";
import { getErrorMessage } from "../utils/error";
import { useToast } from "./useToast";
import type { Paper } from "../types/paper";
import type { AIAnalysisStatus } from "../types/ai";

export function usePaperList(query: PaperListQuery) {
  return useQuery({
    queryKey: queryKeys.papers.list({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      favoriteOnly: query.favoriteOnly,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      tagIds: query.tagIds,
    }),
    queryFn: () => getPaperList(query),
    placeholderData: (previousData) => previousData,
  });
}

export function usePaper(id: number) {
  return useQuery<Paper>({
    queryKey: queryKeys.papers.detail(id),
    queryFn: () => fetchPaper(id),
    enabled: id > 0,
  });
}

// ─── AI Summary ───

export function usePaperAISummary(paperId: number, analysisType?: string, version?: number) {
  return useQuery<AIAnalysisStatus | null>({
    queryKey: queryKeys.papers.aiSummary(paperId, analysisType ?? "summary", version),
    queryFn: () => fetchPaperAISummary(paperId, analysisType, version),
    enabled: paperId > 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && (data.status === "pending" || data.status === "processing") ? 5000 : false;
    },
  });
}

export function useTriggerAIAnalysis(paperId: number, analysisType?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options?: { forceRegenerate?: boolean; customPromptId?: number }) =>
      triggerPaperAISummary(paperId, {
        analysisType,
        forceRegenerate: options?.forceRegenerate,
        customPromptId: options?.customPromptId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.papers.aiSummary(paperId, analysisType ?? "summary"),
      });
    },
  });
}

// ─── AI Summary Versions ───

export function usePaperAISummaryVersions(paperId: number) {
  return useQuery({
    queryKey: queryKeys.papers.aiSummaryVersions(paperId),
    queryFn: () => fetchPaperAISummaryVersions(paperId),
    enabled: paperId > 0,
  });
}

export function usePaperAISummaryDiff(paperId: number, v1: number | null, v2: number | null) {
  return useQuery({
    queryKey: queryKeys.papers.aiSummaryDiff(paperId, v1, v2),
    queryFn: () => fetchPaperAISummaryDiff(paperId, v1!, v2!),
    enabled: paperId > 0 && v1 !== null && v2 !== null && v1 !== v2,
  });
}

// Tags hooks 已移至 useTags.ts

// ─── Batch AI Analysis ───

export function useBatchAIAnalysis() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (params: { paperIds: number[]; analysisType?: string }) =>
      batchTriggerAIAnalysis(params.paperIds, params.analysisType),
    onSuccess: (data) => {
      if (data.accepted > 0) {
        toast.success(
          `已触发 ${data.accepted} 篇论文的 AI 分析` +
            (data.skipped > 0 ? `，${data.skipped} 篇跳过` : ""),
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.papers.aiSummaries() });
      } else {
        toast.info("所选论文无需重新分析");
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "批量分析触发失败"));
    },
  });
}

// ─── Update Paper ───

export function useUpdatePaper(paperId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: Parameters<typeof updatePaper>[1]) => updatePaper(paperId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.detail(paperId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.lists() });
      toast.success("论文已更新");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "更新论文失败"));
    },
  });
}

// ─── Delete Paper ───

export function useDeletePaper() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => deletePaper(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.lists() });
      toast.success("论文已删除");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "删除论文失败"));
    },
  });
}

// ─── Delete Paper File ───

export function useDeletePaperFile(paperId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: () => deletePaperFile(paperId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.detail(paperId) });
      toast.success("文件已删除");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "删除文件失败"));
    },
  });
}

// ─── Toggle Favorite ───

export function useToggleFavorite(paperId?: number) {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id?: number) => toggleFavorite(id ?? paperId!),
    onSuccess: (updatedPaper, id) => {
      // 更新详情页缓存
      const pid = id ?? paperId;
      if (pid) {
        queryClient.setQueryData(queryKeys.papers.detail(pid), updatedPaper);
      }
      // 刷新列表缓存
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.lists() });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "收藏操作失败"));
    },
  });
}

// ─── Batch Delete ───

export function useBatchDeletePapers() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (paperIds: number[]) => batchDeletePapers(paperIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.lists() });
      if (data.succeeded > 0) {
        toast.success(`已删除 ${data.succeeded} 篇论文`);
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} 篇论文删除失败`);
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "批量删除失败"));
    },
  });
}

// ─── Batch Add Tag ───

export function useBatchAddTag() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (params: { paperIds: number[]; tagName: string }) =>
      batchAddTag(params.paperIds, params.tagName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.lists() });
      if (data.succeeded > 0) {
        toast.success(`已为 ${data.succeeded} 篇论文添加标签`);
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} 篇论文添加标签失败`);
      }
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "批量添加标签失败"));
    },
  });
}
