"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../../src/lib/supabase";
import { useAIChat, type ChatMessage } from "../../../src/hooks/useAIChat";
import { renderMessage } from "./renderMessage";

interface Props {
  conversationId: string | null;
  userId: string;
  onConversationCreated: (id: string, title: string) => void;
  /** Optional starter prompt pre-filled into the input box (from ?ask= URL param).
   *  The user must tap Send. We never auto-send because that's a URL-CSRF surface
   *  for prompt injection — any external link could trigger AI actions. */
  autoSendPrompt?: string | null;
  /** Called once the prompt has been pre-filled so the parent clears the URL */
  onAutoSendConsumed?: () => void;
}

const SUGGESTIONS = [
  "What does the Bible say about why God allows suffering?",
  "Why don't Jehovah's Witnesses celebrate birthdays?",
  "Walk me through this week's CLAM meeting",
  "Find scriptures about paradise on earth",
];

export default function AiChatView({ conversationId, userId, onConversationCreated, autoSendPrompt, onAutoSendConsumed }: Props) {
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

    // Pass activeId explicitly — the parent state setter from
    // onConversationCreated hasn't propagated to the hook's ref yet on this
    // render cycle, so the ref-based fallback would still be null.
    send(trimmed, activeId ?? undefined);
  }, [conversationId, loading, send, onConversationCreated]);

  // ── Pre-fill input from ?ask= URL param (NEVER auto-send) ───────────────
  // Auto-sending from a URL is a CSRF surface: any external link could trigger
  // AI actions on the user's behalf. We pre-fill the input + show a badge so
  // the user reviews + taps Send themselves.
  const [prefilledFromUrl, setPrefilledFromUrl] = useState(false);
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (prefilledRef.current) return;
    if (!autoSendPrompt) return;
    if (loadingHistory) return;
    if (initialMessages === null && conversationId) return;
    prefilledRef.current = true;
    setInput(autoSendPrompt);
    setPrefilledFromUrl(true);
    // Auto-resize the textarea to fit the prefilled content
    requestAnimationFrame(() => {
      const ta = inputRef.current;
      if (ta) {
        ta.style.height = "auto";
        ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
        ta.focus();
      }
    });
    onAutoSendConsumed?.();
  }, [autoSendPrompt, loadingHistory, initialMessages, conversationId, onAutoSendConsumed]);

  // Clear the "from link" badge once the user starts editing
  useEffect(() => {
    if (prefilledFromUrl && !input) setPrefilledFromUrl(false);
  }, [input, prefilledFromUrl]);

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
              {messages.map((m, i) => {
                const isLast = i === messages.length - 1;
                const showFollowups =
                  isLast && m.role === "assistant" && !m.streaming && !!m.content && !loading;
                return (
                  <li key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    {m.role === "user" ? (
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-violet-600 px-4 py-2.5 text-sm text-white">
                        {m.content}
                      </div>
                    ) : (
                      <div className="max-w-full text-sm text-slate-800 dark:text-slate-100">
                        {m.streaming && !m.content ? (
                          <ThinkingIndicator />
                        ) : (
                          <>
                            <div className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-a:text-violet-700 dark:prose-a:text-violet-300">
                              {renderMessage(m.content)}
                            </div>
                            {m.streaming && (
                              <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-violet-400 align-middle" aria-hidden />
                            )}
                            {showFollowups && (
                              <FollowUpChips lastMessage={m.content} onPick={handleSend} />
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
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

      {/* Input — integrated command bar
          pb uses safe-area-inset-bottom + a bit of breathing room so iOS home
          indicator and any dev toolbar don't overlap the disclaimer. */}
      <div
        className="border-t border-slate-200 bg-linear-to-b from-white to-slate-50/50 px-3 pt-3 sm:px-6 sm:pt-5 dark:border-white/10 dark:from-[#160f2e] dark:to-[#0d0820]"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto max-w-3xl">
          {prefilledFromUrl && (
            <div className="mb-2 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900 dark:border-amber-700/30 dark:bg-amber-900/20 dark:text-amber-200" role="status">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>This message was pre-filled from a link. Review it before sending.</span>
            </div>
          )}
          <div
            className="group relative flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-violet-400 focus-within:shadow-[0_0_0_3px_rgb(124_58_237_/_0.12)] hover:border-slate-300 dark:border-white/10 dark:bg-[#0d0820] dark:focus-within:border-violet-500/60 dark:focus-within:shadow-[0_0_0_3px_rgb(196_181_253_/_0.15)] dark:hover:border-white/20"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI Study Companion…"
              rows={1}
              disabled={loading}
              className="flex-1 min-w-0 resize-none bg-transparent px-2 py-2 text-base leading-6 text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50 dark:text-slate-50 dark:placeholder:text-slate-500"
              aria-label="Ask the AI Study Companion"
            />
            <button
              type="button"
              onClick={() => handleSend(input)}
              disabled={!input.trim() || loading}
              className="mb-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm transition hover:bg-violet-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none disabled:hover:bg-slate-300 dark:disabled:bg-white/10"
              aria-label={loading ? "AI is thinking" : "Send message"}
            >
              {loading ? (
                <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
                  <path d="M12 3a9 9 0 0 1 9 9" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-2 px-2 text-center text-[11px] leading-snug text-balance text-slate-400 dark:text-slate-500">
            Sources link to wol.jw.org. The companion may make mistakes — verify with the publications.
          </p>
        </div>
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  // Cycle through "thinking" labels every ~1.6s so the user sees activity even
  // when the underlying tool call (semantic search, FAQ lookup, profile read)
  // takes a few seconds.
  const labels = [
    "Thinking",
    "Looking that up",
    "Reading the publications",
    "Considering the scriptures",
  ];
  const [labelIdx, setLabelIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLabelIdx((i) => (i + 1) % labels.length), 1600);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="AI is thinking"
      className="flex items-center gap-3 py-1.5 text-sm text-slate-500 dark:text-slate-400"
    >
      <span className="inline-flex items-end gap-[3px]" aria-hidden>
        <span className="aithink-dot" />
        <span className="aithink-dot aithink-dot--2" />
        <span className="aithink-dot aithink-dot--3" />
      </span>
      <span className="font-medium">
        {labels[labelIdx]}
        <span aria-hidden>…</span>
      </span>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (q: string) => void }) {
  // Time-of-day greeting. Quiet, no exclamation marks.
  const hour = new Date().getHours();
  const greeting =
    hour < 5  ? "Late evening" :
    hour < 12 ? "Good morning" :
    hour < 18 ? "Good afternoon" :
                "Good evening";

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col justify-end px-4 pb-10 pt-16 sm:px-6 sm:pb-12 sm:pt-24">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
          {greeting}
        </p>
        <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
          What are you studying?
        </h2>
        <p className="mt-4 max-w-md text-base text-slate-600 dark:text-slate-300">
          Ask anything from the New World Translation or the publications at wol.jw.org.
        </p>
      </div>

      <div className="mt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          Try asking
        </p>
        <ul className="mt-3 space-y-2.5">
          {SUGGESTIONS.map((q) => (
            <li key={q}>
              <button
                type="button"
                onClick={() => onPick(q)}
                className="group inline-flex items-baseline gap-2 text-left text-base text-slate-700 transition hover:text-violet-700 dark:text-slate-200 dark:hover:text-violet-300"
              >
                <span aria-hidden className="font-mono text-[10px] tabular-nums text-slate-300 dark:text-slate-600 group-hover:text-violet-400">
                  ›
                </span>
                <span className="border-b border-transparent group-hover:border-violet-400">
                  &ldquo;{q}&rdquo;
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Follow-up suggestion chips ────────────────────────────────────────────────
// Shown below the LAST assistant message once streaming finishes. v1 ships
// hardcoded but contextual chips (heuristic on the last reply); v2 will hit
// a small LLM call to generate context-specific follow-ups.
function FollowUpChips({ lastMessage, onPick }: { lastMessage: string; onPick: (q: string) => void }) {
  const suggestions = pickFollowUps(lastMessage);
  if (!suggestions.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/40 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:border-violet-500 hover:bg-violet-100 active:scale-95 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-200 dark:hover:border-violet-400 dark:hover:bg-violet-500/25"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 18l6-6-6-6" />
          </svg>
          {s}
        </button>
      ))}
    </div>
  );
}

/** Heuristic follow-ups based on what the last assistant message contains. */
function pickFollowUps(text: string): string[] {
  const lower = text.toLowerCase();
  const out: string[] = [];

  // If the reply mentions a scripture, offer to dig deeper into it
  const hasScripture = /\b(john|matthew|psalm|romans|isaiah|genesis|revelation|acts|corinthians|hebrews|peter|timothy|mark|luke)\s+\d+/i.test(text);
  if (hasScripture) {
    out.push("Show me related scriptures");
  }

  // If reply discusses a doctrine/topic, encourage cross-referencing
  if (/\b(doctrine|teach|believe|view|understand|interpretation)/.test(lower)) {
    out.push("What does the Watchtower say about this?");
  }

  // If reply mentions practical application
  if (/\b(apply|practical|life|daily|today|today's)/.test(lower)) {
    out.push("How can I apply this in daily life?");
  }

  // If response is short, offer to expand
  if (text.length < 400) {
    out.push("Tell me more");
  }

  // Always offer the save action — the AI has a save_note tool
  out.push("Save this as a note");

  // Cap at 3 to avoid overwhelming the user
  return out.slice(0, 3);
}
