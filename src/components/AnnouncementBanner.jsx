import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useActiveAnnouncements } from "../hooks/useAnnouncements";

const DURATION = 5000; // ms to show each announcement

const INFO_ICON    = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const WARN_ICON    = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const SUCCESS_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;

const TYPE_STYLES = {
  info:    { bg: "rgba(14,165,233,0.14)",  border: "#0EA5E9", icon: INFO_ICON },
  warning: { bg: "rgba(234,179,8,0.14)",   border: "#EAB308", icon: WARN_ICON },
  success: { bg: "rgba(34,197,94,0.14)",   border: "#22C55E", icon: SUCCESS_ICON },
};

function AnnouncementToast({ announcement, onDone }) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);
  const s = TYPE_STYLES[announcement.type] ?? TYPE_STYLES.info;

  useEffect(() => {
    timerRef.current = setTimeout(() => setVisible(false), DURATION);
    return () => clearTimeout(timerRef.current);
  }, []);

  // After slide-out animation ends, notify parent
  function handleAnimEnd(e) {
    if (e.animationName === "ann-slide-out") onDone();
  }

  return (
    <div
      className={`ann-toast${visible ? " ann-toast--in" : " ann-toast--out"}`}
      style={{ background: s.bg, borderColor: s.border }}
      onAnimationEnd={handleAnimEnd}
    >
      <span className="ann-toast-icon">{s.icon}</span>
      <span className="ann-toast-msg">{announcement.message}</span>
      <button
        className="ann-toast-close"
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
      ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      <div className="ann-toast-bar" style={{ borderColor: s.border }}>
        <div className="ann-toast-bar-fill" style={{ background: s.border }} />
      </div>
    </div>
  );
}

export default function AnnouncementBanner() {
  const { data: announcements = [] } = useActiveAnnouncements();
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("dismissed-announcements") || "[]"); }
    catch { return []; }
  });

  function dismiss(id) {
    const next = [...dismissed, id];
    setDismissed(next);
    sessionStorage.setItem("dismissed-announcements", JSON.stringify(next));
  }

  // Immediately dismiss all visible announcements on any route change
  useEffect(() => {
    function dismissAll() {
      const visible = announcements.filter(a => !dismissed.includes(a.id));
      if (!visible.length) return;
      const next = [...dismissed, ...visible.map(a => a.id)];
      setDismissed(next);
      sessionStorage.setItem("dismissed-announcements", JSON.stringify(next));
    }

    window.addEventListener("popstate", dismissAll);
    window.addEventListener("fc:open", dismissAll);
    document.addEventListener("click", dismissAll, { capture: true });

    // Also catch pushState-based navigation (navigate() calls)
    const origPush = history.pushState.bind(history);
    history.pushState = function (...args) {
      origPush(...args);
      dismissAll();
    };

    return () => {
      window.removeEventListener("popstate", dismissAll);
      window.removeEventListener("fc:open", dismissAll);
      document.removeEventListener("click", dismissAll, { capture: true });
      history.pushState = origPush;
    };
  }, [announcements, dismissed]);

  const visible = announcements.filter(a => !dismissed.includes(a.id));
  if (!visible.length) return null;

  return createPortal(
    <div className="ann-stack">
      {visible.map(a => (
        <AnnouncementToast key={a.id} announcement={a} onDone={() => dismiss(a.id)} />
      ))}
    </div>,
    document.body
  );
}
