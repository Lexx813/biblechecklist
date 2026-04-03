import { useMeta } from "../../hooks/useMeta";
import { useOnlineMembers, ONLINE_THRESHOLD_MS, OnlineMember } from "../../hooks/useOnlineMembers";
import "../../styles/community.css";

function timeAgo(lastActiveAt: string | null): string {
  if (!lastActiveAt) return "";
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  if (diff < ONLINE_THRESHOLD_MS) return "Active now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function MemberRow({ member, navigate }: { member: OnlineMember; navigate: Function }) {
  const isOnline = member.last_active_at != null &&
    Date.now() - new Date(member.last_active_at).getTime() < ONLINE_THRESHOLD_MS;
  const initials = (member.display_name || "?")[0].toUpperCase();

  return (
    <div
      className="cm-row"
      onClick={() => navigate("publicProfile", { userId: member.id })}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && navigate("publicProfile", { userId: member.id })}
    >
      <span className="cm-av-wrap">
        <span className="cm-av">
          {member.avatar_url
            ? <img src={member.avatar_url} alt={member.display_name ?? ""} loading="lazy" />
            : initials}
        </span>
        {isOnline && <span className="cm-dot" aria-label="Online" />}
      </span>
      <span className="cm-name">{member.display_name || "Anonymous"}</span>
      <span className={`cm-when${isOnline ? " cm-when--online" : ""}`}>
        {timeAgo(member.last_active_at)}
      </span>
    </div>
  );
}

export default function CommunityPage({ navigate }) {
  useMeta({ title: "Community Members", path: "/community" });
  const { onlineNow, recentlyActive, totalOnline, isLoading } = useOnlineMembers(100);
  const totalShown = onlineNow.length + recentlyActive.length;

  return (
    <div className="cm-wrap">
      <header className="cm-header">
        <h1 className="cm-title">Community Members</h1>
        {!isLoading && (
          <p className="cm-subtitle">
            {totalOnline} online now · {totalShown} members shown
          </p>
        )}
      </header>

      {isLoading ? (
        <div className="cm-skeleton">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="cm-skeleton-row">
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skeleton" style={{ height: 13, width: "40%", borderRadius: 6 }}>&nbsp;</div>
                <div className="skeleton" style={{ height: 11, width: "25%", borderRadius: 6 }}>&nbsp;</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {onlineNow.length > 0 && (
            <section>
              <div className="cm-section-label cm-section-label--online">Online Now</div>
              {onlineNow.map(m => <MemberRow key={m.id} member={m} navigate={navigate} />)}
            </section>
          )}
          {recentlyActive.length > 0 && (
            <section>
              <div className="cm-section-label">Recently Active</div>
              {recentlyActive.map(m => <MemberRow key={m.id} member={m} navigate={navigate} />)}
            </section>
          )}
          {onlineNow.length === 0 && recentlyActive.length === 0 && (
            <p className="cm-empty">No members have been active recently.</p>
          )}
        </>
      )}
    </div>
  );
}
