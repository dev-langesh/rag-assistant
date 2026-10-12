"use client";

import { FileText } from "lucide-react";

export function DocumentEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center bg-card/20 flex flex-col items-center justify-center space-y-2.5">
      <div className="size-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
        <FileText className="size-4.5" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-foreground">No documents indexed yet</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[220px]">
          Upload a document to parse semantic chunks and build the vector knowledge base.
        </p>
      </div>
    </div>
  );
}
