import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useFriends, FriendProfile } from "../hooks/useFriends";
import { useGetOrCreateDM } from "../hooks/useMessages";

interface Props {
  userId: string;
  onClose: () => void;
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

export function NewConversationModal({ userId, onClose, navigate }: Props) {
  const [search, setSearch] = useState("");
  const { data: rawFriends } = useFriends(userId);
  const friends: FriendProfile[] = (rawFriends as FriendProfile[] | undefined) ?? [];
  const getOrCreate = useGetOrCreateDM();

  const filtered = friends.filter((f: FriendProfile) =>
    !search || f.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(friend: FriendProfile) {
    getOrCreate.mutate(friend.id, {
      onSuccess: (conversationId: string) => {
        onClose();
        navigate("messages", {
          conversationId,
          otherDisplayName: friend.display_name,
          otherAvatarUrl: friend.avatar_url,
        });
      },
    });
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div className="new-conv-backdrop" onClick={onClose}>
      <div className="new-conv-modal" role="dialog" aria-modal="true" aria-label="New conversation" onClick={e => e.stopPropagation()}>
        <div className="new-conv-header">
          <span className="new-conv-title">New Message</span>
          <button className="new-conv-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="new-conv-search">
          <input
            className="new-conv-search-input"
            type="search"
            placeholder="Search friends…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            aria-label="Search friends"
          />
        </div>
        <div className="new-conv-list">
          {filtered.length === 0 && (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted, #888)", fontSize: 13 }}>
              {friends.length === 0 ? "Add friends to start a conversation" : "No friends match your search"}
            </div>
          )}
          {filtered.map((friend: FriendProfile) => (
            <div
              key={friend.id}
              className="new-conv-row"
              onClick={() => handleSelect(friend)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === "Enter" && handleSelect(friend)}
            >
              {friend.avatar_url
                ? <img className="new-conv-avatar" src={friend.avatar_url} alt={friend.display_name ?? "User"} />
                : <div className="new-conv-avatar-placeholder">{(friend.display_name ?? "?")[0].toUpperCase()}</div>
              }
              <span className="new-conv-name">{friend.display_name ?? "Unknown"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
