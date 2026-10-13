export * from "@/types/chat";

export interface ChatState {
  isStreaming: boolean;
  error: string | null;
  activeCitationId: string | null;
}
