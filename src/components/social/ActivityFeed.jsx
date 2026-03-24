import { useTranslation } from "react-i18next";
import PageNav from "../PageNav";
import { useActivityFeed } from "../../hooks/useFollows";
import "../../styles/social.css";

const LEVEL_EMOJIS = [null, "📖","📚","🌱","👨‍👩‍👦","🏺","⚔️","🎵","📯","✝️","🌍","🔮","👑"];

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
    return <img className="feed-avatar" src={author.avatar_url} alt="" />;
  }
  return <div className="feed-avatar feed-avatar--fallback">{initial}</div>;
}

function authorName(author) {
  return author?.display_name || author?.email?.split("@")[0] || "Someone";
}

export default function ActivityFeed({ user, navigate, darkMode, setDarkMode, i18n }) {
  const { t } = useTranslation();
  const { data: items = [], isLoading } = useActivityFeed(user.id);

  return (
    <div className="feed-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} />

      <div className="feed-inner">
        <div className="feed-header">
          <h1 className="feed-title">{t("feed.title")}</h1>
          <p className="feed-sub">{t("feed.subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="feed-loading">
            <div className="feed-spinner" />
          </div>
        ) : items.length === 0 ? (
          <div className="feed-empty">
            <div className="feed-empty-icon">👥</div>
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
    </div>
  );
}
