"use client";

import React from "react";
import { BookOpen } from "lucide-react";
import { Citation } from "@/types/chat";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CitationPillsProps {
  citations: Citation[];
  onSelectCitation: (citation: Citation) => void;
}

export function CitationPills({
  citations,
  onSelectCitation,
}: CitationPillsProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50">
      <span className="text-[11px] font-medium text-muted-foreground mr-1 flex items-center gap-1">
        <BookOpen className="size-3 text-blue-500" />
        Sources:
      </span>

      {citations.map((c, idx) => (
        <Tooltip key={c.id || idx}>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() => onSelectCitation(c)}
                className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono bg-secondary/80 border border-border hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400 transition-colors cursor-pointer text-foreground"
              />
            }
          >
            <span className="text-blue-500 group-hover:text-blue-400 font-semibold">
              [{idx + 1}]
            </span>
            <span className="max-w-[120px] truncate text-muted-foreground group-hover:text-foreground">
              {c.filename}
            </span>
            <span className="text-[10px] text-zinc-500 font-sans">
              ({c.score.toFixed(2)})
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="font-semibold text-xs">{c.filename}</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              Re-ranking score: {c.score.toFixed(4)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 max-w-xs line-clamp-2">
              {c.content.slice(0, 100)}...
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
