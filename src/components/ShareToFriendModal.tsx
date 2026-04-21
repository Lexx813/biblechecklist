import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useFriends, type FriendProfile } from "../hooks/useFriends";
import { messagesApi } from "../api/messages";
import "../styles/social.css";

interface Props {
  currentUserId: string;
  message: string;
  onClose: () => void;
  onSent?: (friend: FriendProfile) => void;
  title?: string;
}

export default function ShareToFriendModal({ currentUserId, message, onClose, onSent, title }: Props) {
  const { t } = useTranslation();
  const dialogTitle = title ?? t("shareToFriend.title", "Share with a friend");
  const { data: friends = [], isLoading } = useFriends(currentUserId);
  const [query, setQuery] = useState("");
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(f => (f.display_name ?? "").toLowerCase().includes(q));
  }, [friends, query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSend(friend: FriendProfile) {
    if (busy) return;
    setBusy(friend.id);
    setError(null);
    try {
      const conversationId = await messagesApi.getOrCreateDM(friend.id);
      await messagesApi.sendMessage(conversationId, message, null, "text", null);
      setSentTo(prev => new Set(prev).add(friend.id));
      onSent?.(friend);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("shareToFriend.failed", "Failed to send"));
    } finally {
      setBusy(null);
    }
  }

  return createPortal(
    <>
      <div className="stf-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="stf-modal" role="dialog" aria-modal="true" aria-label={dialogTitle}>
        <header className="stf-header">
          <h3>{dialogTitle}</h3>
          <button className="stf-close" onClick={onClose} aria-label={t("common.close", "Close")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </header>

        <div className="stf-preview">{message}</div>

        <input
          type="text"
          className="stf-search"
          placeholder={t("shareToFriend.searchPlaceholder", "Search friends...")}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        {error && <div className="stf-error">{error}</div>}

        <div className="stf-list">
          {isLoading && <p className="stf-empty">{t("shareToFriend.loading", "Loading friends…")}</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="stf-empty">
              {friends.length === 0
                ? t("shareToFriend.empty", "Add some friends first")
                : t("shareToFriend.noMatch", "No friends match")}
            </p>
          )}
          {filtered.map(f => {
            const isSent = sentTo.has(f.id);
            const isBusy = busy === f.id;
            return (
              <div key={f.id} className="stf-row">
                <span className="stf-avatar">
                  {f.avatar_url
                    ? <img src={f.avatar_url} alt="" width={32} height={32} loading="lazy" style={{borderRadius:"50%",objectFit:"cover"}} />
                    : (f.display_name ?? "?")[0].toUpperCase()
                  }
                </span>
                <span className="stf-name">{f.display_name ?? t("shareToFriend.friendFallback", "Friend")}</span>
                <button
                  className={`stf-send-btn${isSent ? " stf-send-btn--sent" : ""}`}
                  disabled={isSent || isBusy}
                  onClick={() => handleSend(f)}
                >
                  {isSent
                    ? t("shareToFriend.sent", "Sent ✓")
                    : isBusy
                      ? t("shareToFriend.sending", "Sending…")
                      : t("shareToFriend.send", "Send")}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>,
    document.body,
  );
}
