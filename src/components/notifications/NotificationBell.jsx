import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  const [dropStyle, setDropStyle] = useState({});
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const dropRef = useRef(null);
  const { data: notifications = [] } = useNotifications(userId);
  const markRead   = useMarkNotificationsRead(userId);
  const deleteOne  = useDeleteNotification(userId);
  const clearAll   = useClearAllNotifications(userId);

  const unread = notifications.filter(n => !n.read);

  // Close on outside click — must check both the wrap AND the portal dropdown
  useEffect(() => {
    function handler(e) {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        dropRef.current && !dropRef.current.contains(e.target)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Position dropdown relative to viewport using getBoundingClientRect so
  // parent transforms (common in animated headers) don't affect placement.
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const pad = 8;
    if (vw < 520) {
      // Full-width sheet on small screens
      setDropStyle({
        top: rect.bottom + 6,
        left: pad,
        right: pad,
        width: "auto",
        maxHeight: "70vh",
      });
    } else {
      // Align right edge with bell, clamp so it never overflows left
      const rightFromEdge = vw - rect.right;
      setDropStyle({
        top: rect.bottom + 8,
        right: Math.max(rightFromEdge, pad),
      });
    }
  }, [open]);

  function handleOpen() {
    setOpen(o => !o);
  }

  function handleClick(n) {
    if (!n.read) markRead.mutate([n.id]);
    setOpen(false);
    if (!n.link_hash) return;

    const h = n.link_hash;
    if (h.startsWith("blog/")) {
      const slug = decodeURIComponent(h.slice(5));
      navigate("blog", { slug });
      setTimeout(() => {
        document.querySelector(".blog-comments")?.scrollIntoView({ behavior: "smooth" });
      }, 600);
    } else if (h.startsWith("forum/")) {
      const parts = h.slice(6).split("/");
      navigate("forum", { categoryId: parts[0] || null, threadId: parts[1] || null });
      setTimeout(() => {
        document.querySelector(".forum-replies")?.scrollIntoView({ behavior: "smooth" });
      }, 600);
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

  const dropdown = open ? (
    <div ref={dropRef} className="notif-dropdown" style={dropStyle}>
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
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        ref={btnRef}
        className="page-nav-icon-btn notif-bell-btn"
        onClick={handleOpen}
        title={t("notifications.title")}
      >
        🔔
        {unread.length > 0 && (
          <span className="notif-badge">{unread.length > 9 ? "9+" : unread.length}</span>
        )}
      </button>

      {createPortal(dropdown, document.body)}
    </div>
  );
}
