import { useMemo, useState, useEffect, lazy, Suspense } from "react";

const QuizPageInline      = lazy(() => import("./quiz/QuizPage"));
const QuizLevelInline     = lazy(() => import("./quiz/QuizPage").then(m => ({ default: m.QuizLevel })));
const LeaderboardInline   = lazy(() => import("./LeaderboardPage"));
const FamilyQuizInline    = lazy(() => import("./familyquiz/FamilyQuizPage"));
const ReadingPlansInline  = lazy(() => import("./readingplans/ReadingPlansPage"));
const StudyNotesInline    = lazy(() => import("./studynotes/StudyNotesPage"));
const ForumInline         = lazy(() => import("./forum/ForumPage"));
const BlogInline          = lazy(() => import("./blog/BlogPage"));
const MeetingPrepInline   = lazy(() => import("./meetingprep/MeetingPrepPage"));
const FriendsInline       = lazy(() => import("./friends/FriendsPage"));
const AdminInline         = lazy(() => import("./admin/AdminPage"));
const ProfileInline       = lazy(() => import("./profile/ProfilePage"));
const MessagesInline      = lazy(() => import("./messages/MessagesPage"));
const ChecklistInline     = lazy(() => import("./ChecklistPage"));
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
import { useOnlineMembers, ONLINE_THRESHOLD_MS as WHO_THRESHOLD_MS } from "../hooks/useOnlineMembers";
import DailyVerse from "../components/home/DailyVerse";
import TodaysFocusCard from "../components/home/TodaysFocusCard";
import EmptyState from "../components/EmptyState";
import OnboardingModal, { useOnboarding } from "../components/OnboardingModal";
import { isDismissed, dismissPrompt } from "../components/UpgradePrompt";
import "../styles/home.css";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1455541504462-57ebb2a9cec1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519817914152-22d216bb9170?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?auto=format&fit=crop&w=800&q=80",
];

function getFallbackImage(id) {
  let h = 0;
  for (const c of (id ?? "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return FALLBACK_IMAGES[h % FALLBACK_IMAGES.length];
}

const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];

const BANNER_ROTATIONS = [
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, title: "Reading Plans",    sub: "Daily assignments. Streaks. Finish the Bible in 1 year.",     cta: "Explore Plans →" },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>, title: "Study Notes",      sub: "Rich-text notes for any chapter. Export to Markdown or PDF.", cta: "Try Notes →" },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/></svg>, title: "AI Study Assistant", sub: "Ask anything about any verse. Grounded in Scripture.",        cta: "Try AI Tools →" },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, title: "Meeting Prep",     sub: "CLAM + Watchtower checklists. Never miss an assignment.",     cta: "Open Meeting Prep →" },
];

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
    key: "readingPlans", label: "Reading Plans", bg: "#0ea5e9", premium: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    key: "studyNotes", label: "Study Notes", bg: "#2e9e6b", premium: true,
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
    key: "messages", label: "Messages", bg: "#7c3aed", premium: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
];

const INLINE_PANELS = new Set(["main", "quiz", "leaderboard", "familyQuiz", "readingPlans", "studyNotes", "forum", "blog", "meetingPrep", "friends", "admin", "profile"]);

const NAV_SHORTCUTS = [
  {
    key: "quiz", label: "Bible Quiz", bg: "#374151",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  },
  {
    key: "leaderboard", label: "Leaderboard", bg: "#f59e0b",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 17v4m4-8v8m4-12v12M2 20h20"/></svg>,
  },
  {
    key: "familyQuiz", label: "Family Challenge", bg: "#1d7ea6",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    key: "meetingPrep", label: "Meeting Prep", bg: "#374151", premium: true,
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
export default function HomePage({ user, navigate, onLogout, darkMode, setDarkMode, i18n, isPremium: _isPremium, onUpgrade, panelRequest, onPanelConsumed }) {
  const isPremium = true; // all features open while building community
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
  const { onlineNow: whoOnline, recentlyActive: whoRecent, totalOnline, isLoading: whoLoading } = useOnlineMembers(50);
  const whoMembers = [...whoOnline, ...whoRecent];

  // Inline panels (quiz, leaderboard, familyQuiz, etc.)
  const [activePanel, setActivePanel] = useState(null);
  const [quizLevelState, setQuizLevelState] = useState(null); // null = hub, {level, timedMode}
  const [panelParams, setPanelParams] = useState<Record<string, any>>({});

  // Consume panel requests from the global navigate (e.g. clicking sidebar on another page)
  useEffect(() => {
    if (!panelRequest) return;
    const { panel, params = {} } = panelRequest;
    if (panel === "home") {
      setActivePanel(null);
      setQuizLevelState(null);
      setPanelParams({});
      onPanelConsumed?.();
      return;
    }
    if (INLINE_PANELS.has(panel)) {
      setActivePanel(panel);
      setPanelParams(params);
      // If navigating directly to a quiz level from outside, activate it immediately
      if (panel === "quiz" && params.level != null) {
        setQuizLevelState({ level: params.level, timedMode: !!params.timedMode });
      } else {
        setQuizLevelState(null);
      }
      onPanelConsumed?.();
    }
  }, [panelRequest]);

  function panelNavigate(page, params: Record<string, any> = {}) {
    if (page === "quiz") { setQuizLevelState(null); setActivePanel("quiz"); setPanelParams({}); }
    else if (page === "quizLevel") { setQuizLevelState({ level: params.level, timedMode: !!params.timedMode }); }
    else if (page === "blog") {
      setActivePanel("blog"); setQuizLevelState(null); setPanelParams(params);
      history.pushState(null, "", params.slug ? `/blog/${params.slug}` : "/blog");
    }
    else if (INLINE_PANELS.has(page)) { setActivePanel(page); setQuizLevelState(null); setPanelParams(params); }
    else if (page === "home") {
      setActivePanel(null); setQuizLevelState(null); setPanelParams({});
      if (window.location.pathname.startsWith("/blog")) history.pushState(null, "", "/");
    }
    else { setActivePanel(null); setQuizLevelState(null); setPanelParams({}); navigate(page, params); }
  }

  // Onboarding / modals
  const [showOnboarding, closeOnboarding] = useOnboarding(user?.created_at);
  const [notifDismissed, setNotifDismissed] = useState(() => !!localStorage.getItem("nwt-notif-dismissed"));
  const [showStreakPrompt, setShowStreakPrompt] = useState(false);
  const [streakMilestone, setStreakMilestone] = useState(null);

  const showNotifBanner = user && profile && !profile.email_notifications_blog && !notifDismissed;

  useEffect(() => {
    if (streakLoading) return;
    const n = streak.current_streak;
    if (!STREAK_MILESTONES.includes(n)) return;
    const key = `streak-milestone-${n}`;
    if (!isDismissed(key)) { setStreakMilestone(n); setShowStreakPrompt(true); }
  }, [streak.current_streak, streakLoading]);

  function handleEnableNotif() { updateProfile.mutate({ email_notifications_blog: true }); setNotifDismissed(true); }
  function handleDismissNotif() { localStorage.setItem("nwt-notif-dismissed", "1"); setNotifDismissed(true); }

  const blogPreview = useMemo(() => {
    if (posts.length === 0) return [];
    // Always lead with the newest post, then fill with most liked
    const newest = posts[0];
    const byLikes = [...posts]
      .filter(p => p.id !== newest.id)
      .sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0));
    return [newest, ...byLikes].slice(0, 3);
  }, [posts]);

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

      <main id="main-content" className={`home-layout${activePanel === "messages" ? " home-layout--messages" : (activePanel === "main" || activePanel === "profile" || activePanel === "admin") ? " home-layout--tracker" : ""}`}>

        {/* ═══════════════════════════════════════
            LEFT SIDEBAR
        ═══════════════════════════════════════ */}
        <aside className="home-left-sidebar">
          {/* Profile row */}
          <button className="hls-profile" onClick={() => { setActivePanel("profile"); setQuizLevelState(null); }}>
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
              className={`hls-item${(activePanel === null && item.key === "home") || activePanel === item.key ? " hls-item--active" : ""}`}
              onClick={() => panelNavigate(item.key)}
            >
              <span className="hls-icon" style={{ background: item.bg }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="hls-divider" />

          {/* Social */}
          {NAV_ITEMS_2.map(item => (
            <button
              key={item.key}
              className={`hls-item${activePanel === item.key ? " hls-item--active" : ""}`}
              onClick={() => {
                if (INLINE_PANELS.has(item.key)) { setActivePanel(item.key); setQuizLevelState(null); }
                else { setActivePanel(null); setQuizLevelState(null); navigate(item.key); }
              }}
            >
              <span className="hls-icon" style={{ background: item.bg }}>{item.icon}</span>
              {item.label}
              {item.key === "friends"  && pendingRequests > 0 && <span className="hls-badge">{pendingRequests}</span>}
              {item.key === "messages" && unreadMessages  > 0 && <span className="hls-badge">{unreadMessages}</span>}
            </button>
          ))}

          <div className="hls-divider" />
          <div className="hls-section-label">Shortcuts</div>

          {NAV_SHORTCUTS.map(item => (
            <button
              key={item.key}
              className={`hls-item${activePanel === item.key ? " hls-item--active" : ""}`}
              onClick={() => {
                if (INLINE_PANELS.has(item.key)) { setActivePanel(item.key); setQuizLevelState(null); }
                else { setActivePanel(null); navigate(item.key); }
              }}
            >
              <span className="hls-icon" style={{ background: item.bg }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          {(profile?.is_admin || profile?.is_moderator) && (
            <>
              <div className="hls-divider" />
              <button
                className={`hls-item${activePanel === "admin" ? " hls-item--active" : ""}`}
                onClick={() => { setActivePanel("admin"); setQuizLevelState(null); }}
              >
                <span className="hls-icon" style={{ background: "#dc2626" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </span>
                {profile?.is_admin ? "Admin" : "Moderation"}
              </button>
            </>
          )}
        </aside>

        {/* ═══════════════════════════════════════
            MAIN FEED / INLINE PANELS
        ═══════════════════════════════════════ */}
        <div className="home-feed">

          {/* ── Inline panels ── */}
          {activePanel === "main" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <ChecklistInline user={user} profile={null} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
            </Suspense>
          )}
          {activePanel === "quiz" && !quizLevelState && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <QuizPageInline user={user} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
            </Suspense>
          )}
          {activePanel === "quiz" && quizLevelState && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <QuizLevelInline level={quizLevelState.level} timedMode={quizLevelState.timedMode} user={user} onBack={() => setQuizLevelState(null)} onComplete={() => setQuizLevelState(null)} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
            </Suspense>
          )}
          {activePanel === "leaderboard" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <LeaderboardInline user={user} onBack={() => setActivePanel(null)} navigate={navigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
            </Suspense>
          )}
          {activePanel === "familyQuiz" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <FamilyQuizInline user={user} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
            </Suspense>
          )}
          {activePanel === "readingPlans" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <ReadingPlansInline user={user} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade, isPremium }} />
            </Suspense>
          )}
          {activePanel === "studyNotes" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <StudyNotesInline user={user} navigate={panelNavigate} initialTab={panelParams.tab ?? "mine"} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
            </Suspense>
          )}
          {activePanel === "forum" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <ForumInline user={user} profile={profile} categoryId={panelParams.categoryId ?? null} threadId={panelParams.threadId ?? null} onNavigate={(categoryId, threadId) => setPanelParams({ categoryId, threadId })} onBack={() => setActivePanel(null)} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
            </Suspense>
          )}
          {activePanel === "blog" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <BlogInline user={user} profile={profile} slug={panelParams.slug ?? null} onSelectPost={(slug) => { setPanelParams({ slug }); history.pushState(null, "", `/blog/${slug}`); }} onBack={() => { setPanelParams({}); history.pushState(null, "", "/blog"); }} onWriteClick={() => navigate("blogDash")} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
            </Suspense>
          )}
          {activePanel === "meetingPrep" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <MeetingPrepInline user={user} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
            </Suspense>
          )}
          {activePanel === "friends" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <FriendsInline user={user} navigate={panelNavigate} isPremium={isPremium} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
            </Suspense>
          )}
          {activePanel === "admin" && (profile?.is_admin || profile?.is_moderator) && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <AdminInline currentUser={user} currentProfile={profile} onBack={() => setActivePanel(null)} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
            </Suspense>
          )}
          {activePanel === "profile" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <ProfileInline user={user} viewedUserId={user?.id} onBack={() => setActivePanel(null)} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
            </Suspense>
          )}
          {activePanel === "messages" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <MessagesInline user={user} navigate={panelNavigate} isPremium={isPremium} initialConv={panelParams.conversationId ? { conversation_id: panelParams.conversationId, other_display_name: panelParams.otherDisplayName ?? null, other_avatar_url: panelParams.otherAvatarUrl ?? null } : null} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
            </Suspense>
          )}

          {/* ── Home feed (hidden when a panel is active) ── */}
          {activePanel === null && <>

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
              <button className="hfeed-title hfeed-title--link" onClick={() => navigate("blog")}>{t("home.blogTitle")}</button>
              <button className="hfeed-link" onClick={() => navigate("blog")}>{t("home.blogViewAll")}</button>
            </div>
            {postsLoading ? <BlogSkeleton /> : blogPreview.length === 0 ? (
              <EmptyState icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>} title="No posts yet" sub="Be the first to share something." btnLabel="Write a post →" onBtn={() => navigate("blogDash")} />
            ) : (
              <div className="hblog-grid">
                {blogPreview.map((post) => (
                  <article key={post.id} className="hblog-card" onClick={() => navigate("blog", { slug: post.slug })}>
                    <div className="hblog-cover">
                      <img
                        src={post.cover_url || getFallbackImage(post.id)}
                        alt={post.title}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = getFallbackImage(post.id); }}
                      />
                      {post.like_count > 0 && (
                        <span className="hblog-likes">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 22V11l5-9a1 1 0 0 1 1.8.5L13 7h7a2 2 0 0 1 2 2.4l-2 10A2 2 0 0 1 18 21H7zM2 11h3v11H2z"/></svg>
                          {formatNum(post.like_count)}
                        </span>
                      )}
                    </div>
                    <div className="hblog-body">
                      <div className="hblog-tag">{(post as any).category || t("home.blogLabel")}</div>
                      <div className="hblog-title">{post.title}</div>
                      <div className="hblog-meta">{authorName(post as any)} · {formatDate(post.created_at)}</div>
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

          </>}

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

          {/* Who's Online */}
          <div className="hwidget">
            <div className="hwidget-header">
              <span className="hwidget-title">Who's Online</span>
              <button className="hwidget-link" onClick={() => navigate("community")}>
                {totalOnline > 0 ? `See all (${totalOnline}) →` : "See all →"}
              </button>
            </div>
            {whoLoading ? (
              <div className="hwho-skeleton">
                {[0, 1, 2].map(i => (
                  <div key={i} className="hwho-skeleton-row">
                    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                      <div className="skeleton" style={{ height: 12, width: "55%", borderRadius: 6 }}>&nbsp;</div>
                      <div className="skeleton" style={{ height: 10, width: "35%", borderRadius: 6 }}>&nbsp;</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : whoMembers.length === 0 ? (
              <div className="hfriend-empty">No one has been active recently.</div>
            ) : (
              <>
                {whoMembers.slice(0, 6).map(m => {
                  const isOnline = m.last_active_at != null &&
                    now - new Date(m.last_active_at).getTime() < WHO_THRESHOLD_MS;
                  const diff = m.last_active_at ? now - new Date(m.last_active_at).getTime() : null;
                  const when = isOnline ? "Active now"
                    : diff == null ? ""
                    : diff < 3_600_000 ? `${Math.floor(diff / 60_000)}m ago`
                    : diff < 86_400_000 ? `${Math.floor(diff / 3_600_000)}h ago`
                    : `${Math.floor(diff / 86_400_000)}d ago`;
                  return (
                    <div
                      key={m.id}
                      className="hfriend-row"
                      onClick={() => navigate("publicProfile", { userId: m.id })}
                    >
                      <span className="hfriend-av-wrap">
                        <span className="hfriend-av">
                          {m.avatar_url
                            ? <img src={m.avatar_url} alt={m.display_name ?? ""} loading="lazy" />
                            : (m.display_name || "?")[0].toUpperCase()}
                        </span>
                        {isOnline && <span className="hfriend-dot" aria-label="Online" />}
                      </span>
                      <span className="hfriend-name">{m.display_name || "Anonymous"}</span>
                      <span className="hfriend-when">{when}</span>
                    </div>
                  );
                })}
                <div style={{ height: 8 }} />
              </>
            )}
          </div>


        </aside>

      </main>

      {/* ── Modals & overlays ── */}
      {showStreakPrompt && (
        <div className="home-notif-banner">
          <span className="home-notif-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></span>
          <div className="home-notif-text">
            <strong>{streak.current_streak}-day streak!</strong>
            <span>Check out reading plans to keep the momentum going.</span>
          </div>
          <button className="home-notif-enable" onClick={() => { dismissPrompt(`streak-milestone-${streakMilestone}`); setShowStreakPrompt(false); navigate("readingPlans"); }}>View Plans</button>
          <button className="home-notif-dismiss" onClick={() => { dismissPrompt(`streak-milestone-${streakMilestone}`); setShowStreakPrompt(false); }} aria-label="Dismiss">✕</button>
        </div>
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
        <OnboardingModal onClose={closeOnboarding} navigate={navigate} user={user} />
      )}

    </div>
  );
}
