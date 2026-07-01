import { useMutation } from "@tanstack/react-query";
import {
  createPaper as createPaperApi,
  uploadPaperFile as uploadPaperFileApi,
} from "../api/papers";

/** 创建论文元数据 Mutation */
export function useCreatePaper() {
  return useMutation({
    mutationFn: (data: { title: string; abstract?: string; authors?: string; doi?: string }) =>
      createPaperApi(data),
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
