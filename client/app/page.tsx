"use client";

import React from "react";
import { IngestionSidebar } from "@/components/ingestion";
import { ChatArea } from "@/components/chat";

export default function Home() {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* 1. Left Sidebar: Document Ingestion Pipeline */}
      <IngestionSidebar />

      {/* 2. Main Content: Real-time Streaming RAG Chat with Error Handling & Citations */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <ChatArea />
      </main>
    </div>
  );
}
