"use client";

import React from "react";
import { useChat } from "./use-chat";
import { ChatHeader } from "./chat-header";
import { ChatMessageList } from "./chat-message-list";
import { ChatInput } from "./chat-input";
import { CitationInspector } from "./citation-inspector";

interface ChatAreaProps {
  className?: string;
}

export function ChatArea({ className }: ChatAreaProps) {
  const {
    messages,
    input,
    setInput,
    isStreaming,
    isLoadingHistory,
    activeCitation,
    isCitationOpen,
    sendMessage,
    stopStreaming,
    retryMessage,
    clearChat,
    selectCitation,
    closeCitation,
  } = useChat();

  return (
    <div className={`flex-1 flex flex-col min-w-0 h-full bg-background relative ${className || ""}`}>
      {/* 1. Chat Header */}
      <ChatHeader
        messageCount={messages.length}
        onClearChat={clearChat}
        isStreaming={isStreaming}
      />

      {/* 2. Message History & Streaming Display */}
      <ChatMessageList
        messages={messages}
        isLoadingHistory={isLoadingHistory}
        onSelectCitation={selectCitation}
        onSelectPrompt={(prompt) => sendMessage(prompt)}
        onRetry={retryMessage}
      />

      {/* 3. Input Form Area */}
      <ChatInput
        input={input}
        setInput={setInput}
        isStreaming={isStreaming}
        onSend={() => sendMessage()}
        onStop={stopStreaming}
      />

      {/* 4. Slide-out Citation Inspector Drawer */}
      <CitationInspector
        citation={activeCitation}
        isOpen={isCitationOpen}
        onClose={closeCitation}
      />
    </div>
  );
}
