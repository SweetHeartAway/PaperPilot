import client from "./client";
import type { ChatRequest, ChatResponse } from "../types/chat";

/** 向论文提问（RAG 问答） */
export function askPaperQuestion(paperId: number, data: ChatRequest): Promise<ChatResponse> {
  return client.post(`/api/v1/papers/${paperId}/chat`, data).then((res) => res.data);
}
