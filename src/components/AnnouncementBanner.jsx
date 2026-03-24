import { useState } from "react";
import { useActiveAnnouncements } from "../hooks/useAnnouncements";

const TYPE_STYLES = {
  info:    { bg: "rgba(14,165,233,0.12)", border: "#0EA5E9", icon: "📢" },
  warning: { bg: "rgba(234,179,8,0.12)",  border: "#EAB308", icon: "⚠️" },
  success: { bg: "rgba(34,197,94,0.12)",  border: "#22C55E", icon: "✅" },
};

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

  return (
    <div className="announcements-wrap">
      {visible.map(a => {
        const s = TYPE_STYLES[a.type] ?? TYPE_STYLES.info;
        return (
          <div key={a.id} className="announcement-banner" style={{ background: s.bg, borderColor: s.border }}>
            <span className="announcement-icon">{s.icon}</span>
            <span className="announcement-msg">{a.message}</span>
            <button className="announcement-dismiss" onClick={() => dismiss(a.id)} aria-label="Dismiss">✕</button>
          </div>
        );
      })}
    </div>
  );
}
