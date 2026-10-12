import { DocumentItem } from "@/types/document";

export type BackendStatus = "online" | "offline" | "checking";

export interface UploadProgressInfo {
  isUploading: boolean;
  progress: number;
  fileName: string | null;
  statusText: string;
}

export interface IngestionState {
  documents: DocumentItem[];
  isLoading: boolean;
  uploadState: UploadProgressInfo;
  deletingId: string | null;
  backendStatus: BackendStatus;
  totalChunks: number;
}
