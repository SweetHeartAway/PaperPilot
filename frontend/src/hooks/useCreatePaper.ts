import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPaper as createPaperApi,
  uploadPaperFile as uploadPaperFileApi,
} from "../api/papers";
import { queryKeys } from "../utils/queryKeys";

/** 创建论文元数据 Mutation — 成功后自动失效论文列表缓存 */
export function useCreatePaper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; abstract?: string; authors?: string; doi?: string }) =>
      createPaperApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.lists() });
    },
  });
}

/** 上传论文文件 Mutation */
export function useUploadPaperFile() {
  return useMutation({
    mutationFn: ({
      paperId,
      file,
      onProgress,
    }: {
      paperId: number;
      file: File;
      onProgress?: (percent: number) => void;
    }) => uploadPaperFileApi(paperId, file, onProgress),
  });
}
