import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useActiveAnnouncements } from "../hooks/useAnnouncements";

const DURATION = 5000; // ms to show each announcement

const TYPE_STYLES = {
  info:    { bg: "rgba(14,165,233,0.14)",  border: "#0EA5E9", icon: "📢" },
  warning: { bg: "rgba(234,179,8,0.14)",   border: "#EAB308", icon: "⚠️" },
  success: { bg: "rgba(34,197,94,0.14)",   border: "#22C55E", icon: "✅" },
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
      >✕</button>
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
