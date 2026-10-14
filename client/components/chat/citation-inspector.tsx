"use client";

import React from "react";
import {
  BookOpen,
  FileText,
  Hash,
  Percent,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import { Citation } from "@/types/chat";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatChunkContent } from "@/lib/citations";

interface CitationInspectorProps {
  citations: Citation[] | Citation | null;
  isOpen: boolean;
  onClose: () => void;
}

function ChunkCard({
  citation,
  index,
  total,
}: {
  citation: Citation;
  index: number;
  total: number;
}) {
  const [copied, setCopied] = React.useState(false);

  const formattedPassage = React.useMemo(() => {
    return formatChunkContent(citation.content);
  }, [citation.content]);

  const handleCopyPassage = () => {
    if (!citation.content) return;
    navigator.clipboard.writeText(formattedPassage);
    setCopied(true);
    toast.success("Passage copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden shadow-xs space-y-3 p-4">
      {/* Chunk Header / Index */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          {total > 1 && (
            <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              #{index + 1} of {total}
            </span>
          )}
          <span
            className="font-medium text-xs text-foreground truncate max-w-[220px]"
            title={citation.filename}
          >
            {citation.filename}
          </span>
        </div>

        {/* <Badge variant="outline" className="font-mono text-[11px] text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
          <Percent className="size-3 mr-1 text-emerald-500" />
          {citation.score.toFixed(4)}
        </Badge> */}
      </div>

      {/* Metadata Row */}
      {/* <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Hash className="size-3 text-zinc-400" />
          <span>Chunk:</span>
          <span className="font-mono text-zinc-300 bg-muted/60 px-1 py-0.5 rounded text-[10px]">
            {citation.id.slice(0, 8)}...
          </span>
        </div>

        {citation.initial_rrf_score !== undefined && (
          <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
            <Layers className="size-3 text-blue-400" />
            <span>RRF:</span>
            <span className="font-mono text-zinc-300 text-[10px]">
              {citation.initial_rrf_score.toFixed(4)}
            </span>
          </div>
        )}
      </div> */}

      {/* Grounded Passage Content */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1">
            <FileText className="size-3 text-blue-500" />
            Grounded Passage Text
          </h4>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleCopyPassage}
            className="h-6 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-background p-3.5 text-foreground/90 text-xs leading-relaxed font-sans whitespace-pre-wrap selection:bg-blue-600/30">
          {formattedPassage}
        </div>
      </div>

      {/* Ingestion Metadata if present */}
      {/* {citation.metadata && Object.keys(citation.metadata).length > 0 && (
        <div className="pt-1">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-2 font-mono text-[10px] space-y-1">
            {Object.entries(citation.metadata).map(([key, val]) => (
              <div key={key} className="flex justify-between text-muted-foreground">
                <span className="text-zinc-400">{key}:</span>
                <span className="text-foreground truncate max-w-[200px]">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
}

export function CitationInspector({
  citations,
  isOpen,
  onClose,
}: CitationInspectorProps) {
  // Normalize citations prop to array
  const citationsList = React.useMemo(() => {
    if (!citations) return [];
    return Array.isArray(citations) ? citations : [citations];
  }, [citations]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col h-full bg-card/95 border-l border-border backdrop-blur-md"
      >
        <SheetHeader className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-blue-500">
              <BookOpen className="size-4" />
              <SheetTitle className="text-sm font-semibold tracking-tight">
                Source Citation Inspector
              </SheetTitle>
            </div>
            {citationsList.length > 0 && (
              <Badge variant="secondary" className="font-mono text-[11px]">
                {citationsList.length}{" "}
                {citationsList.length === 1 ? "Source" : "Sources"}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {citationsList.length > 0 ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {citationsList.map((c, idx) => (
              <ChunkCard
                key={c.id || idx}
                citation={c}
                index={idx}
                total={citationsList.length}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-muted-foreground">
            Select a citation badge in any message to inspect its grounded
            database chunks.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
