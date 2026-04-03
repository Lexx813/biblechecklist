import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "../styles/upgrade-prompt.css";

const DISMISS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isDismissed(triggerKey: string) {
  try {
    const val = localStorage.getItem(`nwt-prompt-dismissed-${triggerKey}`);
    if (!val) return false;
    return Date.now() - parseInt(val, 10) < DISMISS_MS;
  } catch {
    return false;
  }
}

export function dismissPrompt(triggerKey: string) {
  try {
    localStorage.setItem(`nwt-prompt-dismissed-${triggerKey}`, String(Date.now()));
  } catch {
    // no-op
  }
}

interface Props {
  icon?: ReactNode;
  title: string;
  message: string;
  ctaLabel: string;
  onCta: () => void;
  onDismiss: () => void;
}

const DefaultIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
);

export default function UpgradePrompt({ icon = <DefaultIcon />, title, message, ctaLabel, onCta, onDismiss }: Props) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  if (!mounted) return null;

  return createPortal(
    <div className="up-overlay" role="dialog" aria-modal="true" aria-labelledby="up-title" onClick={onDismiss}>
      <div className="up-card" onClick={e => e.stopPropagation()}>
        <div className="up-icon">{icon}</div>
        <h3 className="up-title" id="up-title">{title}</h3>
        <p className="up-message">{message}</p>
        <div className="up-actions">
          <button className="up-cta" onClick={onCta}>{ctaLabel}</button>
          <button className="up-dismiss" onClick={onDismiss}>{t("common.notNow")}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
