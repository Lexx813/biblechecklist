import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNotifications, useMarkNotificationsRead, useDeleteNotification, useClearAllNotifications } from "../../hooks/useNotifications";
import { useAcceptFriendRequest, useDeclineFriendRequest } from "../../hooks/useFriends";
import "../../styles/notifications.css";

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

interface AppNotification {
  id: string;
  read: boolean;
  link_hash?: string;
  type?: string;
  actor_id?: string;
  conversation_id?: string;
  thread_id?: string;
  post?: { slug?: string };
  thread?: { category_id?: string };
  actor?: { display_name?: string; avatar_url?: string };
  body_preview?: string;
  created_at: string;
}

interface Props {
  userId?: string;
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function NotificationBell({ userId, navigate }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: notifications = [] } = useNotifications(userId);
  const markRead       = useMarkNotificationsRead(userId);
  const deleteOne      = useDeleteNotification(userId);
  const clearAll       = useClearAllNotifications(userId);
  const acceptRequest  = useAcceptFriendRequest(userId ?? "");
  const declineRequest = useDeclineFriendRequest(userId ?? "");

  const unread = notifications.filter(n => !n.read);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleOpen() {
    setOpen(o => !o);
  }

  function extractConvId(h: string | null | undefined) {
    if (!h) return null;
    if (h.startsWith("messages/")) return h.slice(9);
    const m = h.match(/[?&]conv=([^&]+)/);
    return m ? m[1] : null;
  }

  function handleClick(n: AppNotification) {
    if (!n.read) markRead.mutate([n.id]);
    setOpen(false);

    const h = n.link_hash;

    // Messages — use conversation_id directly
    if (n.type === "message") {
      const convId = n.conversation_id ?? extractConvId(h);
      navigate("messages", convId ? {
        conversationId: convId,
        otherDisplayName: n.actor?.display_name ?? null,
        otherAvatarUrl: n.actor?.avatar_url ?? null,
      } : {});
      return;
    }

    // Forum reply/mention — use joined thread.category_id + thread_id directly
    if (n.type === "reply" || n.type === "mention") {
      const threadId = n.thread_id;
      const categoryId = n.thread?.category_id ?? (h?.startsWith("forum/") ? h.slice(6).split("/")[0] : null);
      if (threadId && categoryId) {
        navigate("forum", { categoryId, threadId });
      } else if (threadId) {
        navigate("forum", { threadId });
      } else {
        navigate("forum", {});
      }
      return;
    }

    // Blog comment — use joined post.slug + post_id directly
    if (n.type === "comment") {
      const slug = n.post?.slug ?? (h?.startsWith("blog/") ? decodeURIComponent(h.slice(5)) : null);
      navigate("blog", slug ? { slug } : {});
      return;
    }

    // Friend request — handled by inline Accept/Decline buttons
    if (n.type === "friend_request") {
      return;
    }

    if (n.type === "badge_earned") {
      navigate("quiz");
      return;
    }

    if (n.type === "streak_reminder") {
      navigate("main");
      return;
    }

    if (!h) return;
    navigate(h);
  }

  function getVerb(n: { type?: string }) {
    if (n.type === "reply") return t("notifications.typeReply");
    if (n.type === "comment") return t("notifications.typeComment");
    if (n.type === "message") return "sent you a message";
    if (n.type === "friend_request") return "wants to be your friend";
    if (n.type === "badge_earned") return "earned a badge";
    if (n.type === "streak_reminder") return "— don't break your streak today!";
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
              {(notifications as any[]).map((n: any) => (
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
                      {n.type === "friend_request" && n.actor_id && (
                        <div className="notif-friend-actions">
                          <button
                            className="notif-accept-btn"
                            disabled={acceptRequest.isPending || declineRequest.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              acceptRequest.mutate(n.actor_id!, { onSuccess: () => deleteOne.mutate(n.id) });
                            }}
                          >
                            Accept
                          </button>
                          <button
                            className="notif-decline-btn"
                            disabled={acceptRequest.isPending || declineRequest.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              declineRequest.mutate(n.actor_id!, { onSuccess: () => deleteOne.mutate(n.id) });
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      )}
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
