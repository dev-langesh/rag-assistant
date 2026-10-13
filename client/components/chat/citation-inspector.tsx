"use client";

import React from "react";
import { BookOpen, FileText, Hash, Percent, Layers, Copy, Check } from "lucide-react";
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

interface CitationInspectorProps {
  citation: Citation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CitationInspector({
  citation,
  isOpen,
  onClose,
}: CitationInspectorProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyPassage = () => {
    if (!citation?.content) return;
    navigator.clipboard.writeText(citation.content);
    setCopied(true);
    toast.success("Passage copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col h-full bg-card/95 border-l border-border backdrop-blur-md"
      >
        <SheetHeader className="p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2 text-blue-500">
            <BookOpen className="size-4" />
            <SheetTitle className="text-sm font-semibold tracking-tight">
              Source Citation Inspector
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Strictly grounded passage retrieved from the vector knowledge base
          </SheetDescription>
        </SheetHeader>

        {citation ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Metadata Card */}
            <div className="rounded-lg border border-border bg-background/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FileText className="size-3.5 text-blue-500" />
                  Document:
                </span>
                <span className="font-medium text-foreground truncate max-w-[200px]" title={citation.filename}>
                  {citation.filename}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Hash className="size-3.5 text-zinc-400" />
                  Chunk ID:
                </span>
                <span className="font-mono text-[11px] text-zinc-300 bg-muted px-1.5 py-0.5 rounded">
                  {citation.id.slice(0, 12)}...
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Percent className="size-3.5 text-emerald-500" />
                  Re-rank Relevance:
                </span>
                <Badge variant="outline" className="font-mono text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                  {citation.score.toFixed(4)}
                </Badge>
              </div>

              {citation.initial_rrf_score !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Layers className="size-3.5 text-blue-400" />
                    Initial RRF Score:
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {citation.initial_rrf_score.toFixed(5)}
                  </span>
                </div>
              )}
            </div>

            {/* Grounded Passage Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Grounded Passage Text
                </h4>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleCopyPassage}
                  className="h-6 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-background p-3.5 text-foreground/90 text-xs leading-relaxed font-sans whitespace-pre-wrap selection:bg-blue-600/30">
                {citation.content}
              </div>
            </div>

            {/* Extra Metadata if present */}
            {citation.metadata && Object.keys(citation.metadata).length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Ingestion Metadata
                </h4>
                <div className="rounded-lg border border-border bg-muted/30 p-2.5 font-mono text-[10px] space-y-1">
                  {Object.entries(citation.metadata).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-muted-foreground">
                      <span className="text-zinc-400">{key}:</span>
                      <span className="text-foreground truncate max-w-[200px]">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-muted-foreground">
            Select a citation pill in any message to inspect its grounded database chunk.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
