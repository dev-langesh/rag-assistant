"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { DocumentItem as DocumentItemType } from "@/types/document";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DocumentSkeleton } from "./document-skeleton";
import { DocumentEmptyState } from "./document-empty-state";
import { DocumentItem } from "./document-item";

interface DocumentListProps {
  documents: DocumentItemType[];
  isLoading: boolean;
  deletingId: string | null;
  totalChunks: number;
  onDelete: (id: string, filename: string) => Promise<boolean>;
  onRefresh: () => Promise<void>;
}

export function DocumentList({
  documents,
  isLoading,
  deletingId,
  totalChunks,
  onDelete,
  onRefresh,
}: DocumentListProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2.5 pt-1 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Indexed Documents
          </span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 font-mono font-medium"
          >
            {documents.length}
          </Badge>
        </div>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onRefresh}
                disabled={isLoading}
                className="size-6 text-muted-foreground hover:text-foreground"
              />
            }
          >
            <RefreshCw
              className={`size-3 ${isLoading ? "animate-spin text-blue-500" : ""}`}
            />
            <span className="sr-only">Refresh documents</span>
          </TooltipTrigger>
          <TooltipContent side="top">Refresh document list</TooltipContent>
        </Tooltip>
      </div>

      {/* List / Skeleton / Empty state */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
        {isLoading ? (
          <DocumentSkeleton count={3} />
        ) : documents.length === 0 ? (
          <DocumentEmptyState />
        ) : (
          documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              document={doc}
              onDelete={onDelete}
              isDeleting={deletingId === doc.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
