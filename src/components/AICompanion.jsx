import { useState, useRef, useEffect, useCallback } from "react";
import { useAICompanion } from "../hooks/useAICompanion";
import "../styles/ai-companion.css";

const SUGGESTED_PROMPTS = [
  "Explain this passage",
  "Historical context",
  "Original language insights",
  "How to apply this today",
  "Cross-references",
];

/**
 * AI Study Companion panel.
 *
 * Props:
 *   passage   {string}  — The scripture text or reference currently being studied (optional)
 *   reference {string}  — Book/chapter/verse label, e.g. "John 3:16" (optional)
 *   className {string}  — Extra class names (optional)
 */
export default function AICompanion({ passage = "", reference = "", className = "" }) {
  const { text, loading, error, ask, reset } = useAICompanion();
  const [question, setQuestion] = useState("");
  const textareaRef = useRef(null);
  const responseRef = useRef(null);

  // Auto-scroll response area as text streams in
  useEffect(() => {
    if (responseRef.current && text) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [text]);

  const submit = useCallback(() => {
    const q = question.trim();
    if (!q || loading) return;
    const p = passage || reference || "the selected passage";
    ask(p, q);
    setQuestion("");
  }, [question, loading, passage, reference, ask]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handlePrompt = (prompt) => {
    if (loading) return;
    const p = passage || reference || "the selected passage";
    ask(p, prompt);
    setQuestion("");
  };

  const handleReset = () => {
    reset();
    setQuestion("");
    textareaRef.current?.focus();
  };

  const hasContent = text || error;

  return (
    <div className={`aic-panel${className ? ` ${className}` : ""}`}>
      {/* Header */}
      <div className="aic-header">
        <div className="aic-header-left">
          <span className="aic-icon">✨</span>
          <div>
            <div className="aic-title">AI Study Companion</div>
            <div className="aic-subtitle">Powered by Claude</div>
          </div>
        </div>
        {hasContent && (
          <button className="aic-reset-btn" onClick={handleReset} title="Clear">
            Clear
          </button>
        )}
      </div>

      {/* Passage context */}
      {(reference || passage) && (
        <div className="aic-passage">
          {reference && <div className="aic-passage-label">{reference}</div>}
          {passage && (
            <div className="aic-passage-text">
              {passage.length > 200 ? passage.slice(0, 200) + "…" : passage}
            </div>
          )}
        </div>
      )}

      {/* Suggested prompts */}
      <div className="aic-prompts">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            className="aic-prompt-btn"
            onClick={() => handlePrompt(p)}
            disabled={loading}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Question input */}
      <div className="aic-input-row">
        <textarea
          ref={textareaRef}
          className="aic-textarea"
          placeholder="Ask anything about this passage…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={300}
          rows={1}
          disabled={loading}
        />
        <button
          className="aic-send-btn"
          onClick={submit}
          disabled={!question.trim() || loading}
          title="Ask"
        >
          ➤
        </button>
      </div>

      {/* Response */}
      <div className="aic-response" ref={responseRef}>
        {loading && !text && (
          <div className="aic-loading">
            <div className="aic-dot" />
            <div className="aic-dot" />
            <div className="aic-dot" />
            <span style={{ marginLeft: 6 }}>Thinking…</span>
          </div>
        )}

        {error && <div className="aic-error">{error}</div>}

        {text && (
          <div className="aic-response-text">
            {text}
            {loading && <span className="aic-cursor" />}
          </div>
        )}

        {!loading && !text && !error && (
          <div className="aic-response-empty">
            Ask a question or tap a prompt above to get started.
          </div>
        )}
      </div>
    </div>
  );
}
