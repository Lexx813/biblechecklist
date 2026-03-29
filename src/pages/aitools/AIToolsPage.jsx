import { useState, useRef, useEffect } from "react";
import PageNav from "../../components/PageNav";
import { useAISkill } from "../../hooks/useAISkill";
import "../../styles/ai-tools.css";

// ── Shared streaming result display ───────────────────────────────────────────

function SkillResult({ text, loading, error, onClear }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && text) ref.current.scrollTop = ref.current.scrollHeight;
  }, [text]);

  if (!loading && !text && !error) return null;

  return (
    <div className="ait-result">
      <div className="ait-result-header">
        <span className="ait-result-label">AI Response</span>
        {!loading && (text || error) && (
          <button className="ait-result-clear" onClick={onClear}>Clear</button>
        )}
      </div>
      <div className="ait-result-body" ref={ref}>
        {loading && !text && (
          <div className="ait-loading">
            <span className="ait-dot" /><span className="ait-dot" /><span className="ait-dot" />
            <span className="ait-loading-label">Thinking…</span>
          </div>
        )}
        {error && <div className="ait-error">{error}</div>}
        {text && (
          <div className="ait-response-text">
            {text}
            {loading && <span className="ait-cursor" />}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Prayer Composer ───────────────────────────────────────────────────────────

function PrayerTab() {
  const { text, loading, error, run, reset } = useAISkill();
  const [situation, setSituation] = useState("");
  const [scriptures, setScriptures] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!situation.trim() || loading) return;
    run("prayer", { situation: situation.trim(), scriptures: scriptures.trim() || undefined });
  }

  return (
    <div className="ait-tab-content">
      <div className="ait-tab-desc">
        Share your situation or concern and receive a heartfelt, scripturally-grounded prayer.
      </div>
      <form className="ait-form" onSubmit={submit}>
        <label className="ait-label">Your situation or concern <span className="ait-required">*</span></label>
        <textarea
          className="ait-textarea"
          placeholder="e.g. I'm struggling with anxiety about the future and need Jehovah's guidance…"
          value={situation}
          onChange={e => setSituation(e.target.value)}
          maxLength={600}
          rows={4}
          disabled={loading}
        />
        <div className="ait-char-count">{situation.length}/600</div>

        <label className="ait-label">Scriptures in mind <span className="ait-optional">(optional)</span></label>
        <input
          type="text"
          className="ait-input"
          placeholder="e.g. Philippians 4:6, 7; Psalm 55:22"
          value={scriptures}
          onChange={e => setScriptures(e.target.value)}
          maxLength={200}
          disabled={loading}
        />

        <button className="ait-submit-btn" disabled={!situation.trim() || loading}>
          {loading ? "Composing…" : "✦ Compose Prayer"}
        </button>
      </form>
      <SkillResult text={text} loading={loading} error={error} onClear={reset} />
    </div>
  );
}

// ── Character Study ───────────────────────────────────────────────────────────

function CharacterTab() {
  const { text, loading, error, run, reset } = useAISkill();
  const [character, setCharacter] = useState("");

  const EXAMPLES = ["Moses", "Esther", "Job", "Mary", "Daniel", "Ruth", "Elijah"];

  function submit(e) {
    e.preventDefault();
    if (!character.trim() || loading) return;
    run("character", { character: character.trim() });
  }

  return (
    <div className="ait-tab-content">
      <div className="ait-tab-desc">
        Get a comprehensive Bible character study including life history, key scriptures, and practical lessons.
      </div>
      <form className="ait-form" onSubmit={submit}>
        <label className="ait-label">Bible character name <span className="ait-required">*</span></label>
        <input
          type="text"
          className="ait-input"
          placeholder="e.g. Moses"
          value={character}
          onChange={e => setCharacter(e.target.value)}
          maxLength={100}
          disabled={loading}
        />
        <div className="ait-examples">
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              type="button"
              className="ait-example-chip"
              onClick={() => setCharacter(ex)}
              disabled={loading}
            >
              {ex}
            </button>
          ))}
        </div>

        <button className="ait-submit-btn" disabled={!character.trim() || loading}>
          {loading ? "Studying…" : "✦ Study Character"}
        </button>
      </form>
      <SkillResult text={text} loading={loading} error={error} onClear={reset} />
    </div>
  );
}

// ── Verse Memorization ────────────────────────────────────────────────────────

function MemorizeTab() {
  const { text, loading, error, run, reset } = useAISkill();
  const [verse, setVerse] = useState("");
  const [reference, setReference] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!verse.trim() || !reference.trim() || loading) return;
    run("memorize", { verse: verse.trim(), reference: reference.trim() });
  }

  return (
    <div className="ait-tab-content">
      <div className="ait-tab-desc">
        Get memory hooks, word meanings, mental images, and related scriptures to help you memorize any verse.
      </div>
      <form className="ait-form" onSubmit={submit}>
        <label className="ait-label">Scripture verse <span className="ait-required">*</span></label>
        <textarea
          className="ait-textarea"
          placeholder="e.g. Do not be anxious over anything, but in everything by prayer and supplication…"
          value={verse}
          onChange={e => setVerse(e.target.value)}
          maxLength={300}
          rows={3}
          disabled={loading}
        />

        <label className="ait-label">Reference <span className="ait-required">*</span></label>
        <input
          type="text"
          className="ait-input"
          placeholder="e.g. Philippians 4:6"
          value={reference}
          onChange={e => setReference(e.target.value)}
          maxLength={50}
          disabled={loading}
        />

        <button className="ait-submit-btn" disabled={!verse.trim() || !reference.trim() || loading}>
          {loading ? "Preparing…" : "✦ Help Me Memorize"}
        </button>
      </form>
      <SkillResult text={text} loading={loading} error={error} onClear={reset} />
    </div>
  );
}

// ── Cross-reference Finder ────────────────────────────────────────────────────

function CrossReferenceTab() {
  const { text, loading, error, run, reset } = useAISkill();
  const [verse, setVerse] = useState("");
  const [reference, setReference] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!verse.trim() || !reference.trim() || loading) return;
    run("cross_reference", { verse: verse.trim(), reference: reference.trim() });
  }

  return (
    <div className="ait-tab-content">
      <div className="ait-tab-desc">
        Find 5–7 closely related scriptures that reinforce the same principle, theme, or original-language term.
      </div>
      <form className="ait-form" onSubmit={submit}>
        <label className="ait-label">Scripture verse <span className="ait-required">*</span></label>
        <textarea
          className="ait-textarea"
          placeholder="e.g. For God loved the world so much that he gave his only-begotten Son…"
          value={verse}
          onChange={e => setVerse(e.target.value)}
          maxLength={300}
          rows={3}
          disabled={loading}
        />

        <label className="ait-label">Reference <span className="ait-required">*</span></label>
        <input
          type="text"
          className="ait-input"
          placeholder="e.g. John 3:16"
          value={reference}
          onChange={e => setReference(e.target.value)}
          maxLength={50}
          disabled={loading}
        />

        <button className="ait-submit-btn" disabled={!verse.trim() || !reference.trim() || loading}>
          {loading ? "Searching…" : "✦ Find Cross-References"}
        </button>
      </form>
      <SkillResult text={text} loading={loading} error={error} onClear={reset} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "prayer",        label: "🙏 Prayer",        component: PrayerTab },
  { id: "character",     label: "📜 Characters",     component: CharacterTab },
  { id: "memorize",      label: "🧠 Memorize",       component: MemorizeTab },
  { id: "crossref",      label: "🔗 Cross-References", component: CrossReferenceTab },
];

export default function AIToolsPage({ navigate, ...navProps }) {
  const [activeTab, setActiveTab] = useState("prayer");
  const ActiveComp = TABS.find(t => t.id === activeTab)?.component ?? PrayerTab;

  return (
    <>
      <PageNav navigate={navigate} {...navProps} currentPage="aiTools" />
      <div className="ait-page">
        <div className="ait-hero">
          <div className="ait-hero-icon">✨</div>
          <h1 className="ait-hero-title">AI Bible Study Tools</h1>
          <p className="ait-hero-subtitle">
            Powered by Claude — grounded in Watch Tower teachings and the New World Translation.
          </p>
        </div>

        <div className="ait-container">
          {/* Tab bar */}
          <div className="ait-tabs" role="tablist">
            {TABS.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`ait-tab${activeTab === tab.id ? " ait-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="ait-tab-panel" role="tabpanel">
            <ActiveComp />
          </div>
        </div>
      </div>
    </>
  );
}
