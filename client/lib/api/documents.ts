import { apiClient } from "@/lib/axios";
import {
  DocumentItem,
  DocumentListResponse,
  DocumentUploadResponse,
} from "@/types/document";

export const documentApi = {
  /**
   * Fetches the list of all ingested documents.
   */
  async getAll(): Promise<DocumentListResponse> {
    const response = await apiClient.get<DocumentListResponse>("/documents");
    return response.data;
  },

  /**
   * Uploads and indexes a document with upload progress tracking.
   */
  async upload(
    file: File,
    onUploadProgress?: (progressPercent: number) => void
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<DocumentUploadResponse>(
      "/documents/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onUploadProgress) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onUploadProgress(percent);
          }
        },
      }
    );
    return response.data;
  },

  /**
   * Deletes a document by ID, cascading chunk deletions.
   */
  async delete(documentId: string): Promise<void> {
    await apiClient.delete(`/documents/${documentId}`);
  },

  /**
   * Checks backend server health.
   */
  async checkHealth(): Promise<{ status: string; database?: string }> {
    const baseUrl = apiClient.defaults.baseURL || "";
    const rootUrl = baseUrl.replace("/api/v1", "");
    const response = await apiClient.get<{ status: string; database?: string }>(
      `${rootUrl}/health`
    );
    return response.data;
  },
};
