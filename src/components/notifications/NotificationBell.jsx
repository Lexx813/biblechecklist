import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNotifications, useMarkNotificationsRead, useDeleteNotification, useClearAllNotifications } from "../../hooks/useNotifications";
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
  const markRead   = useMarkNotificationsRead(userId);
  const deleteOne  = useDeleteNotification(userId);
  const clearAll   = useClearAllNotifications(userId);

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

  function extractConvId(h) {
    if (!h) return null;
    if (h.startsWith("messages/")) return h.slice(9);
    const m = h.match(/[?&]conv=([^&]+)/);
    return m ? m[1] : null;
  }

  function handleClick(n) {
    if (!n.read) markRead.mutate([n.id]);
    setOpen(false);

    const h = n.link_hash;

    // Messages — open the specific conversation
    if (n.type === "message") {
      const convId = extractConvId(h);
      navigate("messages", convId ? {
        conversationId: convId,
        otherDisplayName: n.actor?.display_name ?? null,
        otherAvatarUrl: n.actor?.avatar_url ?? null,
      } : {});
      return;
    }

    if (!h) return;

    if (h.startsWith("blog/")) {
      const slug = decodeURIComponent(h.slice(5));
      navigate("blog", { slug });
    } else if (h.startsWith("forum/")) {
      const parts = h.slice(6).split("/");
      navigate("forum", { categoryId: parts[0] || null, threadId: parts[1] || null });
    } else {
      navigate(h);
    }
  }

  function getVerb(n) {
    if (n.type === "reply") return t("notifications.typeReply");
    if (n.type === "comment") return t("notifications.typeComment");
    if (n.type === "message") return "sent you a message";
    return t("notifications.typeMention");
  }

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        className="page-nav-icon-btn notif-bell-btn"
        onClick={handleOpen}
        data-tip={t("notifications.title")}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        {unread.length > 0 && (
          <span className="notif-badge">{unread.length > 9 ? "9+" : unread.length}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-title">{t("notifications.title")}</span>
            <div className="notif-header-actions">
              {unread.length > 0 && (
                <button className="notif-mark-all" onClick={() => markRead.mutate("all")}>
                  {t("notifications.markAllRead")}
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  className="notif-clear-all"
                  onClick={() => clearAll.mutate()}
                  disabled={clearAll.isPending}
                >
                  {t("notifications.clearAll")}
                </button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <p className="notif-empty">{t("notifications.empty")}</p>
          ) : (
            <div className="notif-list">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item${n.read ? "" : " notif-item--unread"}`}
                >
                  <div className="notif-item-main" onClick={() => handleClick(n)}>
                    <div className="notif-actor-avatar">
                      {n.actor?.avatar_url
                        ? <img src={n.actor.avatar_url} alt="" width={32} height={32} loading="lazy" />
                        : (n.actor?.display_name || "?")[0].toUpperCase()
                      }
                    </div>
                    <div className="notif-body">
                      <span className="notif-actor">{n.actor?.display_name || "Someone"}</span>
                      {" "}<span className="notif-verb">{getVerb(n)}</span>
                      {n.body_preview && n.type !== "message" && (
                        <p className="notif-preview">"{n.body_preview}"</p>
                      )}
                      <span className="notif-time">{timeAgo(n.created_at)}</span>
                    </div>
                  </div>
                  <button
                    className="notif-delete-btn"
                    onClick={(e) => { e.stopPropagation(); deleteOne.mutate(n.id); }}
                    title={t("notifications.delete")}
                    aria-label={t("notifications.delete")}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
