"use client";

import React from "react";
import {
  FileText,
  FileCode,
  File,
  Calendar,
  Layers,
} from "lucide-react";
import { DocumentItem as DocumentItemType } from "@/types/document";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteDocumentDialog } from "./delete-document-dialog";

interface DocumentItemProps {
  document: DocumentItemType;
  onDelete: (id: string, filename: string) => Promise<boolean>;
  isDeleting: boolean;
}

function getFileIcon(fileType: string) {
  const type = fileType.toLowerCase();
  if (type === "pdf") {
    return <FileText className="size-4 text-rose-500" />;
  }
  if (type === "md" || type === "markdown") {
    return <FileCode className="size-4 text-blue-500" />;
  }
  return <File className="size-4 text-zinc-400" />;
}

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function DocumentItem({
  document,
  onDelete,
  isDeleting,
}: DocumentItemProps) {
  return (
    <div className="group relative rounded-lg border border-border bg-card/60 p-3 hover:bg-muted/40 hover:border-border transition-all">
      <div className="flex items-start gap-2.5">
        {/* File Type Icon */}
        <div className="mt-0.5 size-7 rounded-md bg-secondary flex items-center justify-center shrink-0 border border-border/50">
          {getFileIcon(document.file_type)}
        </div>

        {/* File Metadata */}
        <div className="flex-1 min-w-0 pr-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="text-xs font-medium text-foreground truncate cursor-default block" />
              }
            >
              {document.filename}
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="font-medium">{document.filename}</p>
              <p className="text-[10px] text-muted-foreground">
                Uploaded: {formatDate(document.created_at)}
              </p>
            </TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 uppercase font-mono tracking-wider font-semibold"
            >
              {document.file_type}
            </Badge>

            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
              <Layers className="size-3" />
              {document.chunk_count} chunks
            </span>

            <span className="text-[10px] text-muted-foreground ml-auto hidden sm:inline-flex items-center gap-1">
              <Calendar className="size-2.5" />
              {formatDate(document.created_at)}
            </span>
          </div>
        </div>

        {/* Extracted Delete Confirmation Dialog Component */}
        <DeleteDocumentDialog
          document={document}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
