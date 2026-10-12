"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface DocumentSkeletonProps {
  count?: number;
}

export function DocumentSkeleton({ count = 3 }: DocumentSkeletonProps) {
  return (
    <div className="space-y-2 w-full" aria-label="Loading documents">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-3 rounded-lg border border-border bg-card/50 flex items-start gap-3"
        >
          {/* File Icon skeleton */}
          <Skeleton className="size-8 rounded-md shrink-0 bg-muted" />

          {/* Text and badges skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-3.5 w-4/5 rounded bg-muted" />
            <div className="flex items-center gap-2 pt-0.5">
              <Skeleton className="h-4 w-10 rounded-full bg-muted" />
              <Skeleton className="h-3 w-14 rounded bg-muted" />
              <Skeleton className="h-3 w-16 rounded ml-auto bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
