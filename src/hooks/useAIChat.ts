import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

/**
 * Hook for multi-turn AI study companion chat via /api/ai-chat.
 *
 * Usage:
 *   const { messages, loading, error, send, clear } = useAIChat();
 *   send("What does John 3:16 teach about God's love?");
 */
const STORAGE_KEY = "ai_study_chat_history";

function loadSaved(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    // Strip any half-streamed messages that got saved mid-flight
    return parsed.map(m => ({ ...m, streaming: false }));
  } catch {
    return [];
  }
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadSaved);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const abortRef                = useRef<AbortController | null>(null);

  // Keep a ref in sync so send() always reads the latest history
  // without needing messages in its dependency array.
  const messagesRef = useRef<ChatMessage[]>(messages);

  // Persist to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // storage full or unavailable — silently ignore
    }
  }, [messages]);

  const syncedSetMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setMessages((prev) => {
        const next = updater(prev);
        messagesRef.current = next;
        return next;
      });
    },
    []
  );

  const send = useCallback(async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setError(null);

    // Snapshot current history BEFORE any state updates — no stale closure risk
    // because we read from the ref, not from the closure-captured state.
    const apiMessages: { role: "user" | "assistant"; content: string }[] = [
      ...messagesRef.current.map(({ role, content }) => ({ role, content })),
      { role: "user", content: trimmed },
    ];

    // Update UI: user bubble + empty streaming placeholder
    syncedSetMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed },
      { role: "assistant", content: "", streaming: true },
    ]);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in to use the AI Study Companion.");

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "Unknown error");
        throw new Error(msg);
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const evt = JSON.parse(raw) as {
              type: string;
              delta?: { type: string; text: string };
            };
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
              syncedSetMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: last.content + evt.delta!.text,
                    streaming: true,
                  };
                }
                return updated;
              });
            }
          } catch {
            // skip malformed SSE chunks
          }
        }
      }

      // Mark streaming done (remove streaming flag)
      syncedSetMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = { role: "assistant", content: last.content };
        }
        return updated;
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message || "Something went wrong. Please try again.");
        // Remove empty placeholder on error
        syncedSetMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && !last.content) return prev.slice(0, -1);
          return prev;
        });
      }
    } finally {
      setLoading(false);
    }
  }, [syncedSetMessages]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    messagesRef.current = [];
    setMessages([]);
    setError(null);
    setLoading(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  return { messages, loading, error, send, clear };
}
