import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTags, updateTag, deleteTag } from "../services/tagService";
import { queryKeys } from "../utils/queryKeys";

export function useAllTags() {
  return useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: fetchTags,
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateTag(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
  });
}
