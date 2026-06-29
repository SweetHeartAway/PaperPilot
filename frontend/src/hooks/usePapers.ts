import { useQuery } from "@tanstack/react-query";
import { fetchPapers, fetchPaper } from "../api/papers";
import type { Paper, PaperListParams } from "../types/paper";

export function usePapers(params?: PaperListParams) {
  return useQuery<Paper[]>({
    queryKey: ["papers", params],
    queryFn: () => fetchPapers(params),
  });
}

export function usePaper(id: number) {
  return useQuery<Paper>({
    queryKey: ["paper", id],
    queryFn: () => fetchPaper(id),
    enabled: id > 0,
  });
}
