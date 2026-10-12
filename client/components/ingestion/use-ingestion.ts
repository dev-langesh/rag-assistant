"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { documentApi } from "@/lib/api/documents";
import { DocumentItem } from "@/types/document";
import { BackendStatus, UploadProgressInfo } from "./types";

const INITIAL_UPLOAD_STATE: UploadProgressInfo = {
  isUploading: false,
  progress: 0,
  fileName: null,
  statusText: "",
};

export function useIngestion() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [uploadState, setUploadState] = useState<UploadProgressInfo>(INITIAL_UPLOAD_STATE);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Check health and initial document fetch
  const fetchDocuments = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      const data = await documentApi.getAll();
      setDocuments(data.documents || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load documents";
      console.error("Failed to load documents:", err);
      if (isRefresh) {
        toast.error(`Error loading documents: ${message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      await documentApi.checkHealth();
      setBackendStatus("online");
    } catch {
      setBackendStatus("offline");
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!mounted) return;
      await Promise.all([checkHealth(), fetchDocuments()]);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [checkHealth, fetchDocuments]);

  // Upload handler with progress tracking and toaster alerts
  const handleUpload = useCallback(
    async (file: File): Promise<boolean> => {
      // Basic client-side validation
      const validExtensions = [".pdf", ".txt", ".md", ".markdown"];
      const hasValidExt = validExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (!hasValidExt) {
        toast.error("Unsupported file type", {
          description: `Allowed formats: PDF, TXT, MD. Got: ${file.name}`,
        });
        return false;
      }

      // Max size check (e.g. 30MB)
      const maxSizeMB = 30;
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error("File is too large", {
          description: `Maximum file size is ${maxSizeMB}MB.`,
        });
        return false;
      }

      setUploadState({
        isUploading: true,
        progress: 10,
        fileName: file.name,
        statusText: "Uploading file to server...",
      });

      const toastId = toast.loading(`Uploading ${file.name}...`, {
        description: "Preparing file ingestion and vector embeddings",
      });

      try {
        setUploadState((prev) => ({
          ...prev,
          progress: 30,
          statusText: "Extracting text & computing vector embeddings...",
        }));

        const result = await documentApi.upload(file, (percent) => {
          setUploadState((prev) => ({
            ...prev,
            progress: Math.min(percent, 90),
            statusText:
              percent >= 90
                ? "Processing chunks and generating embeddings..."
                : `Uploading: ${percent}%`,
          }));
        });

        setUploadState((prev) => ({
          ...prev,
          progress: 100,
          statusText: "Completed!",
        }));

        toast.success("Document ingested successfully", {
          id: toastId,
          description: `Created ${result.chunks_created} semantic chunks from "${file.name}".`,
        });

        // Refresh documents list
        await fetchDocuments(true);
        return true;
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : "Document ingestion failed";

        toast.error("Ingestion failed", {
          id: toastId,
          description: errorMsg,
        });

        return false;
      } finally {
        setUploadState(INITIAL_UPLOAD_STATE);
      }
    },
    [fetchDocuments]
  );

  // Delete handler with confirmation feedback
  const handleDelete = useCallback(
    async (documentId: string, filename: string): Promise<boolean> => {
      setDeletingId(documentId);
      const toastId = toast.loading(`Deleting "${filename}"...`);

      try {
        await documentApi.delete(documentId);

        // Optimistically remove from state
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));

        toast.success("Document deleted", {
          id: toastId,
          description: `Removed "${filename}" and its vector chunks from the database.`,
        });

        return true;
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to delete document";

        toast.error("Deletion failed", {
          id: toastId,
          description: errorMsg,
        });

        return false;
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  const totalChunks = useMemo(
    () => documents.reduce((acc, doc) => acc + (doc.chunk_count || 0), 0),
    [documents]
  );

  return {
    documents,
    isLoading,
    backendStatus,
    uploadState,
    deletingId,
    totalChunks,
    refreshDocuments: () => fetchDocuments(true),
    checkHealth,
    handleUpload,
    handleDelete,
  };
}
