import {
  useFriendRequests,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useCancelFriendRequest,
  OutgoingRequest,
} from "../../hooks/useFriends";
import PageNav from "../../components/PageNav";
import AppLayout from "../../components/AppLayout";
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
  darkMode?: boolean;
  setDarkMode?: any;
  i18n?: any;
  onLogout?: () => void;
  onUpgrade?: () => void;
  currentPage?: string;
}

function OutgoingRow({
  userId,
  req,
  navigate,
}: {
  userId: string;
  req: OutgoingRequest;
  navigate: (page: string, params?: Record<string, unknown>) => void;
}) {
  const cancel = useCancelFriendRequest(userId, req.to_user_id);
  return (
    <div className="freq-card">
      {req.recipient?.avatar_url ? (
        <img
          className="freq-avatar freq-avatar--img"
          src={req.recipient.avatar_url}
          alt={req.recipient.display_name ?? "User"}
          onClick={() => navigate("publicProfile", { userId: req.to_user_id })}
        />
      ) : (
        <div
          className="freq-avatar"
          onClick={() => navigate("publicProfile", { userId: req.to_user_id })}
        >
          {(req.recipient?.display_name ?? "?")[0].toUpperCase()}
        </div>
      )}
      <div className="freq-card-info">
        <div className="freq-card-name">{req.recipient?.display_name ?? "Unknown"}</div>
        <div className="freq-card-time">Sent {timeAgo(req.created_at)}</div>
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

export default function FriendRequestsPage({ user, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade, currentPage }: Props) {
  const { incoming, outgoing } = useFriendRequests(user.id);
  const accept = useAcceptFriendRequest(user.id);
  const decline = useDeclineFriendRequest(user.id);

  const incomingList = incoming.data ?? [];
  const outgoingList = outgoing.data ?? [];

  return (
    <div className="freq-page">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} onUpgrade={onUpgrade} currentPage={currentPage} />
      <AppLayout navigate={navigate} user={user} currentPage="friendRequests">
      {/* Hero header */}
      <div className="freq-hero">
        <div className="freq-hero-inner">
          <button className="freq-back-btn" onClick={() => navigate("profile")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <h1 className="freq-hero-title">Friend Requests</h1>
          <p className="freq-hero-sub">Manage who you connect with</p>
        </div>
      </div>

      <div className="freq-content">

        {/* Incoming */}
        <div className="freq-section">
          <div className="freq-section-header">
            <span className="freq-section-title">Incoming</span>
            <span className={`freq-count-badge${incomingList.length === 0 ? " freq-count-badge--empty" : ""}`}>
              {incomingList.length}
            </span>
          </div>

          {incomingList.length === 0 ? (
            <div className="freq-empty">
              <div className="freq-empty-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className="freq-empty-title">No incoming requests</div>
              <div className="freq-empty-sub">When someone wants to connect, you'll see them here.</div>
            </div>
          ) : (
            incomingList.map((req) => (
              <div key={req.id} className="freq-card">
                {req.sender?.avatar_url ? (
                  <img
                    className="freq-avatar freq-avatar--img"
                    src={req.sender.avatar_url}
                    alt={req.sender.display_name ?? "User"}
                    onClick={() => navigate("publicProfile", { userId: req.from_user_id })}
                  />
                ) : (
                  <div
                    className="freq-avatar"
                    onClick={() => navigate("publicProfile", { userId: req.from_user_id })}
                  >
                    {(req.sender?.display_name ?? "?")[0].toUpperCase()}
                  </div>
                )}
                <div className="freq-card-info">
                  <div className="freq-card-name">{req.sender?.display_name ?? "Unknown"}</div>
                  <div className="freq-card-time">Sent {timeAgo(req.created_at)}</div>
                </div>
                <div className="freq-card-actions">
                  <button
                    className="freq-accept-btn"
                    onClick={() => accept.mutate(req.from_user_id)}
                    disabled={accept.isPending || decline.isPending}
                  >
                    Accept
                  </button>
                  <button
                    className="freq-decline-btn"
                    onClick={() => decline.mutate(req.from_user_id)}
                    disabled={accept.isPending || decline.isPending}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sent */}
        <div className="freq-section">
          <div className="freq-section-header">
            <span className="freq-section-title">Sent</span>
            <span className={`freq-count-badge${outgoingList.length === 0 ? " freq-count-badge--empty" : ""}`}>
              {outgoingList.length}
            </span>
          </div>

          {outgoingList.length === 0 ? (
            <div className="freq-empty">
              <div className="freq-empty-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <div className="freq-empty-title">No sent requests</div>
              <div className="freq-empty-sub">Find someone on the leaderboard or community and add them as a friend.</div>
            </div>
          ) : (
            outgoingList.map((req) => (
              <OutgoingRow key={req.id} userId={user.id} req={req} navigate={navigate} />
            ))
          )}
        </div>

      </div>
      </AppLayout>
    </div>
  );
}
