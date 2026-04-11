import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAIChat } from "../hooks/useAIChat";
import "../styles/ai-study-bubble.css";

/** Render a subset of markdown: **bold**, [text](url), and line breaks. */
function renderMarkdown(text: string): React.ReactNode[] {
  // Split on bold (**…**) and links ([text](url)) tokens
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={i}>{bold[1]}</strong>;

    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) {
      return (
        <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="asb-verse-link">
          {link[1]}
        </a>
      );
    }

    // Plain text — preserve line breaks
    return part.split("\n").map((line, j, arr) => (
      j < arr.length - 1 ? [line, <br key={`${i}-${j}`} />] : line
    ));
  });
}

const SUGGESTED = [
  "What does this passage teach about Jehovah?",
  "What does the original Hebrew or Greek mean?",
  "How can I explain this scripture to someone?",
  "What does the Reasoning book say about this?",
];

export default function AIStudyBubble() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const { messages, loading, error, send, clear } = useAIChat();
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
              Ask any Bible question. Answers draw exclusively from Watch Tower publications, the NWT, and wol.jw.org.
            </p>
            <div className="asb-suggestions">
              {SUGGESTED.map(s => (
                <button key={s} className="asb-suggestion" onClick={() => handleSuggestion(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
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
        onClick={() => setOpen(v => !v)}
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
