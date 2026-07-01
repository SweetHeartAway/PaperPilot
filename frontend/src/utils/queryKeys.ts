/** 集中管理所有 React Query queryKey */
export const queryKeys = {
  papers: {
    all: ["papers"] as const,
    lists: () => ["papers", "list"] as const,
    list: (params: { page: number; pageSize: number; search?: string }) =>
      ["papers", "list", params] as const,
    details: () => ["papers", "detail"] as const,
    detail: (id: number) => ["papers", "detail", id] as const,
    aiSummaries: () => ["papers", "ai-summary"] as const,
    aiSummary: (paperId: number, analysisType: string, version?: number) =>
      version !== undefined
        ? (["papers", "ai-summary", paperId, analysisType, version] as const)
        : (["papers", "ai-summary", paperId, analysisType] as const),
  },
  tags: {
    all: ["tags"] as const,
  },
  user: {
    me: ["user", "me"] as const,
  },
};
