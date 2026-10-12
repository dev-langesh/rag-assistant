"use client";

import React from "react";
import { Database, Layers, ShieldCheck, Activity } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIngestion } from "./use-ingestion";
import { DocumentUploadZone } from "./document-upload-zone";
import { DocumentList } from "./document-list";

interface IngestionSidebarProps {
  className?: string;
}

export function IngestionSidebar({ className }: IngestionSidebarProps) {
  const {
    documents,
    isLoading,
    backendStatus,
    uploadState,
    deletingId,
    totalChunks,
    refreshDocuments,
    handleUpload,
    handleDelete,
  } = useIngestion();

  return (
    <aside
      className={cn(
        "w-80 md:w-88 flex flex-col h-full border-r border-border bg-card/40 shrink-0 select-none",
        className
      )}
    >
      {/* 1. Header & Backend Connection Status */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Database className="size-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              Knowledge Base
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium">
              Vector Ingestion Pipeline
            </p>
          </div>
        </div>

        {/* Backend Status indicator */}
        <div
          className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1.5 border transition-colors",
            backendStatus === "online" &&
              "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            backendStatus === "offline" &&
              "bg-rose-500/10 text-rose-500 border-rose-500/20",
            backendStatus === "checking" &&
              "bg-amber-500/10 text-amber-500 border-amber-500/20"
          )}
          title={
            backendStatus === "online"
              ? "FastAPI & PostgreSQL Connected"
              : backendStatus === "offline"
              ? "Backend API Unreachable"
              : "Checking Backend Status..."
          }
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              backendStatus === "online" && "bg-emerald-500 animate-pulse",
              backendStatus === "offline" && "bg-rose-500",
              backendStatus === "checking" && "bg-amber-500 animate-ping"
            )}
          />
          <span className="capitalize">{backendStatus}</span>
        </div>
      </div>

      {/* 2. Document Upload Area */}
      <div className="p-4 pb-3">
        <DocumentUploadZone
          uploadState={uploadState}
          onUpload={handleUpload}
          disabled={backendStatus === "offline"}
        />
      </div>

      <div className="px-4">
        <Separator />
      </div>

      {/* 3. Document List Section */}
      <div className="flex-1 min-h-0 px-4 py-3 flex flex-col">
        <DocumentList
          documents={documents}
          isLoading={isLoading}
          deletingId={deletingId}
          totalChunks={totalChunks}
          onDelete={handleDelete}
          onRefresh={refreshDocuments}
        />
      </div>

      {/* 4. Footer System Info */}
      <div className="p-3 border-t border-border bg-card/60 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Layers className="size-3.5 text-blue-500" />
          <span>{totalChunks} Chunks</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span>FastEmbed 768d</span>
          <span>•</span>
          <span>HNSW</span>
        </div>
      </div>
    </aside>
  );
}
