import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { usePublishedPosts } from "../hooks/useBlog";
import { useTopThreads } from "../hooks/useForum";
import { usePublicNotes, useToggleNoteLike } from "../hooks/useStudyNotes";
import { formatDate, authorName, formatNum } from "../utils/formatters";
import { BOOKS } from "../data/books";
import { useFullProfile, useUpdateProfile } from "../hooks/useAdmin";
import { useReadingStreak } from "../hooks/useProgress";
import DailyVerse from "../components/home/DailyVerse";
import TodaysFocusCard from "../components/home/TodaysFocusCard";
import PageNav from "../components/PageNav";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import OnboardingModal, { useOnboarding } from "../components/OnboardingModal";
import UpgradePrompt, { isDismissed, dismissPrompt } from "../components/UpgradePrompt";
import "../styles/home.css";

const GRADIENTS = [
  "linear-gradient(135deg, #341C5C 0%, #6A3DAA 100%)",
  "linear-gradient(135deg, #4F2D85 0%, #9B59B6 100%)",
  "linear-gradient(135deg, #1A1035 0%, #4F2D85 100%)",
  "linear-gradient(135deg, #6A3DAA 0%, #C084FC 100%)",
  "linear-gradient(135deg, #2D1B4E 0%, #8E44AD 100%)",
  "linear-gradient(135deg, #3B1F6E 0%, #7B2FBE 100%)",
];

const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];

const BANNER_ROTATIONS = [
  {
    icon: "📅",
    title: "Reading Plans",
    sub: "Daily assignments. Streaks. Finish the Bible in 1 year.",
    cta: "Explore Plans →",
  },
  {
    icon: "📝",
    title: "Study Notes",
    sub: "Rich-text notes for any chapter. Export to Markdown or PDF.",
    cta: "Try Notes →",
  },
  {
    icon: "✨",
    title: "AI Study Assistant",
    sub: "Ask anything about any verse. Grounded in Scripture.",
    cta: "Try AI Tools →",
  },
  {
    icon: "📋",
    title: "Meeting Prep",
    sub: "CLAM + Watchtower checklists. Never miss an assignment.",
    cta: "Open Meeting Prep →",
  },
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
  const lang = i18n?.language?.split("-")[0] ?? "en";
  const { data: posts = [], isLoading: postsLoading } = usePublishedPosts();
  const { data: topThreads = [], isLoading: threadsLoading } = useTopThreads(4);
  const { data: publicNotes = [], isLoading: notesLoading } = usePublicNotes();
  const toggleNoteLike = useToggleNoteLike();
  const previewNotes = publicNotes.slice(0, 4);
  const { data: profile } = useFullProfile(user?.id);
  const updateProfile = useUpdateProfile(user?.id);
  const { data: streak = { current_streak: 0, longest_streak: 0 }, isLoading: streakLoading } = useReadingStreak(user?.id);
  const [showOnboarding, closeOnboarding] = useOnboarding(user?.created_at);
  const [notifDismissed, setNotifDismissed] = useState(() => !!localStorage.getItem("nwt-notif-dismissed"));
  const [showStreakPrompt, setShowStreakPrompt] = useState(false);
  const [streakMilestone, setStreakMilestone] = useState(null);

  const showNotifBanner = user && profile && !profile.email_notifications_blog && !notifDismissed;

  useEffect(() => {
    if (isPremium || streakLoading) return;
    const n = streak.current_streak;
    if (!STREAK_MILESTONES.includes(n)) return;
    const key = `streak-milestone-${n}`;
    if (!isDismissed(key)) {
      setStreakMilestone(n);
      setShowStreakPrompt(true);
    }
  }, [streak.current_streak, isPremium, streakLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const bannerRotation = BANNER_ROTATIONS[Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % BANNER_ROTATIONS.length];

  return (
    <div className="home-wrap">

      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} currentPage="home" onUpgrade={onUpgrade}/>

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

      {/* ── Desktop 2-column grid ── */}
      <div className="home-body-grid">

        {/* ── MAIN column: feature cards ── */}
        <div className="home-col-main">

          {/* ── Today's Focus ── */}
          <section className="home-section">
            <TodaysFocusCard
              userId={user?.id}
              navigate={navigate}
              isPremium={isPremium}
              onUpgrade={onUpgrade}
              lang={lang}
            />
          </section>

          {/* Bible Tracker */}
          <section className="home-section">
            <SectionHeader label={t("home.trackerLabel")} title={t("home.trackerTitle")} sub={t("home.trackerSub")} />
            <button className="home-tracker-card" onClick={() => navigate("main")}>
              <div className="home-tracker-visual">
                <div className="home-tracker-glow" />
                <div className="home-tracker-icon-wrap">
                  <span className="home-tracker-big-icon" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span>
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

          {/* Quiz */}
          <section className="home-section">
            <SectionHeader label={t("quiz.homeLabel")} title={t("quiz.homeTitle")} sub={t("quiz.homeSub")} />
            <div className="home-quiz-grid">
              <button className="home-quiz-card" onClick={() => navigate("quiz")}>
                <div className="home-quiz-card-banner">
                  <div className="home-quiz-card-glow" />
                  <div className="home-quiz-card-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                      <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                    </svg>
                  </div>
                </div>
                <div className="home-quiz-card-body">
                  <h3 className="home-quiz-card-title">{t("quiz.homeTitle")}</h3>
                  <p className="home-quiz-card-desc">{t("quiz.homeSub")}</p>
                  <div className="home-quiz-chips">
                    <span className="home-quiz-chip">24 Levels</span>
                    <span className="home-quiz-chip">480 Questions</span>
                    <span className="home-quiz-chip">Badges</span>
                  </div>
                  <span className="home-quiz-card-cta">{t("quiz.homeCard")}</span>
                </div>
              </button>
              <button className="home-quiz-card home-quiz-card--family" onClick={() => navigate("familyQuiz")}>
                <div className="home-quiz-card-banner">
                  <div className="home-quiz-card-glow" />
                  <div className="home-quiz-card-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                </div>
                <div className="home-quiz-card-body">
                  <h3 className="home-quiz-card-title">Family Bible Challenge</h3>
                  <p className="home-quiz-card-desc">Challenge your family and friends with a custom quiz and see who scores highest.</p>
                  <div className="home-quiz-chips">
                    <span className="home-quiz-chip">Create a Quiz</span>
                    <span className="home-quiz-chip">Share Link</span>
                    <span className="home-quiz-chip">Leaderboard</span>
                  </div>
                  <span className="home-quiz-card-cta">Create a challenge →</span>
                </div>
              </button>
            </div>
          </section>

          {/* Blog */}
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
                    <div className="home-blog-cover" style={{ background: post.cover_url ? undefined : getGradient(post.id) }}>
                      {post.cover_url && <img src={post.cover_url} alt={post.title} loading="lazy" width={400} height={200} />}
                      {post.like_count > 0 && (
                        <span className="home-blog-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 22V11l5-9a1 1 0 0 1 1.8.5L13 7h7a2 2 0 0 1 2 2.4l-2 10A2 2 0 0 1 18 21H7zM2 11h3v11H2z"/></svg> {formatNum(post.like_count)}</span>
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

        </div>{/* end .home-col-main */}

        {/* ── SIDE column: widgets + community ── */}
        <div className="home-col-side">

          {/* Daily Verse */}
          <section className="home-section home-section--verse">
            <DailyVerse user={user} />
          </section>

          {/* Streak banner */}
          {!streakLoading && streak.current_streak > 0 && (
            <section className="home-section home-section--slim">
              <button className="home-streak-banner" onClick={() => navigate("profile")}>
                <span className="home-streak-fire" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 23c-4.97 0-8-3.03-8-7 0-2.44 1.34-4.81 2.5-6.35A1 1 0 0 1 8.18 10c.34 1.14 1.1 2.13 2.05 2.75C10.31 10 12 6 12 2a1 1 0 0 1 1.66-.75c2.24 1.92 5.84 5.63 5.84 10.75 0 5.68-3.55 11-7.5 11z"/></svg></span>
                <span className="home-streak-text">
                  <strong>{streak.current_streak}</strong>-{t("home.streakDay")} {t("home.streakLabel")}
                </span>
                {streak.longest_streak > streak.current_streak && (
                  <span className="home-streak-best"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 3h14l-1.5 5H18a5 5 0 0 1-4 4.9V17h3a1 1 0 1 1 0 2H7a1 1 0 1 1 0-2h3v-4.1A5 5 0 0 1 6 8h-.5L4 3h1zm7 10a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3z"/></svg> {t("home.streakBest")}: {streak.longest_streak}</span>
                )}
              </button>
            </section>
          )}

          {/* Premium upsell banner */}
          {!isPremium && (
            <section className="home-section home-section--slim">
              <button className="home-premium-banner" onClick={onUpgrade}>
                <span className="home-premium-banner-icon" aria-hidden="true">{bannerRotation.icon}</span>
                <div className="home-premium-banner-text">
                  <strong>{bannerRotation.title}</strong>
                  <span>{bannerRotation.sub}</span>
                </div>
                <span className="home-premium-banner-cta">{bannerRotation.cta}</span>
              </button>
            </section>
          )}

          {/* Leaderboard CTA */}
          <section className="home-section home-section--compact">
            <button className="home-lb-cta" onClick={() => navigate("leaderboard")}>
              <span className="home-lb-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3h14l-1.5 5H18a5 5 0 0 1-4 4.9V17h3a1 1 0 1 1 0 2H7a1 1 0 1 1 0-2h3v-4.1A5 5 0 0 1 6 8h-.5L4 3h1zm7 10a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3z"/></svg></span>
              <div>
                <div className="home-lb-title">{t("home.leaderboardTitle")}</div>
                <div className="home-lb-sub">{t("home.leaderboardSub")}</div>
              </div>
              <span className="home-lb-arrow">›</span>
            </button>
          </section>

          {/* Community Notes */}
          <section className="home-section">
            <SectionHeader
              label={t("home.notesLabel")}
              title={t("home.notesTitle")}
              sub={t("home.notesSub")}
              onViewAll={() => navigate("studyNotes", { tab: "public" })}
              viewAllLabel={t("home.notesViewAll")}
            />
            {notesLoading ? <ForumSkeleton /> : previewNotes.length === 0 ? (
              <EmptyState icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>} title={t("home.notesEmpty")} sub={t("home.notesEmptySub")} btnLabel={t("home.notesWriteBtn")} onBtn={() => navigate("studyNotes", { tab: "public" })} />
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
                            ? <img src={note.author.avatar_url} alt={note.author.display_name} className="home-note-avatar-img" width={32} height={32} />
                            : <span className="home-note-avatar-initials">{(note.author?.display_name ?? "A")[0].toUpperCase()}</span>
                          }
                        </button>
                        <div className="home-forum-row-body">
                          <h4 className="home-forum-row-title">{note.title || "Untitled"}</h4>
                          <div className="home-forum-row-meta">
                            <span>{note.author?.display_name ?? "Anonymous"}</span>
                            {passage && <><span className="home-dot">·</span><span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:3}}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>{passage}</span></>}
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

          {/* Forum */}
          <section className="home-section">
            <SectionHeader
              label={t("home.forumLabel")}
              title={t("home.forumTitle")}
              sub={t("home.forumSub")}
              onViewAll={() => navigate("forum")}
              viewAllLabel={t("home.forumViewAll")}
            />
            {threadsLoading ? <ForumSkeleton /> : topThreads.length === 0 ? (
              <EmptyState icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} title="No discussions yet" sub="Start the first conversation in the community." btnLabel="Start a thread →" onBtn={() => navigate("forum")} />
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
                        <span className="home-forum-stat"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 22V11l5-9a1 1 0 0 1 1.8.5L13 7h7a2 2 0 0 1 2 2.4l-2 10A2 2 0 0 1 18 21H7zM2 11h3v11H2z"/></svg> {formatNum(thread.like_count)}</span>
                      )}
                      <span className="home-forum-stat">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> {formatNum(thread.forum_replies?.[0]?.count ?? 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>{/* end .home-col-side */}

      </div>{/* end .home-body-grid */}


      </main>

      {showStreakPrompt && (
        <UpgradePrompt
          icon="🔥"
          title={`${streak.current_streak}-day streak!`}
          message="Keep it structured — reading plans give you a daily assignment so you always know exactly what to read next."
          ctaLabel="View Reading Plans"
          onCta={() => {
            dismissPrompt(`streak-milestone-${streakMilestone}`);
            setShowStreakPrompt(false);
            navigate("readingPlans");
          }}
          onDismiss={() => {
            dismissPrompt(`streak-milestone-${streakMilestone}`);
            setShowStreakPrompt(false);
          }}
        />
      )}

      {showNotifBanner && (
        <div className="home-notif-banner">
          <span className="home-notif-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></span>
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

      {showOnboarding && (
        <OnboardingModal
          onClose={closeOnboarding}
          onUpgrade={onUpgrade}
          navigate={navigate}
          user={user}
        />
      )}
    </div>
  );
}
