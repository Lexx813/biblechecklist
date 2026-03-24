import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNotifications, useMarkNotificationsRead } from "../../hooks/useNotifications";
import "../../styles/notifications.css";

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

export default function NotificationBell({ userId, navigate }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { data: notifications = [] } = useNotifications(userId);
  const markRead = useMarkNotificationsRead(userId);

  const unread = notifications.filter(n => !n.read);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleOpen() {
    setOpen(o => !o);
  }

  function handleClick(n) {
    if (!n.read) markRead.mutate([n.id]);
    setOpen(false);
    if (n.link_hash) {
      window.location.hash = n.link_hash;
    }
  }

  function getVerb(n) {
    if (n.type === "reply") return t("notifications.typeReply");
    if (n.type === "comment") return t("notifications.typeComment");
    return t("notifications.typeMention");
  }

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        className="page-nav-icon-btn notif-bell-btn"
        onClick={handleOpen}
        title={t("notifications.title")}
      >
        🔔
        {unread.length > 0 && (
          <span className="notif-badge">{unread.length > 9 ? "9+" : unread.length}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-title">{t("notifications.title")}</span>
            {unread.length > 0 && (
              <button className="notif-mark-all" onClick={() => markRead.mutate("all")}>
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="notif-empty">{t("notifications.empty")}</p>
          ) : (
            <div className="notif-list">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item${n.read ? "" : " notif-item--unread"}`}
                  onClick={() => handleClick(n)}
                >
                  <div className="notif-actor-avatar">
                    {n.actor?.avatar_url
                      ? <img src={n.actor.avatar_url} alt="" />
                      : (n.actor?.display_name || "?")[0].toUpperCase()
                    }
                  </div>
                  <div className="notif-body">
                    <span className="notif-actor">{n.actor?.display_name || "Someone"}</span>
                    {" "}<span className="notif-verb">{getVerb(n)}</span>
                    {n.body_preview && (
                      <p className="notif-preview">"{n.body_preview}"</p>
                    )}
                    <span className="notif-time">{timeAgo(n.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
