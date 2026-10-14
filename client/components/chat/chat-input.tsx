"use client";

import React, { useRef, useEffect, KeyboardEvent } from "react";
import { ArrowUp, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isStreaming: boolean;
  onSend: () => void;
  onStop: () => void;
}

export function ChatInput({
  input,
  setInput,
  isStreaming,
  onSend,
  onStop,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="p-4 border-t border-border bg-card/40 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isStreaming && input.trim()) {
              onSend();
            }
          }}
          className="relative flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-xs"
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your ingested knowledge base..."
            rows={1}
            className="flex-1 resize-none border-0 bg-transparent p-1.5 text-sm shadow-none focus-visible:ring-0 min-h-[44px] max-h-36 placeholder:text-muted-foreground/70"
          />

          <div className="flex items-center gap-1.5 pb-0.5">
            {isStreaming ? (
              <Button
                type="button"
                size="icon-sm"
                variant="destructive"
                onClick={onStop}
                title="Stop generating"
                className="size-8 rounded-lg shrink-0"
              >
                <Square className="size-3.5 fill-current" />
                <span className="sr-only">Stop generating</span>
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon-sm"
                disabled={!input.trim()}
                title="Send message"
                className="size-8 rounded-lg shrink-0 bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40"
              >
                <ArrowUp className="size-4" />
                <span className="sr-only">Send message</span>
              </Button>
            )}
          </div>
        </form>

        {/* <p className="text-center text-[11px] text-muted-foreground">
          Strict Grounding: Answers cite passages directly from PostgreSQL pgvector.
        </p> */}
      </div>
    </div>
  );
}
