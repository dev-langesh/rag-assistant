"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { ChatMessage, ChatMessageContext, Citation } from "@/types/chat";
import { chatApi } from "@/lib/api/chat";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Citation Inspector State
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const [isCitationOpen, setIsCitationOpen] = useState<boolean>(false);

  // AbortController ref to cancel active stream
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    setMessages((prev) =>
      prev.map((msg) =>
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      )
    );

    toast.info("Generation stopped");
  }, []);

  const sendMessage = useCallback(
    async (queryOverride?: string, historyOverride?: ChatMessage[]) => {
      const queryToSend = (queryOverride ?? input).trim();
      if (!queryToSend || isStreaming) return;

      const userMessageId = `user-${Date.now()}`;
      const assistantMessageId = `asst-${Date.now()}`;

      const userMessage: ChatMessage = {
        id: userMessageId,
        role: "user",
        content: queryToSend,
        timestamp: new Date(),
      };

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        citations: [],
        isStreaming: true,
        timestamp: new Date(),
      };

      // Extract prior conversation history (excluding failed or empty messages)
      const priorHistory = historyOverride ?? messages;
      const contextPayload: ChatMessageContext[] = priorHistory
        .filter((m) => !m.error && m.content.trim().length > 0)
        .slice(-10)
        .map((m) => ({
          role: m.role,
          content: m.content.trim(),
        }));

      setMessages((prev) => [
        ...(historyOverride ?? prev),
        userMessage,
        assistantMessage,
      ]);
      setInput("");
      setError(null);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      await chatApi.stream({
        query: queryToSend,
        top_k: 10,
        context: contextPayload,
        signal: controller.signal,
        onCitations: (citations) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, citations } : msg
            )
          );
        },
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + token }
                : msg
            )
          );
        },
        onError: (errMessage) => {
          setError(errMessage);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    isStreaming: false,
                    error: errMessage,
                  }
                : msg
            )
          );
          toast.error("Chat error", {
            description: errMessage,
          });
        },
        onDone: (status) => {
          setIsStreaming(false);
          abortControllerRef.current = null;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    isStreaming: false,
                    ...(status === "error" && !msg.error
                      ? { error: "Generation ended with an error." }
                      : {}),
                  }
                : msg
            )
          );
        },
      });
    },
    [input, isStreaming, messages]
  );

  const retryMessage = useCallback(
    async (failedMessageId: string) => {
      // Find the message index
      const failedIdx = messages.findIndex((m) => m.id === failedMessageId);
      if (failedIdx === -1) return;

      // Find the preceding user query
      let queryToRetry = "";
      let userMsgIdx = -1;
      for (let i = failedIdx - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          queryToRetry = messages[i].content;
          userMsgIdx = i;
          break;
        }
      }

      if (!queryToRetry || userMsgIdx === -1) return;

      // Slice out the failed message and its user query from history
      const priorHistory = messages.slice(0, userMsgIdx);
      await sendMessage(queryToRetry, priorHistory);
    },
    [messages, sendMessage]
  );

  const clearChat = useCallback(() => {
    if (isStreaming) {
      stopStreaming();
    }
    setMessages([]);
    setInput("");
    setError(null);
    setActiveCitation(null);
    setIsCitationOpen(false);
  }, [isStreaming, stopStreaming]);

  const selectCitation = useCallback((citation: Citation) => {
    setActiveCitation(citation);
    setIsCitationOpen(true);
  }, []);

  const closeCitation = useCallback(() => {
    setIsCitationOpen(false);
  }, []);

  return {
    messages,
    input,
    setInput,
    isStreaming,
    error,
    activeCitation,
    isCitationOpen,
    sendMessage,
    stopStreaming,
    retryMessage,
    clearChat,
    selectCitation,
    closeCitation,
  };
}
