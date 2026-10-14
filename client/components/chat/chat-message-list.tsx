"use client";

import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { ChatMessage, Citation } from "@/types/chat";
import { ChatMessageItem } from "./chat-message-item";
import { ChatEmptyState } from "./chat-empty-state";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoadingHistory?: boolean;
  onSelectCitation: (citations: Citation[]) => void;
  onSelectPrompt: (prompt: string) => void;
  onRetry?: (messageId: string) => void;
}

export function ChatMessageList({
  messages,
  isLoadingHistory = false,
  onSelectCitation,
  onSelectPrompt,
  onRetry,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or streamed tokens
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoadingHistory && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-muted-foreground text-xs gap-2">
        <Loader2 className="size-5 animate-spin text-blue-500" />
        <span className="text-[11px]">Loading conversation history...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return <ChatEmptyState onSelectPrompt={onSelectPrompt} />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
      {messages.map((message) => (
        <ChatMessageItem
          key={message.id}
          message={message}
          onSelectCitation={onSelectCitation}
          onRetry={onRetry}
        />
      ))}
      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
