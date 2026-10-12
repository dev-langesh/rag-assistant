export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  created_at: string;
  chunk_count: number;
}

export interface DocumentListResponse {
  documents: DocumentItem[];
  total: number;
}

export interface DocumentUploadResponse {
  status: string;
  document_id: string;
  filename: string;
  file_type: string;
  chunks_created: number;
  message: string;
}
