import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePublishedPosts } from "../hooks/useBlog";
import { useTopThreads } from "../hooks/useForum";
import { usePublicNotes, useToggleNoteLike } from "../hooks/useStudyNotes";
import { formatDate, authorName, formatNum } from "../utils/formatters";
import { BOOKS } from "../data/books";
import { useFullProfile, useUpdateProfile } from "../hooks/useAdmin";
import { useReadingStreak } from "../hooks/useProgress";
import DailyVerse from "../components/home/DailyVerse";
import PageNav from "../components/PageNav";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import OnboardingModal, { useOnboarding } from "../components/OnboardingModal";
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

export default function HomePage({ user, navigate, onLogout, darkMode, setDarkMode, i18n, isPremium, onUpgrade }) {
  const { t } = useTranslation();
  const { data: posts = [], isLoading: postsLoading } = usePublishedPosts();
  const { data: topThreads = [], isLoading: threadsLoading } = useTopThreads(4);
  const { data: publicNotes = [], isLoading: notesLoading } = usePublicNotes();
  const toggleNoteLike = useToggleNoteLike();
  const previewNotes = publicNotes.slice(0, 4);
  const { data: profile } = useFullProfile(user?.id);
  const updateProfile = useUpdateProfile(user?.id);
  const { data: streak = { current_streak: 0, longest_streak: 0 }, isLoading: streakLoading } = useReadingStreak(user?.id);
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

      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout}  onUpgrade={onUpgrade}/>

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

      {/* ── Streak banner — always rendered to reserve layout space and prevent CLS ── */}
      <section className="home-section home-section--slim">
        {streakLoading ? (
          <div className="home-streak-skeleton" />
        ) : streak.current_streak > 0 ? (
          <button className="home-streak-banner" onClick={() => navigate("profile")}>
            <span className="home-streak-fire" aria-hidden="true">🔥</span>
            <span className="home-streak-text">
              <strong>{streak.current_streak}</strong>-{t("home.streakDay")} {t("home.streakLabel")}
            </span>
            {streak.longest_streak > streak.current_streak && (
              <span className="home-streak-best"><span aria-hidden="true">🏆</span> {t("home.streakBest")}: {streak.longest_streak}</span>
            )}
          </button>
        ) : null}
      </section>

      {/* ── Premium upsell banner — free users only ── */}
      {!isPremium && (
        <section className="home-section home-section--slim">
          <button className="home-premium-banner" onClick={onUpgrade}>
            <span className="home-premium-banner-icon" aria-hidden="true">✦</span>
            <div className="home-premium-banner-text">
              <strong>{t("upm.bannerTitle")}</strong>
              <span>{t("upm.bannerSub")}</span>
            </div>
            <span className="home-premium-banner-cta">{t("upm.bannerCta")}</span>
          </button>
        </section>
      )}

      {/* ── Bible Tracker section ── */}
      <section className="home-section">
        <SectionHeader label={t("home.trackerLabel")} title={t("home.trackerTitle")} sub={t("home.trackerSub")} />

        <button className="home-tracker-card" onClick={() => navigate("main")}>
          <div className="home-tracker-visual">
            <div className="home-tracker-glow" />
            <div className="home-tracker-icon-wrap">
              <span className="home-tracker-big-icon" aria-hidden="true">📖</span>
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
        </button>
      </section>

      {/* ── Leaderboard CTA ── */}
      <section className="home-section home-section--compact">
        <button className="home-lb-cta" onClick={() => navigate("leaderboard")}>
          <span className="home-lb-icon" aria-hidden="true">🏆</span>
          <div>
            <div className="home-lb-title">{t("home.leaderboardTitle")}</div>
            <div className="home-lb-sub">{t("home.leaderboardSub")}</div>
          </div>
          <span className="home-lb-arrow">›</span>
        </button>
      </section>

      {/* ── Quiz section ── */}
      <section className="home-section">
        <SectionHeader label={t("quiz.homeLabel")} title={t("quiz.homeTitle")} sub={t("quiz.homeSub")} />

        <button className="home-tracker-card" onClick={() => navigate("quiz")}>
          <div className="home-tracker-visual">
            <div className="home-tracker-glow" />
            <div className="home-tracker-icon-wrap">
              <span className="home-tracker-big-icon" aria-hidden="true">🏆</span>
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
        </button>
      </section>

      {/* ── Community Notes section ── */}
      <section className="home-section">
        <SectionHeader
          label={t("home.notesLabel")}
          title={t("home.notesTitle")}
          sub={t("home.notesSub")}
          onViewAll={() => navigate("studyNotes", { tab: "public" })}
          viewAllLabel={t("home.notesViewAll")}
        />

        {notesLoading ? <ForumSkeleton /> : previewNotes.length === 0 ? (
          <EmptyState icon="📝" title={t("home.notesEmpty")} sub={t("home.notesEmptySub")} btnLabel={t("home.notesWriteBtn")} onBtn={() => navigate("studyNotes", { tab: "public" })} />
        ) : (
          <div className="home-forum-list">
            {previewNotes.map(note => {
              const passage = note.book_index != null
                ? `${BOOKS[note.book_index]?.name ?? ""} ${note.chapter ?? ""}`.trim()
                : null;
              return (
                <div key={note.id} className="home-forum-row" onClick={() => navigate("studyNotes", { tab: "public" })}>
                  <div className="home-note-row-left">
                    <button
                      className="home-note-avatar"
                      onClick={e => { e.stopPropagation(); navigate("publicProfile", { userId: note.user_id }); }}
                      title={note.author?.display_name ?? "Anonymous"}
                    >
                      {note.author?.avatar_url
                        ? <img src={note.author.avatar_url} alt={note.author.display_name} className="home-note-avatar-img" />
                        : <span className="home-note-avatar-initials">{(note.author?.display_name ?? "A")[0].toUpperCase()}</span>
                      }
                    </button>
                    <div className="home-forum-row-body">
                      <h4 className="home-forum-row-title">{note.title || "Untitled"}</h4>
                      <div className="home-forum-row-meta">
                        <span>{note.author?.display_name ?? "Anonymous"}</span>
                        {passage && <><span className="home-dot">·</span><span>📖 {passage}</span></>}
                        <span className="home-dot">·</span>
                        <span>{formatDate(note.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="home-forum-row-stats">
                    <button
                      className={`home-forum-stat home-note-like-btn${note.user_has_liked ? " home-note-like-btn--liked" : ""}`}
                      onClick={e => { e.stopPropagation(); toggleNoteLike.mutate(note.id); }}
                      aria-label={note.user_has_liked ? "Unlike" : "Like"}
                    >
                      {note.user_has_liked ? "♥" : "♡"} {note.like_count > 0 ? note.like_count : ""}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Blog section ── */}
      <section className="home-section">
        <SectionHeader
          label={t("home.blogLabel")}
          title={t("home.blogTitle")}
          sub={t("home.blogSub")}
          onViewAll={() => navigate("blog")}
          viewAllLabel={t("home.blogViewAll")}
        />

        {postsLoading ? <BlogSkeleton /> : blogPreview.length === 0 ? (
          <EmptyState icon="✍️" title="No posts yet" sub="Be the first to share something with the community." btnLabel="Write a post →" onBtn={() => navigate("blogDash")} />
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
                  {post.cover_url && <img src={post.cover_url} alt={post.title} loading="lazy" />}
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
        <SectionHeader
          label={t("home.forumLabel")}
          title={t("home.forumTitle")}
          sub={t("home.forumSub")}
          onViewAll={() => navigate("forum")}
          viewAllLabel={t("home.forumViewAll")}
        />

        {threadsLoading ? <ForumSkeleton /> : topThreads.length === 0 ? (
          <EmptyState icon="💬" title="No discussions yet" sub="Start the first conversation in the community." btnLabel="Start a thread →" onBtn={() => navigate("forum")} />
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

      {showOnboarding && <OnboardingModal onClose={closeOnboarding} onUpgrade={onUpgrade} />}
    </div>
  );
}
