/** Paper Chat 类型定义 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  question: string;
  history?: ChatMessage[];
  top_k?: number;
}

export interface SourceRef {
  chunk_index: number;
  text: string;
  score: number;
}

export interface ChatResponse {
  answer: string;
  sources: SourceRef[];
}
