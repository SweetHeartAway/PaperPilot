import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addPaperTag, removePaperTag } from "../api/papers";

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
