// @ts-nocheck
import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { usePublishedPosts } from "../hooks/useBlog";
import { useTopThreads } from "../hooks/useForum";
import { usePublicNotes, useToggleNoteLike } from "../hooks/useStudyNotes";
import { formatDate, authorName, formatNum } from "../utils/formatters";
import { BOOKS } from "../data/books";
import { useFullProfile, useUpdateProfile } from "../hooks/useAdmin";
import { useReadingStreak } from "../hooks/useProgress";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useFriends, useFriendRequests } from "../hooks/useFriends";
import DailyVerse from "../components/home/DailyVerse";
import TodaysFocusCard from "../components/home/TodaysFocusCard";
import PageNav from "../components/PageNav";
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
  { icon: "📅", title: "Reading Plans",    sub: "Daily assignments. Streaks. Finish the Bible in 1 year.",     cta: "Explore Plans →" },
  { icon: "📝", title: "Study Notes",      sub: "Rich-text notes for any chapter. Export to Markdown or PDF.", cta: "Try Notes →" },
  { icon: "✨", title: "AI Study Assistant",sub: "Ask anything about any verse. Grounded in Scripture.",        cta: "Try AI Tools →" },
  { icon: "📋", title: "Meeting Prep",     sub: "CLAM + Watchtower checklists. Never miss an assignment.",     cta: "Open Meeting Prep →" },
];

function getGradient(id) {
  return GRADIENTS[(id?.charCodeAt(0) ?? 0) % GRADIENTS.length];
}

const ONLINE_THRESHOLD_MS = 10 * 60 * 1000;

// ── Left sidebar nav items ──────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    key: "home", label: "Home", bg: "#5b21b6",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    key: "main", label: "Bible Tracker", bg: "#7c3aed",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  },
  {
    key: "readingPlans", label: "Reading Plans", bg: "#0ea5e9",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    key: "studyNotes", label: "Study Notes", bg: "#2e9e6b",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>,
  },
  {
    key: "forum", label: "Forum", bg: "#e05c2a",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    key: "blog", label: "Blog", bg: "#c084fc",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  },
  {
    key: "leaderboard", label: "Leaderboard", bg: "#f59e0b",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 17v4m4-8v8m4-12v12M2 20h20"/></svg>,
  },
];

const NAV_ITEMS_2 = [
  {
    key: "friends", label: "Friends", bg: "#1d7ea6",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    key: "messages", label: "Messages", bg: "#7c3aed",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
];

const NAV_SHORTCUTS = [
  {
    key: "quiz", label: "Bible Quiz", bg: "#374151",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  },
  {
    key: "meetingPrep", label: "Meeting Prep", bg: "#374151",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
];

// ── Mobile tab bar ──────────────────────────────────────────────────────────

// ── Blog skeleton ────────────────────────────────────────────────────────────
function BlogSkeleton() {
  return (
    <div className="hblog-skeleton">
      {[0, 1, 2].map(i => (
        <div key={i} className="hblog-skeleton-card">
          <div className="skeleton" style={{ height: 108 }} />
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ height: 11, width: "50%", borderRadius: 6 }}>&nbsp;</div>
            <div className="skeleton" style={{ height: 16, width: "90%", borderRadius: 6 }}>&nbsp;</div>
            <div className="skeleton" style={{ height: 11, width: "40%", borderRadius: 6 }}>&nbsp;</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ForumSkeleton() {
  return (
    <div className="hforum-skeleton">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="hforum-skeleton-row">
          <div className="skeleton" style={{ height: 14, width: "70%", borderRadius: 6 }}>&nbsp;</div>
          <div className="skeleton" style={{ height: 11, width: "40%", borderRadius: 6 }}>&nbsp;</div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function HomePage({ user, navigate, onLogout, darkMode, setDarkMode, i18n, isPremium, onUpgrade }) {
  const { t } = useTranslation();
  const lang = i18n?.language?.split("-")[0] ?? "en";

  // Data
  const { data: posts = [], isLoading: postsLoading } = usePublishedPosts();
  const { data: topThreads = [], isLoading: threadsLoading } = useTopThreads(4);
  const { data: publicNotes = [], isLoading: notesLoading } = usePublicNotes();
  const toggleNoteLike = useToggleNoteLike();
  const previewNotes = publicNotes.slice(0, 4);
  const { data: profile } = useFullProfile(user?.id);
  const updateProfile = useUpdateProfile(user?.id);
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const { incoming } = useFriendRequests(user?.id);
  const pendingRequests = incoming.data?.length ?? 0;
  const { data: friends = [] } = useFriends(user?.id);
  const { data: streak = { current_streak: 0, longest_streak: 0 }, isLoading: streakLoading } = useReadingStreak(user?.id);

  // Onboarding / modals
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
    if (!isDismissed(key)) { setStreakMilestone(n); setShowStreakPrompt(true); }
  }, [streak.current_streak, isPremium, streakLoading]);

  function handleEnableNotif() { updateProfile.mutate({ email_notifications_blog: true }); setNotifDismissed(true); }
  function handleDismissNotif() { localStorage.setItem("nwt-notif-dismissed", "1"); setNotifDismissed(true); }

  const blogPreview = useMemo(() => {
    const byLikes = [...posts].sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0));
    const top2 = byLikes.slice(0, 2);
    const newest = posts[0];
    const seen = new Set(top2.map(p => p.id));
    const result = [...top2];
    if (newest && !seen.has(newest.id)) result.push(newest);
    return result.slice(0, 3);
  }, [posts]);

  // eslint-disable-next-line react-hooks/purity
  const bannerRotation = BANNER_ROTATIONS[Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % BANNER_ROTATIONS.length];

  // Friends panel data
  const now = Date.now();
  const onlineFriends = friends.filter(f => f.last_active_at && now - new Date(f.last_active_at).getTime() < ONLINE_THRESHOLD_MS);
  const recentFriends = friends
    .filter(f => !onlineFriends.includes(f))
    .sort((a, b) => {
      const ta = a.last_active_at ? new Date(a.last_active_at).getTime() : 0;
      const tb = b.last_active_at ? new Date(b.last_active_at).getTime() : 0;
      return tb - ta;
    });
  const shownFriends = [...onlineFriends, ...recentFriends].slice(0, 6);

  const initials = (profile?.display_name || user?.email || "U")[0].toUpperCase();
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "My Profile";

  return (
    <div className="home-wrap">
      <PageNav
        navigate={navigate}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        i18n={i18n}
        user={user}
        onLogout={onLogout}
        currentPage="home"
        onUpgrade={onUpgrade}
      />

      <main id="main-content" className="home-layout">

        {/* ═══════════════════════════════════════
            LEFT SIDEBAR
        ═══════════════════════════════════════ */}
        <aside className="home-left-sidebar">
          {/* Profile row */}
          <button className="hls-profile" onClick={() => navigate("profile")}>
            <span className="hls-avatar">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt={displayName} />
                : <span className="hls-avatar-initials">{initials}</span>}
            </span>
            <span className="hls-name">{displayName}</span>
          </button>

          {/* Primary nav */}
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`hls-item${item.key === "home" ? " hls-item--active" : ""}`}
              onClick={() => navigate(item.key)}
            >
              <span className="hls-icon" style={{ background: item.bg }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="hls-divider" />

          {/* Social */}
          {NAV_ITEMS_2.map(item => (
            <button key={item.key} className="hls-item" onClick={() => navigate(item.key)}>
              <span className="hls-icon" style={{ background: item.bg }}>{item.icon}</span>
              {item.label}
              {item.key === "friends"  && pendingRequests > 0 && <span className="hls-badge">{pendingRequests}</span>}
              {item.key === "messages" && unreadMessages  > 0 && <span className="hls-badge">{unreadMessages}</span>}
            </button>
          ))}

          <div className="hls-divider" />
          <div className="hls-section-label">Shortcuts</div>

          {NAV_SHORTCUTS.map(item => (
            <button key={item.key} className="hls-item" onClick={() => navigate(item.key)}>
              <span className="hls-icon" style={{ background: item.bg }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* ═══════════════════════════════════════
            MAIN FEED
        ═══════════════════════════════════════ */}
        <div className="home-feed">

          {/* Today's Focus */}
          <div className="hcard hcard--focus">
            <TodaysFocusCard
              userId={user?.id}
              navigate={navigate}
              isPremium={isPremium}
              onUpgrade={onUpgrade}
              lang={lang}
            />
          </div>

          {/* Streak chip */}
          {!streakLoading && streak.current_streak > 0 && (
            <button className="hstreak-chip" onClick={() => navigate("profile")}>
              <span className="hstreak-fire">🔥</span>
              <span className="hstreak-body">
                <span className="hstreak-main"><span>{streak.current_streak}</span>-{t("home.streakDay")} {t("home.streakLabel")}</span>
                <span className="hstreak-sub">Keep it going — you're on a roll!</span>
              </span>
              {streak.longest_streak > streak.current_streak && (
                <span className="hstreak-best">{t("home.streakBest")}: {streak.longest_streak}</span>
              )}
            </button>
          )}

          {/* Blog */}
          <div>
            <div className="hfeed-head">
              <span className="hfeed-title">{t("home.blogTitle")}</span>
              <button className="hfeed-link" onClick={() => navigate("blog")}>{t("home.blogViewAll")}</button>
            </div>
            {postsLoading ? <BlogSkeleton /> : blogPreview.length === 0 ? (
              <EmptyState icon="✍️" title="No posts yet" sub="Be the first to share something." btnLabel="Write a post →" onBtn={() => navigate("blogDash")} />
            ) : (
              <div className="hblog-grid">
                {blogPreview.map((post) => (
                  <article key={post.id} className="hblog-card" onClick={() => navigate("blog", { slug: post.slug })}>
                    <div
                      className="hblog-cover"
                      style={{ background: post.cover_url ? undefined : getGradient(post.id) }}
                    >
                      {post.cover_url && <img src={post.cover_url} alt={post.title} loading="lazy" />}
                      {post.like_count > 0 && (
                        <span className="hblog-likes">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 22V11l5-9a1 1 0 0 1 1.8.5L13 7h7a2 2 0 0 1 2 2.4l-2 10A2 2 0 0 1 18 21H7zM2 11h3v11H2z"/></svg>
                          {formatNum(post.like_count)}
                        </span>
                      )}
                    </div>
                    <div className="hblog-body">
                      <div className="hblog-tag">{post.category || t("home.blogLabel")}</div>
                      <div className="hblog-title">{post.title}</div>
                      <div className="hblog-meta">{authorName(post)} · {formatDate(post.created_at)}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Community Notes */}
          <div>
            <div className="hfeed-head">
              <span className="hfeed-title">{t("home.notesTitle")}</span>
              <button className="hfeed-link" onClick={() => navigate("studyNotes", { tab: "public" })}>{t("home.notesViewAll")}</button>
            </div>
            {notesLoading ? <ForumSkeleton /> : previewNotes.length === 0 ? (
              <EmptyState
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>}
                title={t("home.notesEmpty")} sub={t("home.notesEmptySub")}
                btnLabel={t("home.notesWriteBtn")} onBtn={() => navigate("studyNotes", { tab: "public" })}
              />
            ) : (
              <div className="hcard">
                {previewNotes.map(note => {
                  const passage = note.book_index != null
                    ? `${BOOKS[note.book_index]?.name ?? ""} ${note.chapter ?? ""}`.trim()
                    : null;
                  return (
                    <div key={note.id} className="hnote-row" onClick={() => navigate("studyNotes", { tab: "public" })}>
                      <button
                        className="hnote-avatar"
                        onClick={e => { e.stopPropagation(); navigate("publicProfile", { userId: note.user_id }); }}
                        title={note.author?.display_name ?? "Anonymous"}
                      >
                        {note.author?.avatar_url
                          ? <img src={note.author.avatar_url} alt={note.author.display_name} />
                          : (note.author?.display_name ?? "A")[0].toUpperCase()}
                      </button>
                      <div className="hnote-body">
                        <div className="hnote-title">{note.title || "Untitled"}</div>
                        <div className="hnote-meta">
                          {note.author?.display_name ?? "Anonymous"}
                          {passage && <> · <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:2}}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>{passage}</>}
                          {" · "}{formatDate(note.updated_at)}
                        </div>
                        {passage && <span className="hnote-passage">📖 {passage}</span>}
                      </div>
                      <button
                        className={`hnote-like-btn${note.user_has_liked ? " hnote-like-btn--liked" : ""}`}
                        onClick={e => { e.stopPropagation(); toggleNoteLike.mutate(note.id); }}
                        aria-label={note.user_has_liked ? "Unlike" : "Like"}
                      >
                        {note.user_has_liked ? "♥" : "♡"}{note.like_count > 0 ? ` ${note.like_count}` : ""}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Forum */}
          <div>
            <div className="hfeed-head">
              <span className="hfeed-title">{t("home.forumTitle")}</span>
              <button className="hfeed-link" onClick={() => navigate("forum")}>{t("home.forumViewAll")}</button>
            </div>
            {threadsLoading ? <ForumSkeleton /> : topThreads.length === 0 ? (
              <EmptyState
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                title="No discussions yet" sub="Start the first conversation."
                btnLabel="Start a thread →" onBtn={() => navigate("forum")}
              />
            ) : (
              <div className="hcard">
                {topThreads.map(thread => (
                  <div
                    key={thread.id}
                    className="hforum-row"
                    onClick={() => navigate("forum", { categoryId: thread.category_id, threadId: thread.id })}
                  >
                    <div className="hforum-avatar">
                      {(authorName(thread) || "?")[0].toUpperCase()}
                    </div>
                    <div className="hforum-body">
                      <div className="hforum-title">{thread.title}</div>
                      <div className="hforum-meta">{authorName(thread)} · {formatDate(thread.updated_at)}</div>
                    </div>
                    <span className="hforum-count">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {formatNum(thread.forum_replies?.[0]?.count ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ═══════════════════════════════════════
            RIGHT SIDEBAR
        ═══════════════════════════════════════ */}
        <aside className="home-right-sidebar">

          {/* Daily Verse */}
          <div className="hwidget">
            <DailyVerse user={user} />
          </div>

          {/* Friends online */}
          <div className="hwidget">
            <div className="hwidget-header">
              <span className="hwidget-title">Friends</span>
              <button className="hwidget-link" onClick={() => navigate("friends")}>See all</button>
            </div>
            {friends.length === 0 ? (
              <div className="hfriend-empty">Add friends to see their activity here.</div>
            ) : (
              <>
                {shownFriends.map(f => {
                  const isOnline = f.last_active_at && now - new Date(f.last_active_at).getTime() < ONLINE_THRESHOLD_MS;
                  const diff = f.last_active_at ? now - new Date(f.last_active_at).getTime() : null;
                  const when = isOnline ? "Active now"
                    : diff == null ? ""
                    : diff < 3600000 ? `${Math.floor(diff/60000)}m ago`
                    : diff < 86400000 ? `${Math.floor(diff/3600000)}h ago`
                    : `${Math.floor(diff/86400000)}d ago`;
                  return (
                    <div key={f.id} className="hfriend-row" onClick={() => navigate("publicProfile", { userId: f.id })}>
                      <span className="hfriend-av-wrap">
                        <span className="hfriend-av">
                          {f.avatar_url ? <img src={f.avatar_url} alt={f.display_name} /> : (f.display_name || "?")[0].toUpperCase()}
                        </span>
                        {isOnline && <span className="hfriend-dot" aria-label="Online" />}
                      </span>
                      <span className="hfriend-name">{f.display_name || "Unknown"}</span>
                      <span className="hfriend-when">{when}</span>
                    </div>
                  );
                })}
                <div style={{ height: 8 }} />
              </>
            )}
          </div>

          {/* Upsell */}
          {!isPremium && (
            <button className="hwidget-upsell" onClick={onUpgrade}>
              <div className="hwidget-upsell-icon">{bannerRotation.icon}</div>
              <div className="hwidget-upsell-title">{bannerRotation.title}</div>
              <div className="hwidget-upsell-sub">{bannerRotation.sub}</div>
              <span className="hwidget-upsell-btn">{bannerRotation.cta}</span>
            </button>
          )}

        </aside>

      </main>

      {/* ── Modals & overlays ── */}
      {showStreakPrompt && (
        <UpgradePrompt
          icon="🔥"
          title={`${streak.current_streak}-day streak!`}
          message="Keep it structured — reading plans give you a daily assignment so you always know exactly what to read next."
          ctaLabel="View Reading Plans"
          onCta={() => { dismissPrompt(`streak-milestone-${streakMilestone}`); setShowStreakPrompt(false); navigate("readingPlans"); }}
          onDismiss={() => { dismissPrompt(`streak-milestone-${streakMilestone}`); setShowStreakPrompt(false); }}
        />
      )}

      {showNotifBanner && (
        <div className="home-notif-banner">
          <span className="home-notif-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></span>
          <div className="home-notif-text">
            <strong>{t("home.notifBannerTitle")}</strong>
            <span>{t("home.notifBannerSub")}</span>
          </div>
          <button className="home-notif-enable" onClick={handleEnableNotif} disabled={updateProfile.isPending}>{t("home.notifEnable")}</button>
          <button className="home-notif-dismiss" onClick={handleDismissNotif} aria-label="Dismiss">✕</button>
        </div>
      )}

      {showOnboarding && (
        <OnboardingModal onClose={closeOnboarding} onUpgrade={onUpgrade} navigate={navigate} user={user} />
      )}

    </div>
  );
}
