// @ts-nocheck
import { useTranslation } from "react-i18next";
import AppLayout from "../../components/AppLayout";
import { useActivityFeed } from "../../hooks/useFollows";
import "../../styles/social.css";

const LEVEL_EMOJIS = [null, "📖","📚","🌱","👨‍👩‍👦","🏺","⚔️","🎵","📯","🕊️","🌍","🔮","👑"];

function timeAgo(iso, t) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return t("forum.timeJustNow");
  if (m < 60) return t("forum.timeMinutes", { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("forum.timeHours", { count: h });
  const d = Math.floor(h / 24);
  if (d < 30) return t("forum.timeDays", { count: d });
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function FeedAvatar({ author }) {
  const initial = (author?.display_name || author?.email || "?")[0].toUpperCase();
  if (author?.avatar_url) {
    return <img className="feed-avatar" src={author.avatar_url} alt="" width={36} height={36} loading="lazy" />;
  }
  return <div className="feed-avatar feed-avatar--fallback">{initial}</div>;
}

function authorName(author) {
  return author?.display_name || author?.email?.split("@")[0] || "Someone";
}

function ActivityFeedSkeleton() {
  return (
    <div className="activity-feed">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 15, width: `${55 + i * 4}%`, marginBottom: 7 }} />
            <div className="skeleton" style={{ height: 12, width: '20%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ActivityFeed({ user, onBack, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { t } = useTranslation();
  const { data: items = [], isLoading } = useActivityFeed(user.id);

  return (
    <div className="feed-wrap">
      <AppLayout navigate={navigate} user={user} currentPage="activityFeed">
      <div className="feed-inner">
        <div className="feed-header">
          <button className="back-btn" onClick={onBack}>{t("common.back")}</button>
          <h1 className="feed-title">{t("feed.title")}</h1>
          <p className="feed-sub">{t("feed.subtitle")}</p>
        </div>

        {isLoading ? (
          <ActivityFeedSkeleton />
        ) : items.length === 0 ? (
          <div className="feed-empty">
            <div className="feed-empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
            <h3>{t("feed.empty")}</h3>
            <p>{t("feed.emptySub")}</p>
          </div>
        ) : (
          <div className="feed-list">
            {items.map((item, i) => (
              <div
                key={`${item.type}-${item.id ?? item.authorId}-${item.ts}-${i}`}
                className={`feed-item feed-item--${item.type}`}
                onClick={item.type === "thread" ? () => navigate("forum", { threadId: item.id }) : undefined}
                style={item.type === "thread" ? { cursor: "pointer" } : undefined}
              >
                <button
                  className="feed-item-avatar-btn"
                  onClick={e => { e.stopPropagation(); navigate("publicProfile", { userId: item.authorId }); }}
                >
                  <FeedAvatar author={item.author} />
                </button>
                <div className="feed-item-body">
                  <div className="feed-item-meta">
                    <button
                      className="feed-item-name"
                      onClick={e => { e.stopPropagation(); navigate("publicProfile", { userId: item.authorId }); }}
                    >
                      {authorName(item.author)}
                    </button>
                    {item.type === "thread" && (
                      <span className="feed-item-action"> {t("feed.startedThread")} <span className="feed-item-detail">"{item.title}"</span></span>
                    )}
                    {item.type === "badge" && (
                      <span className="feed-item-action"> {t("feed.earnedBadge")} <span className="feed-item-badge">{LEVEL_EMOJIS[item.level]} {t("feed.levelLabel", { level: item.level })}</span></span>
                    )}
                    {item.type === "post" && (
                      <span className="feed-item-action"> {t("feed.sharedUpdate")}</span>
                    )}
                  </div>
                  {item.type === "post" && (
                    <p className="feed-post-content">{item.content}</p>
                  )}
                  <span className="feed-item-time">{timeAgo(item.ts, t)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </AppLayout>
    </div>
  );
}
