import { useRef } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "../hooks/useClickOutside";
import "../styles/welcome-premium.css";

const FEATURES = [
  { icon: "✨", label: "AI Study Companion", page: null, desc: "Available on the daily verse, quiz, reading plans, and study notes" },
  { icon: "📅", label: "Reading Plans", page: "readingPlans", desc: "Start a structured journey through any book" },
  { icon: "📝", label: "Study Notes", page: "studyNotes", desc: "Take rich-text notes tied to any passage" },
  { icon: "💬", label: "Direct Messages", page: "messages", desc: "Message other members privately" },
  { icon: "👥", label: "Study Groups", page: "groups", desc: "Learn together with group chat and progress tracking" },
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
          <div className="wpm-confetti" aria-hidden="true">✦ ✦ ✦</div>
          <div className="wpm-badge">✦ Welcome to Premium</div>
          <h2 className="wpm-title" id="wpm-title">You're all set! 🎉</h2>
          <p className="wpm-subtitle">All premium features are now unlocked. Here's what you can explore:</p>
          <button className="wpm-close" onClick={onClose} aria-label="Close">✕</button>
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
