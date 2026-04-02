import { useFriendStatus, useSendFriendRequest, useCancelFriendRequest, useAcceptFriendRequest, useDeclineFriendRequest } from "../hooks/useFriends";

interface Props {
  currentUserId: string;
  targetId: string;
}

export function FriendRequestButton({ currentUserId, targetId }: Props) {
  const { data: status = "none", isLoading } = useFriendStatus(currentUserId, targetId);
  const send = useSendFriendRequest(currentUserId, targetId);
  const cancel = useCancelFriendRequest(currentUserId, targetId);
  const accept = useAcceptFriendRequest(currentUserId);
  const decline = useDeclineFriendRequest(currentUserId);

  if (!currentUserId || !targetId || currentUserId === targetId) return null;
  if (isLoading) return null;

  if (status === "friends") {
    return (
      <button className="pf-friend-btn pf-friend-btn--friends" disabled>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
        Friends
      </button>
    );
  }

  if (status === "pending_sent") {
    return (
      <button
        className="pf-friend-btn pf-friend-btn--pending"
        onClick={() => cancel.mutate()}
        disabled={cancel.isPending}
      >
        Request Sent
      </button>
    );
  }

  if (status === "pending_received") {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="pf-friend-btn pf-friend-btn--add"
          onClick={() => accept.mutate(targetId)}
          disabled={accept.isPending}
        >
          Accept
        </button>
        <button
          className="pf-friend-btn"
          onClick={() => decline.mutate(targetId)}
          disabled={decline.isPending}
        >
          Decline
        </button>
      </div>
    );
  }

  return (
    <button
      className="pf-friend-btn pf-friend-btn--add"
      onClick={() => send.mutate()}
      disabled={send.isPending}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
      Add Friend
    </button>
  );
}
