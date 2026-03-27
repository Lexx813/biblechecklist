import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePublishedPosts } from "../hooks/useBlog";
import { useTopThreads } from "../hooks/useForum";
import { useFullProfile, useUpdateProfile } from "../hooks/useAdmin";
import { useReadingStreak } from "../hooks/useProgress";
import DailyVerse from "./home/DailyVerse";
import PageNav from "./PageNav";
import PageFooter from "./PageFooter";
import OnboardingModal, { useOnboarding } from "./OnboardingModal";
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

function formatNum(n) {
  return (n ?? 0).toLocaleString();
}

function BlogSkeleton() {
  return (
    <div className="home-blog-grid">
      {[0, 1, 2].map(i => (
        <div key={i} className={`home-blog-card${i === 0 ? " home-blog-card--featured" : ""}`}>
          <div className="home-blog-cover skeleton" />
          <div className="home-blog-body" style={{ gap: 8 }}>
            <div className="skeleton" style={{ height: 12, width: "60%", borderRadius: 6 }}>&nbsp;</div>
            <div className="skeleton" style={{ height: 18, width: "90%", borderRadius: 6 }}>&nbsp;</div>
            <div className="skeleton" style={{ height: 12, width: "45%", borderRadius: 6 }}>&nbsp;</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ForumSkeleton() {
  return (
    <div className="home-forum-list">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="home-forum-row" style={{ pointerEvents: "none" }}>
          <div className="home-forum-row-body" style={{ gap: 8 }}>
            <div className="skeleton" style={{ height: 16, width: "70%", borderRadius: 6 }}>&nbsp;</div>
            <div className="skeleton" style={{ height: 11, width: "40%", borderRadius: 6 }}>&nbsp;</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage({ user, navigate, onLogout, darkMode, setDarkMode, i18n }) {
  const { t } = useTranslation();
  const { data: posts = [], isLoading: postsLoading } = usePublishedPosts();
  const { data: topThreads = [], isLoading: threadsLoading } = useTopThreads(4);
  const { data: profile } = useFullProfile(user?.id);
  const updateProfile = useUpdateProfile(user?.id);
  const { data: streak = { current_streak: 0, longest_streak: 0 } } = useReadingStreak(user?.id);
  const [showOnboarding, closeOnboarding] = useOnboarding();
  const [notifDismissed, setNotifDismissed] = useState(() => !!localStorage.getItem("nwt-notif-dismissed"));

  const showNotifBanner = user && profile && !profile.email_notifications_blog && !notifDismissed;

  function handleEnableNotif() {
    updateProfile.mutate({ email_notifications_blog: true });
    setNotifDismissed(true);
  }

  function handleDismissNotif() {
    localStorage.setItem("nwt-notif-dismissed", "1");
    setNotifDismissed(true);
  }

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

      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />

      {/* ── Hero ── */}
      <main id="main-content">
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

      {/* ── Daily Verse ── */}
      <section className="home-section home-section--verse">
        <DailyVerse user={user} />
      </section>

      {/* ── Streak banner ── */}
      {streak.current_streak > 0 && (
        <section className="home-section home-section--slim">
          <div className="home-streak-banner" onClick={() => navigate("profile")}>
            <span className="home-streak-fire">🔥</span>
            <span className="home-streak-text">
              <strong>{streak.current_streak}</strong>-{t("home.streakDay")} {t("home.streakLabel")}
            </span>
            {streak.longest_streak > streak.current_streak && (
              <span className="home-streak-best">🏆 {t("home.streakBest")}: {streak.longest_streak}</span>
            )}
          </div>
        </section>
      )}

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

      {/* ── Leaderboard CTA ── */}
      <section className="home-section home-section--compact">
        <div className="home-lb-cta" onClick={() => navigate("leaderboard")}>
          <span className="home-lb-icon">🏆</span>
          <div>
            <div className="home-lb-title">{t("home.leaderboardTitle")}</div>
            <div className="home-lb-sub">{t("home.leaderboardSub")}</div>
          </div>
          <span className="home-lb-arrow">›</span>
        </div>
      </section>

      {/* ── Quiz section ── */}
      <section className="home-section">
        <div className="home-section-label">{t("quiz.homeLabel")}</div>
        <h2 className="home-section-title">{t("quiz.homeTitle")}</h2>
        <p className="home-section-sub">{t("quiz.homeSub")}</p>

        <div className="home-tracker-card" onClick={() => navigate("quiz")}>
          <div className="home-tracker-visual">
            <div className="home-tracker-glow" />
            <div className="home-tracker-icon-wrap">
              <span className="home-tracker-big-icon">🏆</span>
            </div>
            <div className="home-tracker-stats-preview">
              <div className="home-tracker-stat-pill">12 Levels</div>
              <div className="home-tracker-stat-pill">240 Questions</div>
              <div className="home-tracker-stat-pill">Earn Badges</div>
            </div>
          </div>
          <div className="home-tracker-info">
            <h3 className="home-tracker-title">{t("quiz.homeTitle")}</h3>
            <p className="home-tracker-desc">{t("quiz.homeSub")}</p>
            <span className="home-tracker-cta">{t("quiz.homeCard")}</span>
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

        {postsLoading ? <BlogSkeleton /> : blogPreview.length === 0 ? (
          <div className="home-empty">
            <div className="home-empty-icon">✍️</div>
            <p className="home-empty-title">No posts yet</p>
            <p className="home-empty-sub">Be the first to share something with the community.</p>
            <button className="home-empty-btn" onClick={() => navigate("blogDash")}>Write a post →</button>
          </div>
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
                    <span className="home-blog-badge">👍 {formatNum(post.like_count)}</span>
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

        {threadsLoading ? <ForumSkeleton /> : topThreads.length === 0 ? (
          <div className="home-empty">
            <div className="home-empty-icon">💬</div>
            <p className="home-empty-title">No discussions yet</p>
            <p className="home-empty-sub">Start the first conversation in the community.</p>
            <button className="home-empty-btn" onClick={() => navigate("forum")}>Start a thread →</button>
          </div>
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
                    <span className="home-forum-stat">👍 {formatNum(thread.like_count)}</span>
                  )}
                  <span className="home-forum-stat">
                    💬 {formatNum(thread.forum_replies?.[0]?.count ?? 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>


      </main>

      {showNotifBanner && (
        <div className="home-notif-banner">
          <span className="home-notif-icon">🔔</span>
          <div className="home-notif-text">
            <strong>{t("home.notifBannerTitle")}</strong>
            <span>{t("home.notifBannerSub")}</span>
          </div>
          <button className="home-notif-enable" onClick={handleEnableNotif} disabled={updateProfile.isPending}>
            {t("home.notifEnable")}
          </button>
          <button className="home-notif-dismiss" onClick={handleDismissNotif} aria-label="Dismiss">✕</button>
        </div>
      )}

      <PageFooter />
      {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}
    </div>
  );
}
