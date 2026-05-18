import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import AiConfirmActionModal from "./AiConfirmActionModal";
import { useAIChat, type ChatContext } from "../hooks/useAIChat";
import { trackFeatureUse } from "../lib/analytics";
import { supabase } from "../lib/supabase";
import "../styles/ai-study-bubble.css";

interface AIUsage {
  percent_used: number;
  input_used: number;
  input_cap: number;
  output_used: number;
  output_cap: number;
}

/** Render markdown: headings, bold, italic, bullet lists, numbered lists, links, bare URLs. */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];

    // Headings: ## or ###
    const h3 = line.match(/^###\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    const h1 = line.match(/^#\s+(.+)$/);
    if (h3) { nodes.push(<strong key={key++} style={{ display: "block", marginTop: 10, marginBottom: 2, fontSize: "0.92em" }}>{inlineMarkdown(h3[1], key++)}</strong>); continue; }
    if (h2) { nodes.push(<strong key={key++} style={{ display: "block", marginTop: 12, marginBottom: 3 }}>{inlineMarkdown(h2[1], key++)}</strong>); continue; }
    if (h1) { nodes.push(<strong key={key++} style={{ display: "block", marginTop: 12, marginBottom: 4, fontSize: "1.05em" }}>{inlineMarkdown(h1[1], key++)}</strong>); continue; }

    // Bullet list item: - or *
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      nodes.push(
        <div key={key++} style={{ display: "flex", gap: 6, marginTop: 3 }}>
          <span style={{ flexShrink: 0, color: "var(--teal)" }}>•</span>
          <span>{inlineMarkdown(bullet[1], key++)}</span>
        </div>
      );
      continue;
    }

    // Numbered list: 1. 2. etc.
    const numbered = line.match(/^(\d+)\.\s+(.+)$/);
    if (numbered) {
      nodes.push(
        <div key={key++} style={{ display: "flex", gap: 6, marginTop: 3 }}>
          <span style={{ flexShrink: 0, color: "var(--teal)", minWidth: 16 }}>{numbered[1]}.</span>
          <span>{inlineMarkdown(numbered[2], key++)}</span>
        </div>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      nodes.push(<hr key={key++} style={{ border: "none", borderTop: "1px solid var(--border)", margin: "8px 0" }} />);
      continue;
    }

    // Empty line → small gap
    if (line.trim() === "") {
      nodes.push(<div key={key++} style={{ height: 6 }} />);
      continue;
    }

    // Regular paragraph line
    nodes.push(<span key={key++} style={{ display: "block" }}>{inlineMarkdown(line, key++)}</span>);
  }

  return nodes;
}

/** Render inline tokens: **bold**, *italic*, [text](url), bare https:// URLs */
function inlineMarkdown(text: string, baseKey: number): React.ReactNode[] {
  // Token: bold, italic, markdown link, or bare URL
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s)>\]]+)/g);
  return parts.map((part, i) => {
    const k = `${baseKey}-${i}`;

    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={k}>{bold[1]}</strong>;

    const italic = part.match(/^\*([^*]+)\*$/);
    if (italic) return <em key={k}>{italic[1]}</em>;

    const mdLink = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (mdLink) {
      return (
        <a key={k} href={mdLink[2]} target="_blank" rel="noopener noreferrer" className="asb-verse-link">
          {mdLink[1]}
        </a>
      );
    }

    const bareUrl = part.match(/^https?:\/\/[^\s)>\]]+$/);
    if (bareUrl) {
      // Shorten display: strip https:// and truncate if long
      const display = part.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const short = display.length > 45 ? display.slice(0, 42) + "…" : display;
      return (
        <a key={k} href={part} target="_blank" rel="noopener noreferrer" className="asb-verse-link">
          {short}
        </a>
      );
    }

    return part;
  });
}

// Memoized assistant message body — only re-renders when content changes,
// not on every streaming-token state propagation upstream. The streaming
// cursor is rendered by the parent so this component can stay pure on the
// content text.
const AssistantMessageBody = memo(function AssistantMessageBody({ content }: { content: string }) {
  // Memo the marked output per content string. For long replies during
  // streaming, markdown is re-parsed on every chunk arrival — moving it
  // into a memo skips the parse when the parent re-renders for any other
  // reason (sibling user message changes, suggestions list toggle, etc.).
  const rendered = useMemo(() => renderMarkdown(content), [content]);
  return <>{rendered}</>;
});

function AIStudyBubble({ context }: { context?: ChatContext }) {
  const { t } = useTranslation();
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const { messages, loading, error, send, clear } = useAIChat(context);
  const isBlogContext = context?.page === "blogNew" || context?.page === "blogEdit";
  const suggested = isBlogContext
    ? [
        t("aiBubble.suggestedBlog.q1"),
        t("aiBubble.suggestedBlog.q2"),
        t("aiBubble.suggestedBlog.q3"),
        t("aiBubble.suggestedBlog.q4"),
      ]
    : [
        t("aiBubble.suggestedDefault.q1"),
        t("aiBubble.suggestedDefault.q2"),
        t("aiBubble.suggestedDefault.q3"),
        t("aiBubble.suggestedDefault.q4"),
      ];
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest message. Depend on messages.length (not messages
  // identity) so per-token streaming deltas don't trigger a smooth-scroll
  // on every chunk — that forced reflow + main-thread animation per delta
  // jankied the streaming UX.
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const submit = useCallback(() => {
    const q = input.trim();
    if (!q || loading) return;
    send(q);
    trackFeatureUse("ai_bubble_message_sent");
    setInput("");
  }, [input, loading, send]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleSuggestion = (text: string) => {
    if (loading) return;
    send(text);
    trackFeatureUse("ai_bubble_suggestion_click");
  };

  const handleClear = () => {
    clear();
    setInput("");
    inputRef.current?.focus();
  };

  const hasMessages = messages.length > 0;

  // ── Daily AI quota indicator ──────────────────────────────────────────────
  const [usage, setUsage] = useState<AIUsage | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function fetchUsage() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch("/api/ai-usage", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as AIUsage;
        if (!cancelled) setUsage(data);
      } catch { /* swallow, pill is purely informational */ }
    }
    if (open) fetchUsage();
    return () => { cancelled = true; };
    // Only refetch when the panel opens. Previously [open, messages.length]
    // fired on every streaming chunk, hammering /api/ai-usage. The pill is
    // informational; one fetch per open is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const panel = open && (
    <div className="asb-panel" ref={panelRef} role="dialog" aria-label={t("aiBubble.dialogLabel")}>
      {/* Header */}
      <div className="asb-header">
        <div className="asb-header-left">
          <span className="asb-header-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z"/>
            </svg>
          </span>
          <div>
            <div className="asb-title">{t("aiBubble.title")}</div>
            <div className="asb-subtitle">{t("aiBubble.subtitle")}</div>
          </div>
        </div>
        <div className="asb-header-actions">
          {usage && (
            <span
              className={`asb-usage-pill${usage.percent_used >= 80 ? " asb-usage-pill--high" : ""}`}
              title={t("aiBubble.quotaTitle", {
                inputUsed: usage.input_used.toLocaleString(),
                inputCap: usage.input_cap.toLocaleString(),
                outputUsed: usage.output_used.toLocaleString(),
                outputCap: usage.output_cap.toLocaleString(),
              })}
              aria-label={t("aiBubble.quotaAriaLabel", { percent: usage.percent_used })}
            >
              {t("aiBubble.quotaPill", { percent: usage.percent_used })}
            </span>
          )}
          {hasMessages && (
            <button className="asb-clear-btn" onClick={handleClear} title={t("aiBubble.clearTitle")}>
              {t("aiBubble.clear")}
            </button>
          )}
          <button className="asb-close-btn" onClick={() => setOpen(false)} aria-label={t("aiBubble.closeAriaLabel")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="asb-messages">
        {!hasMessages && !loading && (
          <div className="asb-welcome">
            <p className="asb-welcome-text">
              {isBlogContext
                ? t("aiBubble.welcomeBlog")
                : t("aiBubble.welcomeDefault")}
            </p>
            <div className="asb-suggestions">
              {suggested.map(s => (
                <button key={s} className="asb-suggestion" onClick={() => handleSuggestion(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          // Skip empty streaming assistant messages, isThinking block handles that state
          (msg.role === "assistant" && msg.streaming && !msg.content) ? null :
          <div key={i} className={`asb-msg asb-msg--${msg.role}`}>
            {msg.role === "assistant" && (
              <span className="asb-msg-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z"/>
                </svg>
              </span>
            )}
            <div className="asb-msg-content">
              {msg.role === "assistant"
                ? <><AssistantMessageBody content={msg.content} />{msg.streaming && <span className="asb-cursor" />}</>
                : msg.content || (msg.streaming && <span className="asb-cursor" />)
              }
            </div>
          </div>
        ))}

        {(() => {
          const last = messages[messages.length - 1];
          const isAwaitingFirstToken =
            loading && last && (
              (last.role === "assistant" && last.streaming && !last.content) ||
              last.role === "user"
            );
          return isAwaitingFirstToken ? <BubbleThinkingIndicator /> : null;
        })()}

        {error && <div className="asb-error">{error}</div>}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="asb-input-row">
        <textarea
          ref={inputRef}
          className="asb-textarea"
          placeholder={t("aiBubble.placeholder")}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={500}
          rows={1}
          disabled={loading}
          aria-label={t("aiBubble.inputAriaLabel")}
        />
        <button
          className="asb-send-btn"
          onClick={submit}
          disabled={!input.trim() || loading}
          aria-label={t("a11y.send")}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );

  return createPortal(
    <div className="asb-root" style={{ position: "fixed", zIndex: 1000 }}>
      <AiConfirmActionModal />
      {panel}
      <button
        className={`asb-fab${open ? " asb-fab--active" : ""}`}
        onClick={() => setOpen(v => { if (!v) trackFeatureUse("ai_bubble_open"); return !v; })}
        aria-label={open ? t("aiBubble.closeAriaLabel") : t("aiBubble.openAriaLabel")}
        title={t("aiBubble.fabTitle")}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z"/>
          </svg>
        )}
        {hasMessages && !open && <span className="asb-badge" aria-hidden="true" />}
      </button>
    </div>,
    document.body
  );
}

const THINKING_LABEL_KEYS = [
  "aiBubble.thinking1",
  "aiBubble.thinking2",
  "aiBubble.thinking3",
  "aiBubble.thinking4",
] as const;

function BubbleThinkingIndicator() {
  const { t } = useTranslation();
  const [labelIdx, setLabelIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLabelIdx((i) => (i + 1) % THINKING_LABEL_KEYS.length), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="asb-msg asb-msg--assistant">
      <span className="asb-msg-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z"/>
        </svg>
      </span>
      <div
        role="status"
        aria-live="polite"
        aria-label={t("aiBubble.aiThinkingAriaLabel")}
        className="asb-aithink"
      >
        <span className="asb-aithink-dots" aria-hidden>
          <span className="aithink-dot" />
          <span className="aithink-dot aithink-dot--2" />
          <span className="aithink-dot aithink-dot--3" />
        </span>
        <span className="asb-aithink-label">
          {t(THINKING_LABEL_KEYS[labelIdx])}
          <span aria-hidden>…</span>
        </span>
      </div>
    </div>
  );
}

// memo'd so AIStudyBubble doesn't re-render on every BibleApp state change
// (theme toggle, subPage, nav, etc.) — `context` is already useMemo'd in
// AuthedApp so the comparison is shallow-stable when the page truly changes.
export default memo(AIStudyBubble);
