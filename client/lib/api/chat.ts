import { API_BASE_URL, apiClient } from "@/lib/axios";
import { Citation, ChatStreamTokenPayload, ChatStreamErrorPayload, ChatStreamDonePayload } from "@/types/chat";

export interface StreamChatParams {
  query: string;
  top_k?: number;
  signal?: AbortSignal;
  onCitations?: (citations: Citation[]) => void;
  onToken?: (token: string) => void;
  onError?: (error: string) => void;
  onDone?: (status: "completed" | "error") => void;
}

export interface SyncChatResponse {
  query: string;
  answer: string;
  citations: Citation[];
}

export const chatApi = {
  /**
   * Synchronous non-streaming chat request
   */
  async sendSync(query: string, top_k: number = 4): Promise<SyncChatResponse> {
    const response = await apiClient.post<SyncChatResponse>("/chat", {
      query,
      top_k,
    });
    return response.data;
  },

  /**
   * Server-Sent Events (SSE) streaming chat request
   */
  async stream({
    query,
    top_k = 10,
    signal,
    onCitations,
    onToken,
    onError,
    onDone,
  }: StreamChatParams): Promise<void> {
    const streamUrl = `${API_BASE_URL}/chat/stream`;

    let response: Response;
    try {
      response = await fetch(streamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ query, top_k }),
        signal,
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        onDone?.("completed");
        return;
      }
      const message = err instanceof Error ? err.message : "Network error connecting to chat service";
      onError?.(message);
      onDone?.("error");
      return;
    }

    if (!response.ok) {
      let errorDetail = `Request failed with status ${response.status}`;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorJson.message || errorDetail;
      } catch {
        // Fallback to response text
        const errorText = await response.text().catch(() => "");
        if (errorText) errorDetail = errorText;
      }
      onError?.(errorDetail);
      onDone?.("error");
      return;
    }

    if (!response.body) {
      onError?.("Server returned an empty response body");
      onDone?.("error");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by double newline (\n\n)
        const events = buffer.split("\n\n");
        // Keep the last segment in buffer if incomplete
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          const trimmed = rawEvent.trim();
          if (!trimmed) continue;

          let eventType = "message";
          let dataStr = "";

          const lines = trimmed.split("\n");
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataStr = line.slice(5).trim();
            }
          }

          if (!dataStr) continue;

          try {
            if (eventType === "citations") {
              const citations: Citation[] = JSON.parse(dataStr);
              onCitations?.(citations);
            } else if (eventType === "message") {
              const payload: ChatStreamTokenPayload = JSON.parse(dataStr);
              onToken?.(payload.token ?? payload.text ?? "");
            } else if (eventType === "error") {
              const errorPayload: ChatStreamErrorPayload = JSON.parse(dataStr);
              onError?.(errorPayload.error || "An error occurred during streaming");
            } else if (eventType === "done") {
              const donePayload: ChatStreamDonePayload = JSON.parse(dataStr);
              onDone?.(donePayload.status);
            }
          } catch (jsonErr) {
            console.warn("Failed to parse SSE event data:", dataStr, jsonErr);
          }
        }
      }

      onDone?.("completed");
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        onDone?.("completed");
        return;
      }
      const message = err instanceof Error ? err.message : "Stream reading interrupted";
      onError?.(message);
      onDone?.("error");
    } finally {
      reader.releaseLock();
    }
  },
};
