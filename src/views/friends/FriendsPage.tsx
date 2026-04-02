import { useState } from "react";
import { useFriends, useInviteToken, useRemoveFriend, FriendProfile } from "../../hooks/useFriends";
import { useGetOrCreateDM } from "../../hooks/useMessages";
import "../../styles/friends.css";

function timeAgo(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

interface Props {
  user: { id: string };
  navigate: (page: string, params?: Record<string, unknown>) => void;
  isPremium: boolean;
  onUpgrade?: () => void;
}

export default function FriendsPage({ user, navigate, isPremium, onUpgrade }: Props) {
  const { data: friendsData, isLoading } = useFriends(user.id);
  const friends: FriendProfile[] = (friendsData as FriendProfile[] | undefined) ?? [];
  const { data: token } = useInviteToken(user.id);
  const removeFriend = useRemoveFriend(user.id);
  const getOrCreate = useGetOrCreateDM();
  const [copied, setCopied] = useState(false);

  function copyInviteLink() {
    if (!token) return;
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleMessage(friend: FriendProfile) {
    if (!isPremium && !friend.sponsored_by) { onUpgrade?.(); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getOrCreate as any).mutate(friend.id, {
      onSuccess: (conversationId: string) => navigate("messages", {
        conversationId,
        otherDisplayName: friend.display_name,
        otherAvatarUrl: friend.avatar_url,
      }),
    });
  }

  // Suppress unused variable warning — removeFriend is available for future use
  void removeFriend;

  return (
    <div className="friends-page">
      <div className="friends-page-header">
        <h1 className="friends-page-title">Friends</h1>
        <button
          className={`friends-invite-btn${copied ? " friends-invite-btn--copied" : ""}`}
          onClick={copyInviteLink}
          disabled={!token}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          {copied ? "Copied!" : "Copy Invite Link"}
        </button>
      </div>

      <button
        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#7c3aed", width: "100%" }}
        onClick={() => navigate("friendRequests")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        View Friend Requests
      </button>

      {isLoading && (
        <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted, #888)", fontSize: 14 }}>Loading…</div>
      )}

      {!isLoading && friends.length === 0 && (
        <div className="friends-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#7c3aed", opacity: 0.5, display: "block", margin: "0 auto 12px" }} aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <div className="friends-empty-text">No friends yet</div>
          <div className="friends-empty-sub">Share your invite link to connect with others</div>
        </div>
      )}

      <div className="friends-list">
        {friends.map(friend => {
          const lastActive = timeAgo(friend.last_active_at);
          return (
            <div key={friend.id} className="friend-card">
              {friend.avatar_url
                ? <img className="friend-avatar" src={friend.avatar_url} alt={friend.display_name ?? "User"} />
                : <div className="friend-avatar-placeholder">{(friend.display_name ?? "?")[0].toUpperCase()}</div>
              }
              <div className="friend-info">
                <div className="friend-name">{friend.display_name ?? "Unknown"}</div>
                {lastActive && <div className="friend-last-active">Active {lastActive}</div>}
              </div>
              <div className="friend-actions">
                <button
                  className="friend-action-btn"
                  onClick={() => handleMessage(friend)}
                  aria-label="Message"
                  title="Message"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>
                <button
                  className="friend-action-btn"
                  onClick={() => navigate("publicProfile", { userId: friend.id })}
                  aria-label="View profile"
                  title="View profile"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
