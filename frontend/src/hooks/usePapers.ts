import { useQuery } from "@tanstack/react-query";
import { getPaperList, type PaperListQuery } from "../services/paperService";
import { fetchPaper } from "../api/papers";
import type { Paper } from "../types/paper";

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
