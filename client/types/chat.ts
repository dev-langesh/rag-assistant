export interface Citation {
  id: string;
  document_id: string;
  filename: string;
  content: string;
  score: number;
  initial_rrf_score?: number;
  metadata?: Record<string, any>;
}

export interface ChatMessageContext {
  role: "user" | "assistant";
  content: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
  error?: string;
  timestamp: Date;
}

export interface ChatStreamTokenPayload {
  token: string;
  text?: string;
}

export interface ChatStreamErrorPayload {
  error: string;
}

export interface ChatStreamDonePayload {
  status: "completed" | "error";
}
