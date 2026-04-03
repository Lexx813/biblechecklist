// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import "../styles/command-palette.css";

const NAV_PAGES = [
  { key: "home",         label: "Home",          bg: "#5b21b6", icon: "🏠" },
  { key: "forum",        label: "Forum",         bg: "#e05c2a", icon: "💬" },
  { key: "blog",         label: "Blog",          bg: "#c084fc", icon: "📚" },
  { key: "leaderboard",  label: "Leaderboard",   bg: "#f59e0b", icon: "📊" },
  { key: "studyNotes",   label: "Study Notes",   bg: "#2e9e6b", icon: "✏️" },
  { key: "readingPlans", label: "Reading Plans", bg: "#0ea5e9", icon: "📅" },
  { key: "quiz",         label: "Bible Quiz",    bg: "#374151", icon: "❓" },
  { key: "friends",      label: "Friends",       bg: "#1d7ea6", icon: "👥" },
  { key: "messages",     label: "Messages",      bg: "#7c3aed", icon: "✉️" },
  { key: "groups",       label: "Groups",        bg: "#5b21b6", icon: "👥" },
  { key: "meetingPrep",  label: "Meeting Prep",  bg: "#374151", icon: "📝" },
  { key: "familyQuiz",   label: "Family Quiz",   bg: "#7c3aed", icon: "👨‍👩‍👧" },
  { key: "aiTools",      label: "AI Tools",      bg: "#0ea5e9", icon: "🤖" },
  { key: "studyTopics",  label: "Study Topics",  bg: "#2e9e6b", icon: "📖" },
  { key: "settings",     label: "Settings",      bg: "#374151", icon: "⚙️" },
  { key: "search",       label: "Search",        bg: "#374151", icon: "🔍" },
];

interface Props {
  navigate: (page: string) => void;
  onClose: () => void;
}

export default function CommandPalette({ navigate, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = NAV_PAGES.filter(
    p => query === "" || p.label.toLowerCase().includes(query.toLowerCase())
  );

  // Reset active index when filter changes
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[activeIdx]) {
          navigate(filtered[activeIdx].key);
          onClose();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [filtered, activeIdx, navigate, onClose]);

  return (
    <div
      className="cmd-backdrop"
      onClick={onClose}
      role="dialog"
      aria-label="Command palette"
      aria-modal="true"
    >
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="cmd-input-row">
          <span className="cmd-search-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Go to a page…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            aria-label="Search pages"
          />
          <span className="cmd-kbd">ESC</span>
        </div>

        {/* Results */}
        <div className="cmd-list" role="listbox" aria-label="Pages">
          {filtered.length > 0 && (
            <div className="cmd-section-label">Pages</div>
          )}
          {filtered.map((item, i) => (
            <div
              key={item.key}
              className="cmd-item"
              data-active={i === activeIdx ? "true" : "false"}
              role="option"
              aria-selected={i === activeIdx}
              onClick={() => { navigate(item.key); onClose(); }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span className="cmd-item-icon" style={{ background: item.bg }} aria-hidden="true">
                {item.icon}
              </span>
              <span className="cmd-item-label">{item.label}</span>
              <span className="cmd-item-hint">↵ open</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="cmd-no-results">No results for "{query}"</div>
          )}
        </div>

        {/* Footer hints */}
        <div className="cmd-footer">
          <span className="cmd-hint"><kbd>↑↓</kbd> navigate</span>
          <span className="cmd-hint"><kbd>↵</kbd> open</span>
          <span className="cmd-hint"><kbd>ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
