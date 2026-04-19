import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAIChat, type ChatContext } from "../hooks/useAIChat";
import { trackFeatureUse } from "../lib/analytics";
import "../styles/ai-study-bubble.css";

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

const SUGGESTED_DEFAULT = [
  "What does this passage teach about Jehovah?",
  "What does the original Hebrew or Greek mean?",
  "How can I explain this scripture to someone?",
  "What does the Reasoning book say about this?",
];

const SUGGESTED_BLOG = [
  "Write a blog draft about what I'm studying",
  "Give me an outline for a JW article on this topic",
  "Suggest 5 blog title ideas with scriptures",
  "Help me write an introduction paragraph",
];

function getSuggested(page?: string): string[] {
  if (page === "blogNew" || page === "blogEdit") return SUGGESTED_BLOG;
  return SUGGESTED_DEFAULT;
}

export default function AIStudyBubble({ context }: { context?: ChatContext }) {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const { messages, loading, error, send, clear } = useAIChat(context);
  const suggested = getSuggested(context?.page);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

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

  const panel = open && (
    <div className="asb-panel" ref={panelRef} role="dialog" aria-label="AI Study Companion">
      {/* Header */}
      <div className="asb-header">
        <div className="asb-header-left">
          <span className="asb-header-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z"/>
            </svg>
          </span>
          <div>
            <div className="asb-title">Study Companion</div>
            <div className="asb-subtitle">JW sources only · wol.jw.org</div>
          </div>
        </div>
        <div className="asb-header-actions">
          {hasMessages && (
            <button className="asb-clear-btn" onClick={handleClear} title="Clear conversation">
              Clear
            </button>
          )}
          <button className="asb-close-btn" onClick={() => setOpen(false)} aria-label="Close study companion">
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
              {(context?.page === "blogNew" || context?.page === "blogEdit")
                ? "Tell me a topic and I'll write a full draft and load it into the editor. I can also brainstorm titles, outlines, or help with any section."
                : "Ask any Bible question. Answers draw exclusively from Watch Tower publications, the NWT, and wol.jw.org."}
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
          // Skip empty streaming assistant messages — isThinking block handles that state
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
                ? <>{renderMarkdown(msg.content)}{msg.streaming && <span className="asb-cursor" />}</>
                : msg.content || (msg.streaming && <span className="asb-cursor" />)
              }
            </div>
          </div>
        ))}

        {(() => {
          const last = messages[messages.length - 1];
          const isThinking = loading && last && last.role === "assistant" && !last.content && last.streaming;
          return isThinking ? (
            <div className="asb-msg asb-msg--assistant">
              <span className="asb-msg-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z"/>
                </svg>
              </span>
              <div className="asb-thinking">
                <div className="asb-typing">
                  <span className="asb-dot" /><span className="asb-dot" /><span className="asb-dot" />
                </div>
                <span className="asb-thinking-label">Thinking…</span>
              </div>
            </div>
          ) : null;
        })()}
        {loading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
          <div className="asb-msg asb-msg--assistant">
            <span className="asb-msg-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z"/>
              </svg>
            </span>
            <div className="asb-typing">
              <span className="asb-dot" /><span className="asb-dot" /><span className="asb-dot" />
            </div>
          </div>
        )}

        {error && <div className="asb-error">{error}</div>}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="asb-input-row">
        <textarea
          ref={inputRef}
          className="asb-textarea"
          placeholder="Ask a Bible question…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={500}
          rows={1}
          disabled={loading}
          aria-label="Ask a Bible question"
        />
        <button
          className="asb-send-btn"
          onClick={submit}
          disabled={!input.trim() || loading}
          aria-label="Send"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );

  return createPortal(
    <div className="asb-root">
      {panel}
      <button
        className={`asb-fab${open ? " asb-fab--active" : ""}`}
        onClick={() => setOpen(v => { if (!v) trackFeatureUse("ai_bubble_open"); return !v; })}
        aria-label={open ? "Close study companion" : "Open AI Study Companion"}
        title="AI Study Companion"
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
