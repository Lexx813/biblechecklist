import { createPortal } from "react-dom";
import "../styles/upgrade-prompt.css";

const DISMISS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isDismissed(triggerKey) {
  const val = localStorage.getItem(`nwt-prompt-dismissed-${triggerKey}`);
  if (!val) return false;
  return Date.now() - parseInt(val, 10) < DISMISS_MS;
}

export function dismissPrompt(triggerKey) {
  localStorage.setItem(`nwt-prompt-dismissed-${triggerKey}`, String(Date.now()));
}

export default function UpgradePrompt({ icon = "✦", title, message, ctaLabel, onCta, onDismiss }) {
  return createPortal(
    <div className="up-overlay" onClick={onDismiss}>
      <div className="up-card" onClick={e => e.stopPropagation()}>
        <div className="up-icon">{icon}</div>
        <h3 className="up-title">{title}</h3>
        <p className="up-message">{message}</p>
        <div className="up-actions">
          <button className="up-cta" onClick={onCta}>{ctaLabel}</button>
          <button className="up-dismiss" onClick={onDismiss}>Not now</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
