import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPromptTemplates,
  createPromptTemplate,
  updatePromptTemplate,
  deletePromptTemplate,
  setDefaultPromptTemplate,
} from "../api/prompts";
import type { PromptTemplateCreateData, PromptTemplateUpdateData } from "../types/prompt";
import { useToast } from "./useToast";
import { getErrorMessage } from "../utils/error";

export const promptKeys = {
  all: ["prompts"] as const,
  lists: () => ["prompts", "list"] as const,
  list: (analysisType?: string) => ["prompts", "list", analysisType ?? "all"] as const,
};

export function usePromptTemplates(analysisType?: string) {
  return useQuery({
    queryKey: promptKeys.list(analysisType),
    queryFn: () => fetchPromptTemplates(analysisType),
  });
}

export function useCreatePromptTemplate() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: PromptTemplateCreateData) => createPromptTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
      toast.success("模板已创建");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "创建模板失败"));
    },
  });
}

export function useUpdatePromptTemplate() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PromptTemplateUpdateData }) =>
      updatePromptTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
      toast.success("模板已更新");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "更新模板失败"));
    },
  });
}

export function useDeletePromptTemplate() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => deletePromptTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
      toast.success("模板已删除");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "删除模板失败"));
    },
  });
}

export function useSetDefaultPromptTemplate() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: number) => setDefaultPromptTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
      toast.success("已设为默认模板");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "设置默认模板失败"));
    },
  });
}
