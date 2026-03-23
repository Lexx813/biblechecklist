import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePublishedPosts } from "../hooks/useBlog";
import { useTopThreads } from "../hooks/useForum";
import "../styles/home.css";

const GRADIENTS = [
  "linear-gradient(135deg, #341C5C 0%, #6A3DAA 100%)",
  "linear-gradient(135deg, #4F2D85 0%, #9B59B6 100%)",
  "linear-gradient(135deg, #1A1035 0%, #4F2D85 100%)",
  "linear-gradient(135deg, #6A3DAA 0%, #C084FC 100%)",
  "linear-gradient(135deg, #2D1B4E 0%, #8E44AD 100%)",
  "linear-gradient(135deg, #3B1F6E 0%, #7B2FBE 100%)",
];

function getGradient(id) {
  return GRADIENTS[(id?.charCodeAt(0) ?? 0) % GRADIENTS.length];
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function authorName(obj) {
  return obj?.profiles?.display_name || obj?.profiles?.email?.split("@")[0] || "Anonymous";
}

export default function HomePage({ user, profile, navigate, onLogout, darkMode, setDarkMode, i18n }) {
  const { t } = useTranslation();
  const { data: posts = [] } = usePublishedPosts();
  const { data: topThreads = [] } = useTopThreads(4);

  const blogPreview = useMemo(() => {
    const byLikes = [...posts].sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0));
    const top2 = byLikes.slice(0, 2);
    const newest = posts[0];
    const seen = new Set(top2.map(p => p.id));
    const result = [...top2];
    if (newest && !seen.has(newest.id)) result.push(newest);
    return result.slice(0, 3);
  }, [posts]);

  return (
    <div className="home-wrap">

      {/* ── Nav ── */}
      <nav className="home-nav">
        <div className="home-nav-brand">
          <span className="home-nav-logo-icon">📖</span>
          <span className="home-nav-logo-text">BibleTracker</span>
        </div>
        <div className="home-nav-links">
          <button className="home-nav-link" onClick={() => navigate("main")}>{t("home.navTracker")}</button>
          <button className="home-nav-link" onClick={() => navigate("blog")}>{t("app.blog")}</button>
          <button className="home-nav-link" onClick={() => navigate("forum")}>{t("app.forum")}</button>
        </div>
        <div className="home-nav-actions">
          <button className="home-nav-ghost" onClick={() => setDarkMode(d => !d)}>
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button className="home-nav-ghost" onClick={() => i18n.changeLanguage(i18n.language.startsWith("es") ? "en" : "es")}>
            {i18n.language.startsWith("es") ? "EN" : "ES"}
          </button>
          {profile?.is_admin && (
            <button className="home-nav-ghost" onClick={() => navigate("admin")}>{t("app.admin")}</button>
          )}
          <button className="home-nav-avatar" onClick={() => navigate("profile")}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" />
              : <span>{(profile?.display_name || user.email)?.[0]?.toUpperCase()}</span>
            }
          </button>
          <button className="home-nav-ghost" onClick={onLogout}>{t("app.logOut")}</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="home-hero">
        <div className="home-hero-glow home-hero-glow--1" />
        <div className="home-hero-glow home-hero-glow--2" />
        <div className="home-hero-glow home-hero-glow--3" />
        <div className="home-hero-inner">
          <div className="home-hero-badge">{t("home.heroBadge")}</div>
          <h1 className="home-hero-title">
            {t("home.heroTitleLine1")}<br />{t("home.heroTitleLine2")}<br />{t("home.heroTitleLine3")}
          </h1>
          <p className="home-hero-sub">{t("home.heroSub")}</p>
          <div className="home-hero-btns">
            <button className="home-hero-cta" onClick={() => navigate("main")}>
              {t("home.heroCta")}
            </button>
            <button className="home-hero-secondary" onClick={() => navigate("blog")}>
              {t("home.heroSecondary")}
            </button>
          </div>
        </div>
      </div>

      {/* ── Bible Tracker section ── */}
      <section className="home-section">
        <div className="home-section-label">{t("home.trackerLabel")}</div>
        <h2 className="home-section-title">{t("home.trackerTitle")}</h2>
        <p className="home-section-sub">{t("home.trackerSub")}</p>

        <div className="home-tracker-card" onClick={() => navigate("main")}>
          <div className="home-tracker-visual">
            <div className="home-tracker-glow" />
            <div className="home-tracker-icon-wrap">
              <span className="home-tracker-big-icon">📖</span>
            </div>
            <div className="home-tracker-stats-preview">
              <div className="home-tracker-stat-pill">{t("home.trackerStat1")}</div>
              <div className="home-tracker-stat-pill">{t("home.trackerStat2")}</div>
              <div className="home-tracker-stat-pill">{t("home.trackerStat3")}</div>
            </div>
          </div>
          <div className="home-tracker-info">
            <h3 className="home-tracker-title">{t("home.trackerCardTitle")}</h3>
            <p className="home-tracker-desc">{t("home.trackerCardDesc")}</p>
            <ul className="home-tracker-features">
              <li>{t("home.trackerFeature1")}</li>
              <li>{t("home.trackerFeature2")}</li>
              <li>{t("home.trackerFeature3")}</li>
              <li>{t("home.trackerFeature4")}</li>
            </ul>
            <span className="home-tracker-cta">{t("home.trackerCta")}</span>
          </div>
        </div>
      </section>

      {/* ── Blog section ── */}
      <section className="home-section">
        <div className="home-section-label">{t("home.blogLabel")}</div>
        <div className="home-section-row">
          <div>
            <h2 className="home-section-title">{t("home.blogTitle")}</h2>
            <p className="home-section-sub">{t("home.blogSub")}</p>
          </div>
          <button className="home-section-link" onClick={() => navigate("blog")}>
            {t("home.blogViewAll")}
          </button>
        </div>

        {blogPreview.length === 0 ? (
          <div className="home-empty">{t("home.blogEmpty")}</div>
        ) : (
          <div className="home-blog-grid">
            {blogPreview.map((post, i) => (
              <article
                key={post.id}
                className={`home-blog-card${i === 0 ? " home-blog-card--featured" : ""}`}
                onClick={() => navigate("blog", { slug: post.slug })}
              >
                <div
                  className="home-blog-cover"
                  style={{ background: post.cover_url ? undefined : getGradient(post.id) }}
                >
                  {post.cover_url && <img src={post.cover_url} alt="" />}
                  {post.like_count > 0 && (
                    <span className="home-blog-badge">👍 {post.like_count}</span>
                  )}
                </div>
                <div className="home-blog-body">
                  <p className="home-blog-excerpt">{post.excerpt}</p>
                  <h3 className="home-blog-title">{post.title}</h3>
                  <div className="home-blog-meta">
                    <span className="home-blog-author">{authorName(post)}</span>
                    <span className="home-dot">·</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── Forum section ── */}
      <section className="home-section">
        <div className="home-section-label">{t("home.forumLabel")}</div>
        <div className="home-section-row">
          <div>
            <h2 className="home-section-title">{t("home.forumTitle")}</h2>
            <p className="home-section-sub">{t("home.forumSub")}</p>
          </div>
          <button className="home-section-link" onClick={() => navigate("forum")}>
            {t("home.forumViewAll")}
          </button>
        </div>

        {topThreads.length === 0 ? (
          <div className="home-empty">{t("home.forumEmpty")}</div>
        ) : (
          <div className="home-forum-list">
            {topThreads.map(thread => (
              <div
                key={thread.id}
                className="home-forum-row"
                onClick={() => navigate("forum", { categoryId: thread.category_id, threadId: thread.id })}
              >
                <div className="home-forum-row-body">
                  <h4 className="home-forum-row-title">{thread.title}</h4>
                  <div className="home-forum-row-meta">
                    <span>{authorName(thread)}</span>
                    <span className="home-dot">·</span>
                    <span>{formatDate(thread.updated_at)}</span>
                  </div>
                </div>
                <div className="home-forum-row-stats">
                  {thread.like_count > 0 && (
                    <span className="home-forum-stat">👍 {thread.like_count}</span>
                  )}
                  <span className="home-forum-stat">
                    💬 {thread.forum_replies?.[0]?.count ?? 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="home-footer">
        <p>{t("home.footer")}</p>
      </footer>
    </div>
  );
}
