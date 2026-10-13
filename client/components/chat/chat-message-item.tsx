"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Sparkles, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { ChatMessage, Citation } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CitationPills } from "./citation-pills";

interface ChatMessageItemProps {
  message: ChatMessage;
  onSelectCitation: (citation: Citation) => void;
  onRetry?: (messageId: string) => void;
}

export function ChatMessageItem({
  message,
  onSelectCitation,
  onRetry,
}: ChatMessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex flex-col w-full max-w-3xl mx-auto py-2",
        isUser ? "items-end" : "items-start"
      )}
    >
      {/* Sender Header */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5 px-1">
        {isUser ? (
          <>
            <span className="font-medium text-foreground">You</span>
            <User className="size-3.5 text-muted-foreground" />
          </>
        ) : (
          <>
            <Sparkles className="size-3.5 text-blue-500" />
            <span className="font-medium text-foreground">RAG Assistant</span>
            <span className="text-[10px] text-muted-foreground">• Strictly Grounded</span>
          </>
        )}
      </div>

      {/* Message Bubble Container */}
      <div
        className={cn(
          "rounded-xl px-4 py-3 text-sm leading-relaxed border transition-colors",
          isUser
            ? "bg-primary text-primary-foreground border-primary rounded-tr-none max-w-[85%]"
            : "bg-card/70 text-card-foreground border-border rounded-tl-none w-full shadow-xs"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="space-y-2">
            {/* Thinking / Searching placeholder if stream has started but no tokens arrived yet */}
            {message.isStreaming && !message.content && (
              <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-blue-500" />
                <span>Searching vector knowledge base & re-ranking...</span>
              </div>
            )}

            {/* Markdown Answer Content */}
            {message.content && (
              <div className="prose prose-invert max-w-none text-sm break-words leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>pre]:bg-muted/80 [&>pre]:p-3 [&>pre]:rounded-lg [&>pre]:text-xs [&>code]:bg-muted [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
                {message.isStreaming && (
                  <span className="inline-block size-1.5 bg-blue-500 rounded-full animate-pulse ml-1" />
                )}
              </div>
            )}

            {/* Error Banner & Retry Button */}
            {message.error && (
              <div className="mt-2 p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">Generation Failed</p>
                    <p className="text-[11px] text-destructive/80 leading-normal">
                      {message.error}
                    </p>
                  </div>
                </div>

                {onRetry && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => onRetry(message.id)}
                    className="shrink-0 h-7 border-destructive/30 hover:bg-destructive/20 text-destructive hover:text-destructive gap-1"
                  >
                    <RefreshCw className="size-3" />
                    Retry
                  </Button>
                )}
              </div>
            )}

            {/* Sources / Citations */}
            {message.citations && message.citations.length > 0 && (
              <CitationPills
                citations={message.citations}
                onSelectCitation={onSelectCitation}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
