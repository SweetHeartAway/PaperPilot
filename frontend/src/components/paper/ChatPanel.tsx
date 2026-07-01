import { useState, useRef, useEffect } from "react";
import type { ChatMessage as ChatMessageType } from "../../types/chat";
import { usePaperChat } from "../../hooks/usePaperChat";
import Spinner from "../ui/Spinner";
import { getErrorMessage } from "../../utils/error";

// ─── Props ───

export interface ChatPanelProps {
  paperId: number;
  /** 是否有 PDF/可索引内容（无内容时给出提示） */
  hasContent?: boolean;
}

// ─── Icons ───

const SendIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
    />
  </svg>
);

const ChatBubbleIcon = () => (
  <svg
    className="h-5 w-5 text-blue-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
    />
  </svg>
);

const UserIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
);

// ─── Component ───

export default function ChatPanel({ paperId, hasContent = true }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const chatMutation = usePaperChat(paperId);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, chatMutation.isPending]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSubmit = () => {
    const q = input.trim();
    if (!q || chatMutation.isPending) return;

    const userMsg: ChatMessageType = { role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    chatMutation.mutate(
      {
        question: q,
        history: messages.length > 0 ? messages.slice(-10) : undefined,
        top_k: 5,
      },
      {
        onSuccess: (res) => {
          const assistantMsg: ChatMessageType = {
            role: "assistant",
            content: res.answer,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        },
        onError: () => {
          // Error is handled via the mutation state
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClear = () => {
    setMessages([]);
  };

  // ─── Render ───

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        <span className="flex items-center gap-2">
          <ChatBubbleIcon />
          论文对话
        </span>
        <span className="flex items-center gap-2">
          {messages.length > 0 && (
            <span className="text-xs text-gray-400">{messages.length} 条消息</span>
          )}
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>

      {/* Chat body */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-gray-100">
          {/* Messages */}
          <div ref={listRef} className="flex h-[400px] flex-col gap-3 overflow-y-auto px-5 py-4">
            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-3 rounded-full bg-blue-50 p-3">
                  <ChatBubbleIcon />
                </div>
                <p className="text-sm font-medium text-gray-700">关于这篇论文，想问什么？</p>
                <p className="mt-1 text-xs text-gray-400">
                  {hasContent
                    ? "AI 会基于论文内容检索相关片段来回答"
                    : "上传 PDF 文件后可获得更准确的回答"}
                </p>
              </div>
            )}

            {/* Messages list */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {msg.role === "assistant" && (
                      <span className="mt-0.5 flex-shrink-0">
                        <ChatBubbleIcon />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                    {msg.role === "user" && (
                      <span className="mt-0.5 flex-shrink-0">
                        <UserIcon />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* AI typing indicator */}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-3">
                  <Spinner size="sm" variant="blue" />
                  <span className="text-sm text-gray-500">思考中...</span>
                </div>
              </div>
            )}

            {/* Error state */}
            {chatMutation.isError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs text-red-600">
                  {getErrorMessage(chatMutation.error, "回答生成失败")}
                </p>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入关于论文的问题..."
                disabled={chatMutation.isPending}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-150 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim() || chatMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-blue-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                aria-label="发送"
              >
                <SendIcon />
              </button>
            </div>
            {messages.length > 0 && (
              <div className="mt-2 flex justify-between">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-gray-400 transition-colors hover:text-gray-600"
                >
                  清空对话
                </button>
                <span className="text-[11px] text-gray-300">Enter 发送，回答基于论文内容生成</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
