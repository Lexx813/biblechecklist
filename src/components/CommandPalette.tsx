// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import "../styles/command-palette.css";

const NAV_PAGES = [
  { key: "home",         label: "Home",          bg: "#5b21b6", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></> },
  { key: "forum",        label: "Forum",         bg: "#e05c2a", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></> },
  { key: "blog",         label: "Blog",          bg: "#c084fc", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></> },
  { key: "leaderboard",  label: "Leaderboard",   bg: "#f59e0b", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 17v4m4-8v8m4-12v12M2 20h20"/></svg></> },
  { key: "studyNotes",   label: "Study Notes",   bg: "#2e9e6b", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg></> },
  { key: "readingPlans", label: "Reading Plans", bg: "#0ea5e9", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></> },
  { key: "quiz",         label: "Bible Quiz",    bg: "#374151", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></> },
  { key: "friends",      label: "Friends",       bg: "#1d7ea6", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></> },
  { key: "messages",     label: "Messages",      bg: "#7c3aed", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></> },
  { key: "groups",       label: "Groups",        bg: "#5b21b6", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></> },
  { key: "meetingPrep",  label: "Meeting Prep",  bg: "#374151", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></> },
  { key: "familyQuiz",   label: "Family Quiz",   bg: "#7c3aed", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></> },
  { key: "aiTools",      label: "AI Tools",      bg: "#0ea5e9", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M12 16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z"/><path d="M4 10a2 2 0 0 0-2 2 2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 2 2 0 0 0-2-2H4z"/><path d="M16 10a2 2 0 0 0-2 2 2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-2z"/></svg></> },
  { key: "studyTopics",  label: "Study Topics",  bg: "#2e9e6b", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></> },
  { key: "settings",     label: "Settings",      bg: "#374151", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></> },
  { key: "search",       label: "Search",        bg: "#374151", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></> },
];

const ADMIN_PAGE = { key: "admin", label: "Admin", bg: "#dc2626", icon: <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></> };

interface Props {
  navigate: (page: string) => void;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function CommandPalette({ navigate, onClose, isAdmin }: Props) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allPages = isAdmin ? [...NAV_PAGES, ADMIN_PAGE] : NAV_PAGES;
  const filtered = allPages.filter(
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
          <button className="cmd-kbd cmd-kbd--btn" onClick={onClose} aria-label="Close" type="button">ESC</button>
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
