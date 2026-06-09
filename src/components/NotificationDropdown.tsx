import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNotifications, useMarkNotificationsRead } from "../hooks/useNotifications";
import "../styles/notification-dropdown.css";

type TFn = ReturnType<typeof useTranslation>["t"];

const TYPE_LABEL_KEY: Record<string, string> = {
  reply: "notif.typeReply",
  comment: "notif.typeComment",
  mention: "notif.typeMention",
  like: "notif.typeLike",
  friend_request: "notif.typeFriendRequest",
  meeting_prep_reminder: "notif.typeMeetingReminder",
};

function typeLabel(type: string, t: TFn): string {
  const key = TYPE_LABEL_KEY[type];
  return key ? t(key) : type;
}

function timeAgo(dateStr: string, t: TFn): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("notif.justNow");
  if (mins < 60) return t("notif.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("notif.hoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  return t("notif.daysAgo", { count: days });
}

interface Props {
  userId: string | undefined;
  onClose: () => void;
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function NotificationDropdown({ userId, onClose, navigate }: Props) {
  const { t } = useTranslation();
  const { data: notifications = [] } = useNotifications(userId);
  const markAll = useMarkNotificationsRead(userId);
  const markRead = useMarkNotificationsRead(userId);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Focus panel when it opens
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  function handleClick(n: any) {
    if (!n.read) markRead.mutate([n.id]);
    onClose();

    if (n.type === "message") {
      const convId = n.conversation_id ?? null;
      navigate("messages", convId ? {
        conversationId: convId,
        otherDisplayName: n.actor?.display_name ?? null,
        otherAvatarUrl: n.actor?.avatar_url ?? null,
      } : {});
      return;
    }

    if (n.type === "reply" || n.type === "mention") {
      const threadId = n.thread_id;
      const categoryId = n.thread?.category_id ?? null;
      if (threadId && categoryId) navigate("forum", { categoryId, threadId });
      else if (threadId) navigate("forum", { threadId });
      else navigate("forum", {});
      return;
    }

    if (n.type === "comment") {
      const slug = n.post?.slug ?? null;
      navigate("blog", slug ? { slug } : {});
      return;
    }

    if (n.type === "like") {
      if (n.thread_id) {
        const categoryId = n.thread?.category_id ?? null;
        if (categoryId) navigate("forum", { categoryId, threadId: n.thread_id });
        else navigate("forum", { threadId: n.thread_id });
      } else if (n.post_id) {
        const slug = n.post?.slug ?? null;
        navigate("blog", slug ? { slug } : {});
      } else if (n.link_hash) {
        navigate(n.link_hash);
      }
      return;
    }

    if (n.type === "friend_request") {
      navigate("friendRequests");
      return;
    }

    if (n.type === "trivia_invite") {
      navigate("trivia", { prefillCode: n.data?.room_code ?? "" });
      return;
    }

    if (n.type === "daily_brief") {
      // /ai is its own Next.js route, not a HOME_PANEL, full nav, not SPA
      window.location.href = "/ai";
      return;
    }

    if (n.link_hash) navigate(n.link_hash);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Backdrop, click outside to close */}
      <div className="notif-overlay" onClick={onClose} aria-hidden="true" />

      <div
        className="notif-dropdown"
        role="dialog"
        aria-label={t("notifications.dropdownTitle")}
        aria-modal="true"
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="notif-header">
          <span className="notif-title">{t("notifications.dropdownTitle")}</span>
          {unreadCount > 0 && (
            <button
              className="notif-mark-all"
              onClick={() => markAll.mutate("all")}
              disabled={markAll.isPending}
            >
              {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">{t("notifications.empty")}</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notif-item${!n.read ? " unread" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => handleClick(n)}
                onKeyDown={(e) => e.key === "Enter" && handleClick(n)}
                style={{ cursor: "pointer" }}
              >
                <div className="notif-avatar">
                  {n.actor?.avatar_url
                    ? <img src={n.actor.avatar_url} alt={n.actor.display_name ?? ""} />
                    : (n.actor?.display_name?.[0] ?? "🔔").toUpperCase()}
                </div>
                <div className="notif-body">
                  <div className="notif-text">
                    {n.actor?.display_name && <strong>{n.actor.display_name} </strong>}
                    {n.preview ?? typeLabel(n.type, t)}
                  </div>
                  <div className="notif-time">{timeAgo(n.created_at, t)}</div>
                </div>
                {!n.read && <div className="notif-dot" aria-hidden="true" />}
              </div>
            ))
          )}
        </div>


      </div>
    </>
  );
}
