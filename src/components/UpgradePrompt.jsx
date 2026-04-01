import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/upgrade-prompt.css";

const DISMISS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isDismissed(triggerKey) {
  try {
    const val = localStorage.getItem(`nwt-prompt-dismissed-${triggerKey}`);
    if (!val) return false;
    return Date.now() - parseInt(val, 10) < DISMISS_MS;
  } catch {
    return false;
  }
}

export function dismissPrompt(triggerKey) {
  try {
    localStorage.setItem(`nwt-prompt-dismissed-${triggerKey}`, String(Date.now()));
  } catch {
    // no-op
  }
}

export default function UpgradePrompt({ icon = "✦", title, message, ctaLabel, onCta, onDismiss }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onDismiss();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  if (!mounted) return null;

  return createPortal(
    <div className="up-overlay" role="dialog" aria-modal="true" onClick={onDismiss}>
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
