import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export interface ChatContext {
  page?: string;
  bookIndex?: number;
  bookName?: string;
  chapter?: number;
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

export interface BlogDraft {
  title: string;
  content: string;
  excerpt: string;
}

export interface UseAIChatOptions {
  /** Persist this turn server-side under the given conversation. /ai page uses this. */
  conversationId?: string;
  /** Initial message history (e.g. loaded from DB on /ai/[id]). Bypasses localStorage. */
  initialMessages?: ChatMessage[];
}

export function useAIChat(context?: ChatContext, options: UseAIChatOptions = {}) {
  const { conversationId, initialMessages } = options;

  // Bubble (no conversationId) restores from localStorage. Page-mode skips it
  // — each conversation_id is the source of truth, no cross-talk.
  const useLocalStorage = !conversationId;
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => initialMessages ?? (useLocalStorage ? loadSaved() : []),
  );
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const abortRef                = useRef<AbortController | null>(null);

  // Keep a ref in sync so send() always reads the latest history
  // without needing messages in its dependency array.
  const messagesRef = useRef<ChatMessage[]>(messages);

  // Keep context in a ref so send() always uses the current page context
  // without context needing to be a dep (which would recreate send on every nav).
  const contextRef = useRef(context);
  contextRef.current = context;

  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  // Reset history when switching conversations (e.g. user clicks a different
  // chat in the sidebar). Skipped in localStorage mode.
  useEffect(() => {
    if (!useLocalStorage) {
      const next = initialMessages ?? [];
      messagesRef.current = next;
      setMessages(next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Persist to localStorage whenever messages change (bubble mode only)
  useEffect(() => {
    if (!useLocalStorage) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // storage full or unavailable — silently ignore
    }
  }, [messages, useLocalStorage]);

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
        body: JSON.stringify({
          messages: apiMessages,
          context: contextRef.current,
          ...(conversationIdRef.current ? { conversation_id: conversationIdRef.current } : {}),
        }),
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
              draft?: { title: string; content: string; excerpt: string };
            };
            if (evt.type === "navigate" && (evt as { type: string; page?: string }).page) {
              window.dispatchEvent(new CustomEvent("ai:navigate", { detail: { page: (evt as { type: string; page: string }).page } }));
              continue;
            }
            if (evt.type === "blog_draft" && evt.draft) {
              // Auto-open editor — no button click required
              window.dispatchEvent(new CustomEvent("ai:blog-draft", { detail: evt.draft }));
              continue;
            }
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
    if (useLocalStorage) {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }, [useLocalStorage]);

  return { messages, loading, error, send, clear };
}
