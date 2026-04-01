import { useRef } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "../hooks/useClickOutside";
import "../styles/welcome-premium.css";

const ICONS = {
  bolt: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  calendar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  edit: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>,
  chat: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};
const FEATURES = [
  { icon: ICONS.bolt, label: "AI Study Companion", page: null, desc: "Available on the daily verse, quiz, reading plans, and study notes" },
  { icon: ICONS.calendar, label: "Reading Plans", page: "readingPlans", desc: "Start a structured journey through any book" },
  { icon: ICONS.edit, label: "Study Notes", page: "studyNotes", desc: "Take rich-text notes tied to any passage" },
  { icon: ICONS.chat, label: "Direct Messages", page: "messages", desc: "Message other members privately" },
  { icon: ICONS.users, label: "Study Groups", page: "groups", desc: "Learn together with group chat and progress tracking" },
];

export default function WelcomePremiumModal({ onClose, navigate }) {
  const ref = useRef(null);
  useClickOutside(ref, true, onClose);

  function go(page) {
    onClose();
    if (page) navigate(page);
  }

  return createPortal(
    <div className="wpm-overlay" role="dialog" aria-modal="true" aria-labelledby="wpm-title">
      <div className="wpm-modal" ref={ref}>
        <div className="wpm-header">
          <div className="wpm-confetti" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6z"/></svg> <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6z"/></svg> <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6z"/></svg></div>
          <div className="wpm-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6z"/></svg> Welcome to Premium</div>
          <h2 className="wpm-title" id="wpm-title">You're all set!</h2>
          <p className="wpm-subtitle">All premium features are now unlocked. Here's what you can explore:</p>
          <button className="wpm-close" onClick={onClose} aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>

        <ul className="wpm-features">
          {FEATURES.map(f => (
            <li
              key={f.label}
              className={`wpm-feature${f.page ? " wpm-feature--clickable" : ""}`}
              onClick={() => go(f.page)}
              role={f.page ? "button" : undefined}
              tabIndex={f.page ? 0 : undefined}
              onKeyDown={f.page ? (e) => { if (e.key === "Enter") go(f.page); } : undefined}
            >
              <span className="wpm-feature-icon">{f.icon}</span>
              <div className="wpm-feature-body">
                <span className="wpm-feature-label">{f.label}</span>
                <span className="wpm-feature-desc">{f.desc}</span>
              </div>
              {f.page && <span className="wpm-feature-arrow">›</span>}
            </li>
          ))}
        </ul>

        <div className="wpm-footer">
          <button className="wpm-cta" onClick={onClose}>Start exploring →</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
