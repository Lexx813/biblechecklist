"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../../src/lib/supabase";
import { useAIChat, type ChatMessage } from "../../../src/hooks/useAIChat";
import { renderMessage } from "./renderMessage";

interface Props {
  conversationId: string | null;
  userId: string;
  onConversationCreated: (id: string, title: string) => void;
}

const SUGGESTIONS = [
  "What does the Bible say about why God allows suffering?",
  "Why don't Jehovah's Witnesses celebrate birthdays?",
  "Walk me through this week's CLAM meeting",
  "Find scriptures about paradise on earth",
];

export default function AiChatView({ conversationId, userId, onConversationCreated }: Props) {
  const [initialMessages, setInitialMessages] = useState<ChatMessage[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load history when conversationId changes ────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!conversationId) {
        setInitialMessages([]);
        return;
      }
      setLoadingHistory(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch(`/api/ai-conversations/${conversationId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          if (!cancelled) setInitialMessages([]);
          return;
        }
        const data = (await res.json()) as { messages: Array<{ role: "user" | "assistant"; content: Array<{ type: string; text?: string }> }> };
        const flat: ChatMessage[] = data.messages.map((m) => ({
          role: m.role,
          content: (m.content ?? [])
            .filter((b) => b.type === "text" && typeof b.text === "string")
            .map((b) => b.text!)
            .join("\n"),
        }));
        if (!cancelled) setInitialMessages(flat);
      } catch {
        if (!cancelled) setInitialMessages([]);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [conversationId]);

  const { messages, loading, error, send } = useAIChat(undefined, {
    conversationId: conversationId ?? undefined,
    initialMessages: initialMessages ?? undefined,
  });

  // ── Auto-scroll on new message ──────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send: if no conversation, create one first ─────────────────────────
  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");

    let activeId = conversationId;
    if (!activeId) {
      // Create a new conversation, auto-titled from first 60 chars of user msg
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const title = trimmed.slice(0, 60);
      try {
        const res = await fetch("/api/ai-conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ title }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { conversation: { id: string; title: string } };
        activeId = data.conversation.id;
        onConversationCreated(activeId, data.conversation.title);
      } catch {
        // If create fails, fall back to ephemeral chat (still works, won't persist)
      }
    }

    send(trimmed);
  }, [conversationId, loading, send, onConversationCreated]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages scroll area */}
      <div className="flex-1 overflow-y-auto">
        {loadingHistory ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Loading conversation…
          </div>
        ) : !hasMessages ? (
          <Welcome onPick={(q) => handleSend(q)} />
        ) : (
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <ul className="space-y-6">
              {messages.map((m, i) => (
                <li key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  {m.role === "user" ? (
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-violet-600 px-4 py-2.5 text-sm text-white">
                      {m.content}
                    </div>
                  ) : (
                    <div className="max-w-full text-sm text-slate-800 dark:text-slate-100">
                      <div className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-a:text-violet-700 dark:prose-a:text-violet-300">
                        {renderMessage(m.content)}
                      </div>
                      {m.streaming && (
                        <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-violet-400 align-middle" aria-hidden />
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-700/30 dark:bg-amber-900/20 dark:text-amber-200">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-[#160f2e]">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about the Bible, JW publications, or this week's meeting…"
            rows={1}
            className="flex-1 resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-white/10 dark:bg-[#0d0820] dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:ring-violet-900/40"
          />
          <button
            type="button"
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="inline-flex size-10 items-center justify-center rounded-md bg-violet-600 text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send"
          >
            {loading ? (
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
                <path d="M12 3a9 9 0 0 1 9 9" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            )}
          </button>
        </div>
        <div className="mx-auto mt-2 max-w-3xl px-1 text-[11px] text-slate-500 dark:text-slate-500">
          Aligned with Watch Tower teaching. Sources link to wol.jw.org.
          <span className="ml-1 hidden sm:inline">User ID: {userId.slice(0, 8)}…</span>
        </div>
      </div>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
      <div className="inline-flex size-12 items-center justify-center rounded-md bg-violet-600 text-white">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z" />
        </svg>
      </div>
      <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        What would you like to study today?
      </h2>
      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
        Ask any Bible question. Answers draw from JW publications and the NWT, with links back to wol.jw.org.
      </p>
      <ul className="mt-8 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onPick(q)}
              className="block w-full rounded-md border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-violet-300"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
