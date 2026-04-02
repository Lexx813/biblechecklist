import {
  useFriendRequests,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useCancelFriendRequest,
  OutgoingRequest,
} from "../../hooks/useFriends";
import "../../styles/friends.css";

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  user: { id: string };
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

// useCancelFriendRequest requires targetId at hook-creation time, so use a
// per-row sub-component to satisfy the Rules of Hooks.
function OutgoingRow({ userId, req }: { userId: string; req: OutgoingRequest }) {
  const cancel = useCancelFriendRequest(userId, req.to_user_id);
  return (
    <div className="freq-card">
      {req.recipient?.avatar_url ? (
        <img
          className="friend-avatar"
          src={req.recipient.avatar_url}
          alt={req.recipient.display_name ?? "User"}
          style={{ width: 40, height: 40 }}
        />
      ) : (
        <div
          className="friend-avatar-placeholder"
          style={{ width: 40, height: 40, fontSize: 16 }}
        >
          {(req.recipient?.display_name ?? "?")[0].toUpperCase()}
        </div>
      )}
      <div className="freq-card-info">
        <div className="freq-card-name">{req.recipient?.display_name ?? "Unknown"}</div>
        <div className="freq-card-time">{timeAgo(req.created_at)}</div>
      </div>
      <div className="freq-card-actions">
        <button
          className="freq-cancel-btn"
          onClick={() => cancel.mutate()}
          disabled={cancel.isPending}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function FriendRequestsPage({ user, navigate }: Props) {
  const { incoming, outgoing } = useFriendRequests(user.id);
  const accept = useAcceptFriendRequest(user.id);
  const decline = useDeclineFriendRequest(user.id);

  const incomingList = incoming.data ?? [];
  const outgoingList = outgoing.data ?? [];

  return (
    <div className="friends-page">
      <div className="friends-page-header">
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted, #888)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
          }}
          onClick={() => navigate("friends")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <h1 className="friends-page-title">Friend Requests</h1>
        <div style={{ width: 60 }} />
      </div>

      <div className="freq-section">
        <div className="freq-section-label">Incoming ({incomingList.length})</div>
        {incomingList.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--text-muted, #888)", padding: "12px 0" }}>
            No incoming requests
          </div>
        )}
        {incomingList.map((req) => (
          <div key={req.id} className="freq-card">
            {req.sender?.avatar_url ? (
              <img
                className="friend-avatar"
                src={req.sender.avatar_url}
                alt={req.sender.display_name ?? "User"}
                style={{ width: 40, height: 40 }}
              />
            ) : (
              <div
                className="friend-avatar-placeholder"
                style={{ width: 40, height: 40, fontSize: 16 }}
              >
                {(req.sender?.display_name ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div className="freq-card-info">
              <div className="freq-card-name">{req.sender?.display_name ?? "Unknown"}</div>
              <div className="freq-card-time">{timeAgo(req.created_at)}</div>
            </div>
            <div className="freq-card-actions">
              <button
                className="freq-accept-btn"
                onClick={() => accept.mutate(req.from_user_id)}
                disabled={accept.isPending}
              >
                Accept
              </button>
              <button
                className="freq-decline-btn"
                onClick={() => decline.mutate(req.from_user_id)}
                disabled={decline.isPending}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="freq-section">
        <div className="freq-section-label">Sent ({outgoingList.length})</div>
        {outgoingList.length === 0 && (
          <div style={{ fontSize: 13, color: "var(--text-muted, #888)", padding: "12px 0" }}>
            No pending requests
          </div>
        )}
        {outgoingList.map((req) => (
          <OutgoingRow key={req.id} userId={user.id} req={req} />
        ))}
      </div>
    </div>
  );
}
