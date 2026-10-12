"use client";

import React, { useRef, useState, DragEvent, ChangeEvent } from "react";
import { UploadCloud, Loader2, FileUp } from "lucide-react";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UploadProgressInfo } from "./types";

interface DocumentUploadZoneProps {
  uploadState: UploadProgressInfo;
  onUpload: (file: File) => Promise<boolean>;
  disabled?: boolean;
}

export function DocumentUploadZone({
  uploadState,
  onUpload,
  disabled = false,
}: DocumentUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || uploadState.isUploading) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || uploadState.isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      await onUpload(droppedFile);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      await onUpload(selectedFile);
      // Reset input value so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerBrowse = () => {
    if (disabled || uploadState.isUploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md,.markdown"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploadState.isUploading}
      />

      <div
        onClick={triggerBrowse}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled || uploadState.isUploading ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            triggerBrowse();
          }
        }}
        className={cn(
          "relative group rounded-xl border border-dashed transition-all duration-200 cursor-pointer select-none p-4 text-center",
          "bg-card/40 hover:bg-muted/40",
          isDragOver
            ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20"
            : "border-border hover:border-blue-500/50",
          (disabled || uploadState.isUploading) && "pointer-events-none opacity-80 cursor-not-allowed"
        )}
      >
        {uploadState.isUploading ? (
          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            <div className="size-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Loader2 className="size-4 animate-spin" />
            </div>
            <div className="w-full max-w-[240px] space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-foreground truncate max-w-[160px]">
                  {uploadState.fileName}
                </span>
                <span className="font-mono text-muted-foreground text-[11px]">
                  {uploadState.progress}%
                </span>
              </div>
              <div className="w-full">
                <Progress value={uploadState.progress} className="w-full h-1.5 bg-muted">
                  <ProgressTrack className="h-1.5 rounded-full bg-muted">
                    <ProgressIndicator
                      className="bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </ProgressTrack>
                </Progress>
              </div>
              <p className="text-[11px] text-muted-foreground pt-0.5">
                {uploadState.statusText}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1 space-y-2">
            <div className="size-9 rounded-lg bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground group-hover:text-blue-500 group-hover:border-blue-500/30 group-hover:bg-blue-500/5 transition-all">
              <UploadCloud className="size-4.5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-foreground group-hover:text-blue-500 transition-colors">
                Drop file to ingest or <span className="underline underline-offset-2">browse</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Supports PDF, TXT, MD (up to 30MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
