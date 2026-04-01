import { useRef } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "../hooks/useClickOutside";
import { useSubscription } from "../hooks/useSubscription";
import { trackUpgradePromptView, trackUpgradePromptClick } from "../lib/analytics";
import { useEffect } from "react";
import "../styles/upgrade-prompt.css";

const FEATURE_ICONS = {
  readingPlans: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  studyNotes: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  messages: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  groups: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  ai: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
};

const FEATURE_INFO = {
  readingPlans: {
    icon: FEATURE_ICONS.readingPlans,
    title: "Give your reading a plan",
    desc: "You're already building a streak — structured plans keep that momentum going. Multi-week guides through any Bible book, with daily goals and catch-up mode.",
  },
  studyNotes: {
    icon: FEATURE_ICONS.studyNotes,
    title: "Your insights deserve to be saved",
    desc: "Don't lose what you've learned. Rich notes tied to any passage or chapter, organized with folders and tags, exportable as PDF.",
  },
  messages: {
    icon: FEATURE_ICONS.messages,
    title: "Unlock Direct Messages",
    desc: "Start private conversations with other members. Share verses, images, and study insights.",
  },
  groups: {
    icon: FEATURE_ICONS.groups,
    title: "Join readers who are growing faster",
    desc: "Brothers and sisters in study groups read more consistently and finish more books. Create or join a group with shared progress and leaderboards.",
  },
  ai: {
    icon: FEATURE_ICONS.ai,
    title: "Unlock AI Study Companion",
    desc: "Ask Claude anything about any verse, passage, or quiz question. Get contextual study insights.",
  },
};

export default function UpgradePrompt({ feature, onClose, userId }) {
  const ref = useRef(null);
  useClickOutside(ref, true, onClose);
  const { subscribe } = useSubscription(userId);
  const info = FEATURE_INFO[feature] ?? FEATURE_INFO.readingPlans;

  useEffect(() => {
    trackUpgradePromptView(feature);
  }, [feature]);

  function handleUpgrade() {
    trackUpgradePromptClick(feature);
    subscribe.mutate();
  }

  return createPortal(
    <div className="up-overlay" role="dialog" aria-modal="true">
      <div className="up-modal" ref={ref}>
        <button className="up-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div className="up-icon">{info.icon}</div>
        <h2 className="up-title">{info.title}</h2>
        <p className="up-desc">{info.desc}</p>

        <div className="up-price">
          <span className="up-price-amount">$3</span>
          <span className="up-price-period">/ month</span>
        </div>
        <p className="up-price-note">7-day free trial · Cancel anytime</p>

        <button className="up-cta" onClick={handleUpgrade} disabled={subscribe.isPending}>
          {subscribe.isPending ? "Redirecting..." : "Start Free Trial →"}
        </button>
        <button className="up-skip" onClick={onClose}>Not right now</button>
      </div>
    </div>,
    document.body
  );
}
