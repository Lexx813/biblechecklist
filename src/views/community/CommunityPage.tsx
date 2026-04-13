import { useState } from "react";
import { useMeta } from "../../hooks/useMeta";
import { useOnlineMembers, ONLINE_THRESHOLD_MS, OnlineMember } from "../../hooks/useOnlineMembers";
import { useTopThreads } from "../../hooks/useForum";
import { usePublishedPosts } from "../../hooks/useBlog";
import "../../styles/community.css";

interface TopThread { id: string; category_id: string | null; title: string; reply_count?: number | null }
interface RecentPost { id: string; slug: string; title: string; like_count?: number | null }

const PAGE_SIZE = 10;

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
  useMeta({ title: "Community", path: "/community" });
  const { onlineNow, recentlyActive, totalOnline, isLoading: membersLoading, isError: membersError } = useOnlineMembers(100);
  const { data: threads = [], isLoading: threadsLoading } = useTopThreads(5);
  const { data: posts = [], isLoading: postsLoading } = usePublishedPosts();
  const recentPosts = posts.slice(0, 4);
  const totalShown = onlineNow.length + recentlyActive.length;

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleRecent = recentlyActive.slice(0, visibleCount);
  const hasMore = visibleCount < recentlyActive.length;

  return (
    <div className="cm-wrap">
      <header className="cm-header">
        <h1 className="cm-title">Community</h1>
        {!membersLoading && (
          <p className="cm-subtitle">
            {totalOnline} online now · {totalShown} members shown
          </p>
        )}
      </header>

      {/* ── Forum highlights ── */}
      <section className="cm-card">
        <div className="cm-card-header">
          <span className="cm-card-title">Trending Discussions</span>
          <button className="cm-card-link" onClick={() => navigate("forum")}>View all →</button>
        </div>
        {threadsLoading ? (
          <div className="cm-list-skeleton">
            {[0,1,2].map(i => (
              <div key={i} className="cm-skeleton-row">
                <div className="skeleton" style={{ height: 13, flex: 1, borderRadius: 6 }}>&nbsp;</div>
              </div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          <p className="cm-card-empty">No discussions yet. <button className="cm-inline-link" onClick={() => navigate("forum")}>Start one →</button></p>
        ) : (
          <div className="cm-thread-list">
            {(threads as unknown as TopThread[]).map(t => (
              <div
                key={t.id}
                className="cm-thread-row"
                role="button"
                tabIndex={0}
                onClick={() => navigate("forum", { categoryId: t.category_id, threadId: t.id })}
                onKeyDown={e => e.key === "Enter" && navigate("forum", { categoryId: t.category_id, threadId: t.id })}
              >
                <span className="cm-thread-title">{t.title}</span>
                <span className="cm-thread-meta">{t.reply_count ?? 0} replies</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Recent blog posts ── */}
      <section className="cm-card">
        <div className="cm-card-header">
          <span className="cm-card-title">From the Blog</span>
          <button className="cm-card-link" onClick={() => navigate("blog")}>View all →</button>
        </div>
        {postsLoading ? (
          <div className="cm-list-skeleton">
            {[0,1,2].map(i => (
              <div key={i} className="cm-skeleton-row">
                <div className="skeleton" style={{ height: 13, flex: 1, borderRadius: 6 }}>&nbsp;</div>
              </div>
            ))}
          </div>
        ) : recentPosts.length === 0 ? (
          <p className="cm-card-empty">No posts yet.</p>
        ) : (
          <div className="cm-thread-list">
            {(recentPosts as unknown as RecentPost[]).map(p => (
              <div
                key={p.id}
                className="cm-thread-row"
                role="button"
                tabIndex={0}
                onClick={() => navigate("blog", { slug: p.slug })}
                onKeyDown={e => e.key === "Enter" && navigate("blog", { slug: p.slug })}
              >
                <span className="cm-thread-title">{p.title}</span>
                <span className="cm-thread-meta">{p.like_count ?? 0} likes</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Members ── */}
      <section>
        <div className="cm-section-label cm-section-label--first">Members</div>

        {membersLoading ? (
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
        ) : membersError ? (
          <p className="cm-empty">Unable to load members. Please try again.</p>
        ) : (
          <>
            {onlineNow.length > 0 && (
              <div>
                <div className="cm-section-label cm-section-label--online">Online Now</div>
                {onlineNow.map(m => <MemberRow key={m.id} member={m} navigate={navigate} />)}
              </div>
            )}
            {recentlyActive.length > 0 && (
              <div>
                {onlineNow.length > 0 && <div className="cm-section-label">Recently Active</div>}
                {visibleRecent.map(m => <MemberRow key={m.id} member={m} navigate={navigate} />)}
                {(hasMore || visibleCount > PAGE_SIZE) && (
                  <div className="cm-pagination">
                    {hasMore && (
                      <button
                        className="cm-load-more"
                        onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                      >
                        Show more ({recentlyActive.length - visibleCount} remaining)
                      </button>
                    )}
                    {visibleCount > PAGE_SIZE && (
                      <button
                        className="cm-load-more cm-load-more--secondary"
                        onClick={() => setVisibleCount(PAGE_SIZE)}
                      >
                        Show less
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {onlineNow.length === 0 && recentlyActive.length === 0 && (
              <p className="cm-empty">No members have been active recently.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
