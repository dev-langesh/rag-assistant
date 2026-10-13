"use client";

import React from "react";
import { Sparkles, Trash2, Cpu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatHeaderProps {
  messageCount: number;
  onClearChat: () => void;
  isStreaming: boolean;
}

export function ChatHeader({
  messageCount,
  onClearChat,
  isStreaming,
}: ChatHeaderProps) {
  return (
    <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-card/40 backdrop-blur-md z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            RAG Assistant
          </h2>
        </div>

        <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-blue-500/30 text-blue-400 bg-blue-500/5">
          gemini-3.5-flash
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Cpu className="size-3.5 text-blue-500" />
            FlashRank
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            Strict Grounding
          </span>
        </div>

        {messageCount > 0 && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onClearChat}
                  disabled={isStreaming}
                  className="size-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                />
              }
            >
              <Trash2 className="size-3.5" />
              <span className="sr-only">Clear conversation</span>
            </TooltipTrigger>
            <TooltipContent side="bottom">Reset chat history</TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  );
}
