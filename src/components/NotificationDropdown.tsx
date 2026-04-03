// @ts-nocheck
import { useEffect, useRef } from "react";
import { useNotifications, useMarkNotificationsRead } from "../hooks/useNotifications";
import "../styles/notification-dropdown.css";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

interface Props {
  userId: string | undefined;
  onClose: () => void;
}

export default function NotificationDropdown({ userId, onClose }: Props) {
  const { data: notifications = [] } = useNotifications(userId);
  const markAll = useMarkNotificationsRead(userId);
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

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <>
      {/* Backdrop — click outside to close */}
      <div className="notif-overlay" onClick={onClose} aria-hidden="true" />

      <div
        className="notif-dropdown"
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="notif-header">
          <span className="notif-title">Notifications</span>
          {unreadCount > 0 && (
            <button
              className="notif-mark-all"
              onClick={() => markAll.mutate("all")}
              disabled={markAll.isPending}
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">No notifications yet</div>
          ) : (
            (notifications as any[]).map((n) => (
              <div
                key={n.id}
                className={`notif-item${!n.read ? " unread" : ""}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onClose()}
              >
                <div className="notif-avatar">
                  {n.actor?.avatar_url
                    ? <img src={n.actor.avatar_url} alt={n.actor.display_name ?? ""} />
                    : (n.actor?.display_name?.[0] ?? "🔔").toUpperCase()}
                </div>
                <div className="notif-body">
                  <div className="notif-text">
                    {n.actor?.display_name && <strong>{n.actor.display_name} </strong>}
                    {n.preview ?? n.type}
                  </div>
                  <div className="notif-time">{timeAgo(n.created_at)}</div>
                </div>
                {!n.read && <div className="notif-dot" aria-hidden="true" />}
              </div>
            ))
          )}
        </div>

        <div className="notif-footer">
          <button className="notif-see-all" onClick={onClose}>
            See all notifications →
          </button>
        </div>
      </div>
    </>
  );
}
