import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useActiveAnnouncements } from "../hooks/useAnnouncements";

const INFO_DURATION = 10000;

const INFO_ICON    = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const WARN_ICON    = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const SUCCESS_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
  info:    { bg: "rgba(14,165,233,0.14)",  border: "#0EA5E9", icon: INFO_ICON },
  warning: { bg: "rgba(234,179,8,0.14)",   border: "#EAB308", icon: WARN_ICON },
  success: { bg: "rgba(34,197,94,0.14)",   border: "#22C55E", icon: SUCCESS_ICON },
};

interface Announcement { id: string; message: string; type: string; }
interface ToastProps { announcement: Announcement; onDone: () => void; }

// ── Info toast, auto-dismisses after 10 s or any page interaction ──
function InfoToast({ announcement, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const s = TYPE_STYLES.info;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), INFO_DURATION);

    // Any click or touch outside this toast dismisses it
    function onInteract(e: Event) {
      setVisible(false);
    }
    document.addEventListener("click",      onInteract, { capture: true, once: true });
    document.addEventListener("touchstart", onInteract, { capture: true, once: true });

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click",      onInteract, { capture: true });
      document.removeEventListener("touchstart", onInteract, { capture: true });
    };
  }, []);

  function handleAnimEnd(e: React.AnimationEvent) {
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
      <button className="ann-toast-close" onClick={(e) => { e.stopPropagation(); setVisible(false); }} aria-label="Dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div className="ann-toast-bar" style={{ borderColor: s.border }}>
        <div className="ann-toast-bar-fill" style={{ background: s.border }} />
      </div>
    </div>
  );
}

// ── Persistent toast, only dismisses via X button ──────────────────
function PersistentToast({ announcement, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const s = TYPE_STYLES[announcement.type] ?? TYPE_STYLES.warning;

  function handleAnimEnd(e: React.AnimationEvent) {
    if (e.animationName === "ann-slide-out") onDone();
  }

  return (
    <div
      className={`ann-toast ann-toast--in${!visible ? " ann-toast--out" : ""}`}
      style={{ background: s.bg, borderColor: s.border }}
      onAnimationEnd={handleAnimEnd}
    >
      <span className="ann-toast-icon">{s.icon}</span>
      <span className="ann-toast-msg">{announcement.message}</span>
      <button className="ann-toast-close" onClick={() => setVisible(false)} aria-label="Dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

export default function AnnouncementBanner() {
  const { data: announcements = [] } = useActiveAnnouncements();

  // Info dismissals: cleared on navigation
  const [dismissedInfo, setDismissedInfo] = useState<string[]>(() => {
    try { return JSON.parse(sessionStorage.getItem("dismissed-ann-info") || "[]"); }
    catch { return []; }
  });

  // Persistent dismissals: survive navigation, only cleared by X
  const [dismissedPersistent, setDismissedPersistent] = useState<string[]>(() => {
    try { return JSON.parse(sessionStorage.getItem("dismissed-ann-persistent") || "[]"); }
    catch { return []; }
  });

  function dismissInfo(id: string) {
    const next = [...dismissedInfo, id];
    setDismissedInfo(next);
    sessionStorage.setItem("dismissed-ann-info", JSON.stringify(next));
  }

  function dismissPersistent(id: string) {
    const next = [...dismissedPersistent, id];
    setDismissedPersistent(next);
    sessionStorage.setItem("dismissed-ann-persistent", JSON.stringify(next));
  }

  // On navigation: only dismiss info announcements
  useEffect(() => {
    function dismissInfoOnNav() {
      const visibleInfos = announcements.filter(a => a.type === "info" && !dismissedInfo.includes(a.id));
      if (!visibleInfos.length) return;
      const next = [...dismissedInfo, ...visibleInfos.map(a => a.id)];
      setDismissedInfo(next);
      sessionStorage.setItem("dismissed-ann-info", JSON.stringify(next));
    }

    window.addEventListener("popstate", dismissInfoOnNav);
    const origPush = history.pushState.bind(history);
    history.pushState = function (...args) { origPush(...args); dismissInfoOnNav(); };

    return () => {
      window.removeEventListener("popstate", dismissInfoOnNav);
      history.pushState = origPush;
    };
  }, [announcements, dismissedInfo]);

  const visibleInfo       = announcements.filter(a => a.type === "info"    && !dismissedInfo.includes(a.id));
  const visiblePersistent = announcements.filter(a => a.type !== "info"    && !dismissedPersistent.includes(a.id));

  if (!visibleInfo.length && !visiblePersistent.length) return null;

  return createPortal(
    <div className="ann-stack" aria-live="polite">
      {visiblePersistent.map(a => (
        <PersistentToast key={a.id} announcement={a} onDone={() => dismissPersistent(a.id)} />
      ))}
      {visibleInfo.map(a => (
        <InfoToast key={a.id} announcement={a} onDone={() => dismissInfo(a.id)} />
      ))}
    </div>,
    document.body
  );
}
