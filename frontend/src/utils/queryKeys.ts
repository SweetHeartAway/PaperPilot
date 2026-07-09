/** 集中管理所有 React Query queryKey */
export const queryKeys = {
  papers: {
    all: ["papers"] as const,
    lists: () => ["papers", "list"] as const,
    list: (params: {
      page: number;
      pageSize: number;
      search?: string;
      favoriteOnly?: boolean;
      sortBy?: string;
      sortOrder?: string;
      tagIds?: number[];
    }) => ["papers", "list", params] as const,
    details: () => ["papers", "detail"] as const,
    detail: (id: number) => ["papers", "detail", id] as const,
    aiSummaries: () => ["papers", "ai-summary"] as const,
    aiSummary: (paperId: number, analysisType: string, version?: number) =>
      version !== undefined
        ? (["papers", "ai-summary", paperId, analysisType, version] as const)
        : (["papers", "ai-summary", paperId, analysisType] as const),
    aiSummaryVersions: (paperId: number) => ["papers", "ai-summary", "versions", paperId] as const,
    aiSummaryDiff: (paperId: number, v1: number | null, v2: number | null) =>
      ["papers", "ai-summary", "diff", paperId, v1, v2] as const,
  },
  tags: {
    all: ["tags"] as const,
  },
  user: {
    me: ["user", "me"] as const,
  },
  stats: {
    all: ["stats"] as const,
  },
};
