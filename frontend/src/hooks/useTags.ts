import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addPaperTag, removePaperTag } from "../api/papers";
import { useToast } from "./useToast";
import { queryKeys } from "../utils/queryKeys";
import { getErrorMessage } from "../utils/error";

export function useAddPaperTag(paperId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (name: string) => addPaperTag(paperId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.detail(paperId) });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "添加标签失败"));
    },
  });
}

export function useRemovePaperTag(paperId: number) {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (tagId: number) => removePaperTag(paperId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.detail(paperId) });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "移除标签失败"));
    },
  });
}
