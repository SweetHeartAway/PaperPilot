import { useQuery } from "@tanstack/react-query";
import { fetchPaperStats } from "../api/papers";
import { queryKeys } from "../utils/queryKeys";
import type { PaperStats } from "../types/paper";

export function usePaperStats() {
  return useQuery<PaperStats>({
    queryKey: queryKeys.stats.all,
    queryFn: fetchPaperStats,
    staleTime: 30_000,
  });
}
