import { useRef } from "react";
import { createPortal } from "react-dom";
import { useClickOutside } from "../hooks/useClickOutside";
import "../styles/upgrade-modal.css";

const FEATURES = [
  { icon: "✨", label: "AI Study Companion", desc: "Ask Claude anything about any verse, quiz question, or passage" },
  { icon: "📅", label: "Reading Plans", desc: "Structured multi-week plans through any book" },
  { icon: "📝", label: "Study Notes", desc: "Rich-text notes tied to any passage or chapter" },
  { icon: "💬", label: "Direct Messages", desc: "Private, encrypted conversations with other members" },
  { icon: "👥", label: "Study Groups", desc: "Group chat and shared progress tracking" },
];

export default function UpgradeModal({ onClose, onSubscribe, loading }) {
  const ref = useRef(null);
  useClickOutside(ref, true, onClose);

  return createPortal(
    <div className="upm-overlay" role="dialog" aria-modal="true" aria-labelledby="upm-title">
      <div className="upm-modal" ref={ref}>
        {/* Header */}
        <div className="upm-header">
          <div className="upm-badge">✦ Premium</div>
          <h2 className="upm-title" id="upm-title">Unlock the full experience</h2>
          <p className="upm-price">
            <span className="upm-amount">$3</span>
            <span className="upm-period">&nbsp;/ month</span>
          </p>
          <button className="upm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Feature list */}
        <ul className="upm-features">
          {FEATURES.map(f => (
            <li key={f.label} className="upm-feature">
              <span className="upm-feature-icon">{f.icon}</span>
              <div>
                <span className="upm-feature-label">{f.label}</span>
                <span className="upm-feature-desc">{f.desc}</span>
              </div>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="upm-footer">
          <button
            className="upm-cta"
            onClick={onSubscribe}
            disabled={loading}
          >
            {loading ? "Redirecting…" : "Subscribe with Stripe →"}
          </button>
          <p className="upm-note">No commitment · Cancel anytime · Secure payment via Stripe</p>
          <button className="upm-cancel" onClick={onClose}>Maybe later</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
