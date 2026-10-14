"use client";

import React from "react";
import { Sparkles, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const SAMPLE_PROMPTS = [
  "What is the main topic covered in the uploaded documents?",
  "What are the core operational guidelines and workflows?",
  "List the key definitions and technical requirements mentioned.",
];

export function ChatEmptyState({ onSelectPrompt }: ChatEmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-6">
      <div className="size-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-xs">
        <Sparkles className="size-6" />
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground tracking-tight">
          Grounded RAG Assistant
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
          Ask questions about your uploaded knowledge base. Responses are retrieved using
          Hybrid RRF (Dense + Full-Text) and re-ranked with FlashRank TinyBERT.
        </p>
      </div>

      {/* Suggested Prompts */}
      <div className="w-full space-y-2 pt-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground text-left px-1">
          Suggested Queries
        </p>
        <div className="space-y-1.5">
          {SAMPLE_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(prompt)}
              className="w-full text-left text-xs p-3 rounded-lg border border-border bg-card/60 hover:bg-muted hover:border-blue-500/40 transition-all flex items-center justify-between group cursor-pointer text-foreground/90"
            >
              <span className="truncate pr-2">{prompt}</span>
              <ArrowRight className="size-3 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* System tags */}
      {/* <div className="pt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          Zero Hallucination Grounding
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Cpu className="size-3.5 text-blue-500" />
          Token-by-Token SSE
        </span>
      </div> */}
    </div>
  );
}
