import { useMutation } from "@tanstack/react-query";
import { askPaperQuestion } from "../api/chat";
import type { ChatRequest, ChatResponse } from "../types/chat";

/** 论文 RAG 问答 mutation hook */
export function usePaperChat(paperId: number) {
  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: (data: ChatRequest) => askPaperQuestion(paperId, data),
  });
}
