"use client";

import React from "react";
import { IngestionSidebar } from "@/components/ingestion";
import { Database, FileText, ArrowLeft, Cpu } from "lucide-react";

export default function Home() {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* 1. Left Sidebar: Modular Ingestion Pipeline */}
      <IngestionSidebar />

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/50 relative">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-border px-6 flex items-center justify-between bg-card/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Workspace</span>
            <span>/</span>
            <span>Document Knowledge Base</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-border bg-muted text-muted-foreground">
              pgvector 17 • ONNX FastEmbed
            </span>
          </div>
        </header>

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto space-y-4">
          
        </div>
      </main>
    </div>
  );
}
