import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePushNotifications } from "../../hooks/usePushNotifications";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Conversation {
  conversation_id: string;
  other_user_id?: string;
  other_display_name?: string | null;
  other_avatar_url?: string | null;
  last_message_content?: string | null;
  last_message_at?: string | null;
  last_message_sender_id?: string | null;
  unread_count?: number;
  other_last_read_at?: string | null;
}

interface ConvListPanelProps {
  conversations: Conversation[];
  isLoading: boolean;
  activeConvId: string | null;
  currentUserId: string;
  onSelectConv: (conv: Conversation) => void;
  onDeleteConv: (id: string) => void;
  onlineUsers: Set<string>;
  onBack: () => void;
  onNewConv: () => void;
  hiddenOnMobile?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null | undefined, t?: (k: string) => string) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return t ? t("messages.justNow") : "just now";
  if (m < 60) return `${m}${t ? t("messages.minutesAgo") : "m"}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${t ? t("messages.hoursAgo") : "h"}`;
  return `${Math.floor(h / 24)}${t ? t("messages.daysAgo") : "d"}`;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ displayName, avatarUrl, online = false, size = 36 }: {
  displayName: string | null | undefined;
  avatarUrl: string | null | undefined;
  online?: boolean;
  size?: number;
}) {
  const initial = (displayName || "?")[0].toUpperCase();
  return (
    <div className="msg-avatar-wrap" style={{ width: size, height: size, flexShrink: 0 }}>
      {avatarUrl ? (
        <img className="msg-avatar" src={avatarUrl} alt={displayName || "?"} width={size} height={size} style={{ width: size, height: size }} />
      ) : (
        <div className="msg-avatar msg-avatar--fallback" style={{ width: size, height: size, fontSize: size * 0.38 }}>
          {initial}
        </div>
      )}
      {online && <span className="msg-online-dot" />}
    </div>
  );
}

// ── ConvItem ──────────────────────────────────────────────────────────────────

function ConvItem({ conv, active, onClick, currentUserId, onDelete, onlineUsers }: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
  currentUserId: string;
  onDelete: (id: string) => void;
  onlineUsers: Set<string>;
}) {
  const { t } = useTranslation();
  const isUnread = conv.unread_count > 0;
  const isMine = conv.last_message_sender_id === currentUserId;
  const isOnline = onlineUsers.has(conv.other_user_id);

  return (
    <div
      className={`msg-conv-item${active ? " msg-conv-item--active" : ""}${isUnread ? " msg-conv-item--unread" : ""}`}
      onClick={onClick}
    >
      <Avatar displayName={conv.other_display_name} avatarUrl={conv.other_avatar_url} online={isOnline} />
      <div className="msg-conv-info">
        <div className="msg-conv-header">
          <span className="msg-conv-name">{conv.other_display_name || t("messages.user")}</span>
          {conv.last_message_at && <span className="msg-conv-time">{timeAgo(conv.last_message_at, t)}</span>}
        </div>
        <div className="msg-conv-preview">
          {conv.last_message_content
            ? `${isMine ? `${t("messages.you")}: ` : ""}${conv.last_message_content.startsWith("enc:") ? t("messages.encrypted") : conv.last_message_content}`
            : t("messages.noMessagesYet")}
        </div>
      </div>
      <div className="msg-conv-actions">
        {isUnread && <span className="msg-unread-dot">{conv.unread_count}</span>}
        <button
          className="msg-conv-delete-btn"
          onClick={e => { e.stopPropagation(); onDelete(conv.conversation_id); }}
          title="Delete conversation"
        >🗑</button>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function MessagesSkeleton() {
  return (
    <div className="messages-page">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 16, width: "40%", marginBottom: 7 }} />
            <div className="skeleton" style={{ height: 13, width: "70%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

const PUSH_DISMISS_KEY = "nwt-push-prompt-dismissed";

export function ConversationListPanel({
  conversations, isLoading, activeConvId, currentUserId,
  onSelectConv, onDeleteConv, onlineUsers, onBack, onNewConv, hiddenOnMobile = false,
}: ConvListPanelProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [pushDismissed, setPushDismissed] = useState(() => {
    try {
      const until = localStorage.getItem(PUSH_DISMISS_KEY);
      return until ? Date.now() < Number(until) : false;
    } catch { return false; }
  });
  const { supported: pushSupported, permission, subscribed, loading: pushLoading, subscribe } = usePushNotifications();
  const showPushBanner = pushSupported && !subscribed && !pushDismissed && (permission === "default" || permission === "denied");

  function dismissPushBanner() {
    try { localStorage.setItem(PUSH_DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000)); } catch {}
    setPushDismissed(true);
  }

  const filtered = search.trim()
    ? conversations.filter(c => (c.other_display_name || "").toLowerCase().includes(search.toLowerCase()))
    : conversations;

  return (
    <aside className={`msg-sidebar${hiddenOnMobile ? " msg-sidebar--hidden-mobile" : ""}`}>
      <div className="msg-sidebar-header">
        <button className="msg-back-btn" onClick={onBack} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 className="msg-sidebar-title">{t("messages.title")}</h2>
        <button className="msg-compose-btn" onClick={onNewConv} aria-label="New conversation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>

      <div className="msg-search-wrap">
        <input
          className="msg-search"
          type="search"
          placeholder="Search conversations…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search conversations"
        />
      </div>

      {showPushBanner && (
        <div className="msg-push-banner">
          <span className="msg-push-banner-icon">🔔</span>
          <div className="msg-push-banner-text">
            <strong>{t("messages.stayNotified")}</strong>
            <span>{permission === "denied"
              ? t("messages.notifBlocked", "Notifications blocked — enable them in your browser settings")
              : t("messages.stayNotifiedDesc")
            }</span>
          </div>
          {permission !== "denied" && (
            <button
              className="msg-push-banner-btn msg-push-banner-btn--primary"
              onClick={() => subscribe().then(ok => ok && dismissPushBanner())}
              disabled={pushLoading}
            >{t("messages.enableNotifications")}</button>
          )}
          <button className="msg-push-banner-btn" onClick={dismissPushBanner} aria-label="Dismiss">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}

      <div className="msg-conv-list">
        {isLoading ? (
          <MessagesSkeleton />
        ) : filtered.length === 0 ? (
          <p className="msg-empty">{search ? t("messages.noResults") : t("messages.noConversations")}</p>
        ) : (
          filtered.map(conv => (
            <ConvItem
              key={conv.conversation_id}
              conv={conv}
              active={activeConvId === conv.conversation_id}
              currentUserId={currentUserId}
              onClick={() => onSelectConv(conv)}
              onDelete={onDeleteConv}
              onlineUsers={onlineUsers}
            />
          ))
        )}
      </div>
    </aside>
  );
}
