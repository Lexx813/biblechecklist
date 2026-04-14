import { useMemo, useState, useEffect, useRef, lazy, Suspense } from "react";

const QuizPageInline      = lazy(() => import("./quiz/QuizPage"));
const QuizLevelInline     = lazy(() => import("./quiz/QuizPage").then(m => ({ default: m.QuizLevel })));
const AdvancedQuizInline  = lazy(() => import("./quiz/AdvancedQuizPage"));
const AdvancedQuizLevelInline = lazy(() => import("./quiz/AdvancedQuizPage").then(m => ({ default: m.AdvancedQuizLevel })));
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
import type { BlogPost } from "../api/blog";
import { usePublishedVideos, useSignedVideoUrl, useSpotlightVideo } from "../hooks/useVideos";
import { useTopThreads } from "../hooks/useForum";
import { usePublicNotes, useToggleNoteLike } from "../hooks/useStudyNotes";
import { formatDate, authorName, formatNum } from "../utils/formatters";
import { BOOKS } from "../data/books";
import { useFullProfile, useUpdateProfile } from "../hooks/useAdmin";
import { useReadingStreak } from "../hooks/useProgress";
import { useFriendPosts } from "../hooks/usePosts";
import { useNotes } from "../hooks/useNotes";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useFriends, useFriendRequests } from "../hooks/useFriends";
import { useOnlineMembers, ONLINE_THRESHOLD_MS as WHO_THRESHOLD_MS } from "../hooks/useOnlineMembers";
import DailyVerse from "../components/home/DailyVerse";
import TodaysFocusCard from "../components/home/TodaysFocusCard";
import EmptyState from "../components/EmptyState";
import OnboardingModal, { useOnboarding } from "../components/OnboardingModal";
import { isDismissed, dismissPrompt } from "../components/UpgradePrompt";
import "../styles/home.css";
import "../styles/videos.css";

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

/** Plays a storage-backed video in the home reel widget using a signed URL. */
function HomeReelVideo({ storagePath, thumbnailUrl }: { storagePath: string; thumbnailUrl?: string | null }) {
  const { data: signedUrl } = useSignedVideoUrl(storagePath, true);
  if (!signedUrl) {
    return thumbnailUrl ? (
      <img src={thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }} />
    ) : (
      <div className="home-reel-placeholder">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="rgba(255,255,255,0.25)"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </div>
    );
  }
  return (
    <video
      className="home-reel-iframe"
      src={signedUrl}
      poster={thumbnailUrl ?? undefined}
      preload="none"
      controls
      playsInline
      style={{ background: "#000" }}
    />
  );
}

/** Renders the spotlight hero player — iframe for embed_url, <video> for storage. */
function SpotlightPlayer({ video }: { video: { embed_url: string | null; storage_path: string | null; thumbnail_url: string | null; title: string } }) {
  const { data: signedUrl } = useSignedVideoUrl(video.storage_path, !!video.storage_path && !video.embed_url);
  if (video.embed_url) {
    return (
      <div style={{ position: "relative", paddingBottom: "56.25%", background: "#000", borderRadius: "0 0 10px 10px" }}>
        <iframe
          src={video.embed_url}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", borderRadius: "0 0 10px 10px" }}
        />
      </div>
    );
  }
  if (signedUrl) {
    return (
      <video
        src={signedUrl}
        poster={video.thumbnail_url ?? undefined}
        controls
        playsInline
        preload="none"
        style={{ width: "100%", display: "block", background: "#000", borderRadius: "0 0 10px 10px" }}
      />
    );
  }
  if (video.thumbnail_url) {
    return <img src={video.thumbnail_url} alt={video.title} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block", borderRadius: "0 0 10px 10px" }} />;
  }
  return (
    <div style={{ aspectRatio: "16/9", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0 0 10px 10px" }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="rgba(255,255,255,0.2)"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    </div>
  );
}

function getFallbackImage(id) {
  let h = 0;
  for (const c of (id ?? "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return FALLBACK_IMAGES[h % FALLBACK_IMAGES.length];
}

const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];

const BANNER_ROTATIONS = [
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, title: "Reading Plans",    sub: "Daily assignments. Streaks. Finish the Bible in 1 year.",     cta: "Explore Plans \u2192" },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>, title: "Study Notes",      sub: "Rich-text notes for any chapter. Export to Markdown or PDF.", cta: "Try Notes \u2192" },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/></svg>, title: "AI Study Assistant", sub: "Ask anything about any verse. Grounded in Scripture.",        cta: "Try AI Tools \u2192" },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, title: "Meeting Prep",     sub: "CLAM + Watchtower checklists. Never miss an assignment.",     cta: "Open Meeting Prep \u2192" },
];

const ONLINE_THRESHOLD_MS = 10 * 60 * 1000;

// ── Left sidebar nav items ──────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    key: "home", labelKey: "nav.home", bg: "#5b21b6",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    key: "main", labelKey: "nav.bibleTracker", bg: "#7c3aed",
    icon: <svg width="18" height="18" viewBox="0 1 24 20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v11H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v11h10z"/><polyline points="8 11 11 14.5 17 7.5" stroke="#a78bfa" strokeWidth="2.5" fill="none"/></svg>,
  },
  {
    key: "readingPlans", labelKey: "nav.readingPlans", bg: "#0ea5e9", premium: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    key: "studyNotes", labelKey: "nav.studyNotes", bg: "#2e9e6b", premium: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>,
  },
  {
    key: "forum", labelKey: "nav.forum", bg: "#e05c2a",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    key: "blog", labelKey: "nav.blog", bg: "#c084fc",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  },
  {
    key: "leaderboard", labelKey: "nav.leaderboard", bg: "#f59e0b",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 17v4m4-8v8m4-12v12M2 20h20"/></svg>,
  },
];

const NAV_ITEMS_2 = [
  {
    key: "friends", labelKey: "nav.friends", bg: "#1d7ea6",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    key: "groups", labelKey: "nav.studyGroups", bg: "#059669",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  },
  {
    key: "messages", labelKey: "nav.messages", bg: "#7c3aed", premium: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
];

const INLINE_PANELS = new Set(["main", "quiz", "advancedQuiz", "leaderboard", "familyQuiz", "readingPlans", "studyNotes", "forum", "blog", "meetingPrep", "friends", "admin", "profile"]);

const NAV_SHORTCUTS = [
  {
    key: "quiz", labelKey: "nav.bibleQuiz", bg: "#374151",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  },
  {
    key: "leaderboard", labelKey: "nav.leaderboard", bg: "#f59e0b",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 17v4m4-8v8m4-12v12M2 20h20"/></svg>,
  },
  {
    key: "familyQuiz", labelKey: "nav.familyChallenge", bg: "#1d7ea6",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    key: "meetingPrep", labelKey: "nav.meetingPrep", bg: "#374151", premium: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
];

// ── Skeletons ────────────────────────────────────────────────────────────
function BlogSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2.5 max-[720px]:grid-cols-2 max-[480px]:grid-cols-1">
      {[0, 1, 2].map(i => (
        <div key={i} className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.03]">
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
    <div className="flex flex-col">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="flex flex-col gap-2 border-b border-brand-600/[0.08] px-4 py-3.5">
          <div className="skeleton" style={{ height: 14, width: "70%", borderRadius: 6 }}>&nbsp;</div>
          <div className="skeleton" style={{ height: 11, width: "40%", borderRadius: 6 }}>&nbsp;</div>
        </div>
      ))}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ── Main component ───────────────────────────────────────────────────────────
export default function HomePage({ user, navigate, onLogout, darkMode, setDarkMode, i18n, isPremium: _isPremium, onUpgrade, panelRequest, onPanelConsumed }) {
  const isPremium = true; // all features open while building community
  const { t } = useTranslation();
  const lang = i18n?.language?.split("-")[0] ?? "en";

  // Data
  const { data: langPosts = [], isLoading: langPostsLoading } = usePublishedPosts(lang);
  const { data: enPosts = [], isLoading: enPostsLoading } = usePublishedPosts(lang === "en" ? null : "en");
  const posts = langPosts.length > 0 ? langPosts : enPosts;
  const postsLoading = langPostsLoading || (langPosts.length === 0 && enPostsLoading);
  const { data: recentVideos = [], isLoading: videosLoading } = usePublishedVideos();
  const { data: spotlightVideo, isLoading: spotlightLoading } = useSpotlightVideo();
  const reelVideos = spotlightVideo
    ? recentVideos.filter((v: { id: string }) => v.id !== spotlightVideo.id)
    : recentVideos;
  const [reelIndex, setReelIndex] = useState(0);
  const reelTouchY = useRef(0);
  const { data: topThreads = [], isLoading: threadsLoading } = useTopThreads(4, lang);
  const { data: publicNotes = [], isLoading: notesLoading } = usePublicNotes(lang);
  const toggleNoteLike = useToggleNoteLike();
  const previewNotes = publicNotes.slice(0, 4);
  const { data: profile } = useFullProfile(user?.id);
  const updateProfile = useUpdateProfile(user?.id);
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const { incoming } = useFriendRequests(user?.id);
  const pendingRequests = incoming.data?.length ?? 0;
  const { data: friends = [], isLoading: friendsLoading } = useFriends(user?.id);
  const { data: streak = { current_streak: 0, longest_streak: 0 }, isLoading: streakLoading } = useReadingStreak(user?.id);
  const { data: friendPosts = [], isLoading: friendPostsLoading } = useFriendPosts(user?.id);
  const { data: myNotes = [] } = useNotes(user?.id);
  const { onlineNow: whoOnline, recentlyActive: whoRecent, totalOnline, isLoading: whoLoading, isError: whoError } = useOnlineMembers(50);
  const whoMembers = [...whoOnline, ...whoRecent];

  // Inline panels (quiz, leaderboard, familyQuiz, etc.)
  const [activePanel, setActivePanel] = useState(null);
  const [quizLevelState, setQuizLevelState] = useState(null); // null = hub, {level, timedMode}
  const [advQuizLevelState, setAdvQuizLevelState] = useState(null);
  const [panelParams, setPanelParams] = useState<Record<string, any>>({});

  // Consume panel requests from the global navigate (e.g. clicking sidebar on another page)
  useEffect(() => {
    if (!panelRequest) return;
    const { panel, params = {} } = panelRequest;
    if (panel === "home") {
      setActivePanel(null);
      setQuizLevelState(null);
      setAdvQuizLevelState(null);
      setPanelParams({});
      onPanelConsumed?.();
      return;
    }
    if (INLINE_PANELS.has(panel)) {
      setActivePanel(panel);
      setPanelParams(params);
      if (panel === "quiz" && params.level != null) {
        setQuizLevelState({ level: params.level, timedMode: !!params.timedMode });
      } else {
        setQuizLevelState(null);
      }
      if (panel === "advancedQuiz" && params.level != null) {
        setAdvQuizLevelState({ level: params.level, timedMode: !!params.timedMode });
      } else {
        setAdvQuizLevelState(null);
      }
      onPanelConsumed?.();
    }
  }, [panelRequest]);

  function panelNavigate(page, params: Record<string, any> = {}) {
    if (page === "quiz") { setQuizLevelState(null); setActivePanel("quiz"); setPanelParams({}); }
    else if (page === "quizLevel") { setQuizLevelState({ level: params.level, timedMode: !!params.timedMode }); }
    else if (page === "advancedQuiz") { setAdvQuizLevelState(null); setActivePanel("advancedQuiz"); setPanelParams({}); }
    else if (page === "advancedQuizLevel") { setAdvQuizLevelState({ level: params.level, timedMode: !!params.timedMode }); }
    else if (page === "blog") {
      setActivePanel("blog"); setQuizLevelState(null); setPanelParams(params);
      history.pushState(null, "", params.slug ? `/blog/${params.slug}` : "/blog");
    }
    else if (INLINE_PANELS.has(page)) { setActivePanel(page); setQuizLevelState(null); setPanelParams(params); }
    else if (page === "home") {
      setActivePanel(null); setQuizLevelState(null); setAdvQuizLevelState(null); setPanelParams({});
      if (window.location.pathname.startsWith("/blog")) history.pushState(null, "", "/");
    }
    else { setActivePanel(null); setQuizLevelState(null); setAdvQuizLevelState(null); setPanelParams({}); navigate(page, params); }
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
    // 2 newest posts + 1 most-liked (that isn't already shown)
    const newest2 = posts.slice(0, 2);
    const newest2Ids = new Set(newest2.map(p => p.id));
    const mostLiked = [...posts]
      .filter(p => !newest2Ids.has(p.id))
      .sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0))[0];
    return mostLiked ? [...newest2, mostLiked] : newest2;
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

  // Shared Tailwind classes
  const cardCls = "rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.06] overflow-hidden transition-all duration-150 hover:border-brand-600/35 hover:bg-white/[0.09] hover:shadow-[var(--shadow-xs)] [html[data-theme=light]_&]:bg-white [html[data-theme=light]_&]:border-[var(--border)]";
  const feedHeadCls = "flex items-center justify-between mb-2.5";
  const feedTitleCls = "text-[19px] font-bold text-[var(--text-primary)]";
  const feedLinkCls = "text-sm font-semibold text-[var(--accent)] cursor-pointer border-none bg-transparent px-2.5 py-1 rounded-[var(--radius-sm)] transition-colors duration-100 hover:bg-brand-600/[0.12] font-[inherit]";
  const widgetCls = "rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.03] overflow-hidden min-h-[120px] [html[data-theme=light]_&]:bg-white";
  const metaCls = "text-xs text-[rgba(240,234,255,0.6)] [html[data-theme=light]_&]:text-[rgba(30,16,53,0.68)]";

  return (
    <div className="home-wrap">

      <main id="main-content" className={`home-layout${activePanel === "messages" ? " home-layout--messages" : (activePanel === "main" || activePanel === "profile" || activePanel === "admin") ? " home-layout--tracker" : ""}`}>

        {/* ═══════════════════════════════════════
            LEFT SIDEBAR — kept as CSS (shared with AppLayout)
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
              {t(item.labelKey)}
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
              {t(item.labelKey)}
              {item.key === "friends"  && pendingRequests > 0 && <span className="hls-badge">{pendingRequests}</span>}
              {item.key === "messages" && unreadMessages  > 0 && <span className="hls-badge">{unreadMessages}</span>}
            </button>
          ))}

          <div className="hls-divider" />
          <div className="hls-section-label">{t("nav.shortcuts")}</div>

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
              {t(item.labelKey)}
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

          {/* Compact footer links */}
          <div className="hsidebar-footer">
            <a href="/privacy" className="hsidebar-footer-link">Privacy</a>
            <span className="hsidebar-footer-sep">&middot;</span>
            <a href="/terms" className="hsidebar-footer-link">Terms</a>
            <span className="hsidebar-footer-sep">&middot;</span>
            <span className="hsidebar-footer-copy">&copy; {new Date().getFullYear()} JW Study</span>
          </div>
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
          {activePanel === "advancedQuiz" && !advQuizLevelState && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <AdvancedQuizInline user={user} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
            </Suspense>
          )}
          {activePanel === "advancedQuiz" && advQuizLevelState && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <AdvancedQuizLevelInline level={advQuizLevelState.level} timedMode={advQuizLevelState.timedMode} user={user} onBack={() => setAdvQuizLevelState(null)} onComplete={() => setAdvQuizLevelState(null)} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {}, onUpgrade }} />
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
              <span className="hstreak-fire">{"\uD83D\uDD25"}</span>
              <span className="hstreak-body">
                <span className="hstreak-main"><span>{streak.current_streak}</span>-{t("home.streakDay")} {t("home.streakLabel")}</span>
                <span className="hstreak-sub">Keep it going — you're on a roll!</span>
              </span>
              {streak.longest_streak > streak.current_streak && (
                <span className="hstreak-best">{t("home.streakBest")}: {streak.longest_streak}</span>
              )}
            </button>
          )}

          {/* Friend Posts */}
          {friendPosts.length > 0 && (
            <div>
              <div className={feedHeadCls}>
                <span className={feedTitleCls}>Friend Posts</span>
                <button className={feedLinkCls} onClick={() => navigate("feed")}>See all &rarr;</button>
              </div>
              <div className="flex flex-col gap-2">
                {friendPosts.slice(0, 5).map((post: any) => {
                  const author = post.profiles;
                  const name = author?.display_name || "Someone";
                  const initial = name[0].toUpperCase();
                  return (
                    <div
                      key={post.id}
                      className={`${cardCls} flex cursor-pointer gap-3 p-3.5`}
                      onClick={() => navigate("publicProfile", { userId: post.user_id })}
                    >
                      {author?.avatar_url ? (
                        <img src={author.avatar_url} alt="" className="size-9 shrink-0 rounded-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">{initial}</div>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--text-primary)]">{name}</span>
                          <span className="text-xs text-[var(--text-muted)]">{timeAgo(post.created_at)}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-3 text-sm leading-relaxed text-[var(--text-secondary)]">{post.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Blog */}
          <div>
            <div className={feedHeadCls}>
              <button className={`${feedTitleCls} cursor-pointer border-none bg-transparent p-0 text-left font-[inherit] hover:underline`} onClick={() => navigate("blog")}>{t("home.blogTitle")}</button>
              <button className={feedLinkCls} onClick={() => navigate("blog")}>{t("home.blogViewAll")}</button>
            </div>
            {postsLoading ? <BlogSkeleton /> : blogPreview.length === 0 ? (
              <EmptyState icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>} title="No posts yet" sub="Be the first to share something." btnLabel="Write a post \u2192" onBtn={() => navigate("blogDash")} />
            ) : (
              <div className="grid grid-cols-3 gap-2.5 max-[720px]:grid-cols-2 max-[480px]:grid-cols-1">
                {blogPreview.map((post) => {
                  const tr = (post as BlogPost).translations?.[lang];
                  const title = tr?.title || post.title;
                  return (
                  <article key={post.id} className="group flex cursor-pointer flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.03] transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-600/[0.28] active:scale-[0.98] [html[data-theme=light]_&]:bg-white" onClick={() => navigate("blog", { slug: post.slug })}>
                    <div className="relative h-[108px] shrink-0 overflow-hidden">
                      <img
                        src={post.cover_url || getFallbackImage(post.id)}
                        alt={title}
                        className="block h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = getFallbackImage(post.id); }}
                      />
                      {post.like_count > 0 && (
                        <span className="absolute bottom-1.5 right-2 flex items-center gap-[3px] rounded-[var(--radius-sm)] bg-black/60 px-[7px] py-0.5 text-[11px] font-semibold text-white">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 22V11l5-9a1 1 0 0 1 1.8.5L13 7h7a2 2 0 0 1 2 2.4l-2 10A2 2 0 0 1 18 21H7zM2 11h3v11H2z"/></svg>
                          {formatNum(post.like_count)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 p-3">
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)] [html[data-theme=light]_&]:text-brand-800">{t("home.blogLabel")}</div>
                      <div className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)]">{title}</div>
                      <div className={metaCls}>{authorName(post)} · {formatDate(post.created_at)}</div>
                    </div>
                  </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Spotlight video hero — skeleton reserves space to prevent CLS */}
          {(spotlightLoading || spotlightVideo) && (
            <div style={{ marginBottom: 20 }}>
              <div className={feedHeadCls}>
                <span className={feedTitleCls}>
                  <span className="text-amber-400 [html[data-theme=light]_&]:text-amber-800" style={{ marginRight: 5 }}>{"\u2605"}</span>
                  Spotlight
                </span>
                <button className={feedLinkCls} onClick={() => navigate("videos")}>View all &rarr;</button>
              </div>
              {spotlightLoading ? (
                <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ height: 16, width: "60%", borderRadius: 6, background: "var(--skeleton-bg, rgba(124,58,237,0.08))", marginBottom: 6 }} />
                      <div style={{ height: 11, width: "35%", borderRadius: 6, background: "var(--skeleton-bg, rgba(124,58,237,0.08))" }} />
                    </div>
                  </div>
                  <div style={{ aspectRatio: "16/9", background: "var(--skeleton-bg, rgba(124,58,237,0.08))" }} />
                </div>
              ) : spotlightVideo ? (
                <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        onClick={() => navigate("videos")}
                      >
                        {spotlightVideo.title}
                      </div>
                      {spotlightVideo.profiles?.display_name && (
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: 2 }}>
                          {spotlightVideo.profiles.display_name}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded-[10px] bg-amber-400 px-2 py-0.5 text-[0.65rem] font-bold text-amber-900">
                      {"\u2605"} SPOTLIGHT
                    </span>
                  </div>
                  <SpotlightPlayer video={spotlightVideo} />
                </div>
              ) : null}
            </div>
          )}

          {/* Videos — TikTok-style reel embed */}
          {(videosLoading || reelVideos.length > 0) && (
          <div className="home-video-section">
            <div className={feedHeadCls}>
              <button className={`${feedTitleCls} cursor-pointer border-none bg-transparent p-0 text-left font-[inherit] hover:underline`} onClick={() => navigate("videos")}>Videos</button>
              <button className={feedLinkCls} onClick={() => navigate("videos")}>View all &rarr;</button>
            </div>
            {videosLoading ? <BlogSkeleton /> : (() => {
              const vids = reelVideos;
              const cur = vids[reelIndex];
              if (!cur) return null;
              const isPortrait = cur.embed_url?.includes("tiktok.com") ?? false;
              return (
                <div
                  className="home-reel-wrapper"
                  onTouchStart={e => { reelTouchY.current = e.touches[0].clientY; }}
                  onTouchEnd={e => {
                    const delta = reelTouchY.current - e.changedTouches[0].clientY;
                    if (Math.abs(delta) < 40) return;
                    if (delta > 0) setReelIndex(i => Math.min(i + 1, vids.length - 1));
                    else setReelIndex(i => Math.max(i - 1, 0));
                  }}
                >
                  <div className={`home-reel-embed${isPortrait ? " portrait" : ""}`}>
                    {cur.embed_url ? (
                      <iframe
                        key={cur.id}
                        className="home-reel-iframe"
                        src={cur.embed_url}
                        title={cur.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        scrolling="no"
                      />
                    ) : cur.storage_path ? (
                      <HomeReelVideo key={cur.id} storagePath={cur.storage_path} thumbnailUrl={cur.thumbnail_url} />
                    ) : (
                      <div className="home-reel-placeholder">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="rgba(255,255,255,0.25)"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </div>
                    )}
                  </div>
                  {vids.length > 1 && (
                    <div className="home-reel-nav">
                      <button
                        className="home-reel-nav-btn"
                        onClick={() => setReelIndex(i => Math.max(i - 1, 0))}
                        disabled={reelIndex === 0}
                        aria-label="Previous video"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <span className="text-xs font-semibold text-white/70">{reelIndex + 1}/{vids.length}</span>
                      <button
                        className="home-reel-nav-btn"
                        onClick={() => setReelIndex(i => Math.min(i + 1, vids.length - 1))}
                        disabled={reelIndex === vids.length - 1}
                        aria-label="Next video"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          )}

          {/* Community Notes — only show if there are notes in user's language */}
          {(lang === "en" || previewNotes.length > 0) && (
          <div>
            <div className={feedHeadCls}>
              <span className={feedTitleCls}>{t("home.notesTitle")}</span>
              <button className={feedLinkCls} onClick={() => navigate("studyNotes", { tab: "public" })}>{t("home.notesViewAll")}</button>
            </div>
            {notesLoading ? <ForumSkeleton /> : previewNotes.length === 0 ? (
              <EmptyState
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>}
                title={t("home.notesEmpty")} sub={t("home.notesEmptySub")}
                btnLabel={t("home.notesWriteBtn")} onBtn={() => navigate("studyNotes", { tab: "public" })}
              />
            ) : (
              <div className={cardCls}>
                {previewNotes.map(note => {
                  const passage = note.book_index != null
                    ? `${BOOKS[note.book_index]?.name ?? ""} ${note.chapter ?? ""}`.trim()
                    : null;
                  return (
                    <div key={note.id} className="flex cursor-pointer items-start gap-3 border-b border-white/[0.06] px-4 py-3.5 transition-colors duration-100 last:border-b-0 hover:bg-brand-600/[0.06] [html[data-theme=light]_&]:border-b-[var(--border)] [html[data-theme=light]_&]:hover:bg-brand-600/[0.05]" onClick={() => navigate("studyNotes", { tab: "public" })}>
                      <button
                        className="flex size-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#2e1a5c] to-brand-800 text-[13px] font-bold text-white"
                        onClick={e => { e.stopPropagation(); navigate("publicProfile", { userId: note.user_id }); }}
                        title={note.author?.display_name ?? "Anonymous"}
                      >
                        {note.author?.avatar_url
                          ? <img src={note.author.avatar_url} alt={note.author.display_name} className="h-full w-full object-cover" />
                          : (note.author?.display_name ?? "A")[0].toUpperCase()}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="mb-[3px] text-sm font-semibold leading-snug text-[var(--text-primary)]">{note.title || "Untitled"}</div>
                        <div className={metaCls}>
                          {note.author?.display_name ?? "Anonymous"}
                          {passage && <> · <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:2}}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>{passage}</>}
                          {" · "}{formatDate(note.updated_at)}
                        </div>
                        {passage && <span className="mt-1 inline-flex items-center gap-1 rounded bg-brand-600/15 px-[7px] py-0.5 text-[11px] font-semibold text-[var(--accent)] [html[data-theme=light]_&]:bg-brand-800/10 [html[data-theme=light]_&]:text-brand-800">{"\uD83D\uDCD6"} {passage}</span>}
                      </div>
                      <button
                        className={`shrink-0 self-center rounded-[var(--radius-xs)] border-none bg-transparent px-1.5 py-1 text-sm transition-colors duration-100 ${note.user_has_liked ? "text-fuchsia-400" : "text-[rgba(240,234,255,0.6)] [html[data-theme=light]_&]:text-[rgba(30,16,53,0.68)]"} cursor-pointer font-[inherit] hover:bg-brand-600/[0.12] hover:text-[var(--accent)]`}
                        onClick={e => { e.stopPropagation(); toggleNoteLike.mutate(note.id); }}
                        title={note.user_has_liked ? "Unlike" : "Like"}
                      >
                        <span aria-hidden="true">{note.user_has_liked ? "\u2665" : "\u2661"}{note.like_count > 0 ? ` ${note.like_count}` : ""}</span>
                        <span className="sr-only">{note.user_has_liked ? "Unlike" : "Like"}{note.like_count > 0 ? `, ${note.like_count} likes` : ""}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {/* Forum — only show if there are threads in user's language */}
          {(lang === "en" || topThreads.length > 0) && (
          <div>
            <div className={feedHeadCls}>
              <span className={feedTitleCls}>{t("home.forumTitle")}</span>
              <button className={feedLinkCls} onClick={() => navigate("forum")}>{t("home.forumViewAll")}</button>
            </div>
            {threadsLoading ? <ForumSkeleton /> : topThreads.length === 0 ? (
              <EmptyState
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                title="No discussions yet" sub="Start the first conversation."
                btnLabel="Start a thread \u2192" onBtn={() => navigate("forum")}
              />
            ) : (
              <div className={cardCls}>
                {topThreads.map(thread => (
                  <div
                    key={thread.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-white/[0.06] px-4 py-3.5 transition-colors duration-100 last:border-b-0 hover:bg-brand-600/[0.06] [html[data-theme=light]_&]:border-b-[var(--border)] [html[data-theme=light]_&]:hover:bg-brand-600/[0.05]"
                    onClick={() => navigate("forum", { categoryId: thread.category_id, threadId: thread.id })}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white/[0.06] text-[13px] font-bold text-[var(--accent)]">
                      {(authorName(thread) || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 truncate text-sm font-semibold text-[var(--text-primary)]">{thread.title}</div>
                      <div className={metaCls}>{authorName(thread)} · {formatDate(thread.updated_at)}</div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-[rgba(240,234,255,0.6)] [html[data-theme=light]_&]:text-[rgba(30,16,53,0.68)]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {formatNum(thread.forum_replies?.[0]?.count ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          </>}

        </div>

        {/* ═══════════════════════════════════════
            RIGHT SIDEBAR
        ═══════════════════════════════════════ */}
        <aside className="home-right-sidebar">

          {/* Daily Verse */}
          <div className={widgetCls}>
            <DailyVerse />
          </div>

          {/* Friends online */}
          <div className={widgetCls}>
            <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
              <span className="text-base font-bold text-[var(--text-primary)]">Friends</span>
              <button className={feedLinkCls} onClick={() => navigate("friends")}>See all</button>
            </div>
            {friendsLoading ? (
              <div className="flex flex-col gap-2.5 py-1 pb-2">
                {[0,1,2].map(i => (
                  <div key={i} className="flex items-center gap-2.5 px-4">
                    <div className="skeleton size-[34px] shrink-0 rounded-full" />
                    <div className="flex flex-1 flex-col gap-[5px]">
                      <div className="skeleton h-3 w-[55%] rounded-md">&nbsp;</div>
                    </div>
                    <div className="skeleton h-2.5 w-[52px] rounded-md" />
                  </div>
                ))}
              </div>
            ) : friends.length === 0 ? (
              <div className="px-4 pb-4 pt-3 text-[13px] text-[rgba(240,234,255,0.6)] [html[data-theme=light]_&]:text-[rgba(30,16,53,0.68)]">Add friends to see their activity here.</div>
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
                    <div key={f.id} className="flex cursor-pointer items-center gap-2.5 px-4 py-2 transition-colors duration-100 hover:bg-brand-600/[0.06]" onClick={() => navigate("publicProfile", { userId: f.id })}>
                      <span className="relative shrink-0">
                        <span className="flex size-[34px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#2e1a5c] to-brand-800 text-[13px] font-bold text-white">
                          {f.avatar_url ? <img src={f.avatar_url} alt={f.display_name} className="h-full w-full object-cover" /> : (f.display_name || "?")[0].toUpperCase()}
                        </span>
                        {isOnline && <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[var(--bg)] bg-green-500" aria-label="Online" />}
                      </span>
                      <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{f.display_name || "Unknown"}</span>
                      <span className={`min-w-[72px] text-right ${metaCls}`}>{when}</span>
                    </div>
                  );
                })}
                <div className="h-2" />
              </>
            )}
          </div>

          {/* Invite Friends */}
          <div className="flex min-h-0 items-center justify-between gap-3 overflow-hidden rounded-[var(--radius)] border border-brand-600/20 bg-gradient-to-br from-[rgba(92,61,153,0.15)] to-[rgba(74,45,128,0.08)] px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="shrink-0 text-2xl">{"\uD83C\uDF81"}</span>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">Invite a Friend</div>
                <div className="mt-px text-xs text-[var(--text-secondary)]">Share JW Study and study together</div>
              </div>
            </div>
            <button className="shrink-0 cursor-pointer whitespace-nowrap rounded-[20px] border-none bg-[var(--teal)] px-3.5 py-[7px] text-xs font-bold text-white transition-opacity duration-150 hover:opacity-85" onClick={() => navigate("profile")}>
              Get my link
            </button>
          </div>

          {/* Who's Online */}
          <div className={widgetCls}>
            <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
              <span className="text-base font-bold text-[var(--text-primary)]">Who's Online</span>
              <button className={feedLinkCls} onClick={() => navigate("community")}>
                {totalOnline > 0 ? `See all (${totalOnline}) \u2192` : "See all \u2192"}
              </button>
            </div>
            {whoLoading ? (
              <div className="flex flex-col gap-2.5 py-1 pb-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-center gap-2.5 px-4">
                    <div className="skeleton size-8 shrink-0 rounded-full" />
                    <div className="flex flex-1 flex-col gap-[5px]">
                      <div className="skeleton h-3 w-[55%] rounded-md">&nbsp;</div>
                      <div className="skeleton h-2.5 w-[35%] rounded-md">&nbsp;</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : whoError ? (
              <div className="px-4 pb-4 pt-3 text-[13px] text-[rgba(240,234,255,0.6)]">Unable to load members.</div>
            ) : whoMembers.length === 0 ? (
              <div className="px-4 pb-4 pt-3 text-[13px] text-[rgba(240,234,255,0.6)]">No one has been active recently.</div>
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
                      className="flex cursor-pointer items-center gap-2.5 px-4 py-2 transition-colors duration-100 hover:bg-brand-600/[0.06]"
                      onClick={() => navigate("publicProfile", { userId: m.id })}
                    >
                      <span className="relative shrink-0">
                        <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#2e1a5c] to-brand-800 text-[13px] font-bold text-white">
                          {m.avatar_url
                            ? <img src={m.avatar_url} alt={m.display_name ?? ""} loading="lazy" className="h-full w-full object-cover" />
                            : (m.display_name || "?")[0].toUpperCase()}
                        </span>
                        {isOnline && <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[var(--bg)] bg-green-500" aria-label="Online" />}
                      </span>
                      <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{m.display_name || "Anonymous"}</span>
                      <span className={`min-w-[72px] text-right ${metaCls}`}>{when}</span>
                    </div>
                  );
                })}
                <div className="h-2" />
              </>
            )}
          </div>

          {/* My Notes */}
          {myNotes.length > 0 && (
            <div className={widgetCls}>
              <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
                <span className="text-base font-bold text-[var(--text-primary)]">My Notes</span>
                <button className={feedLinkCls} onClick={() => navigate("profile", { defaultTab: "notes" })}>See all &rarr;</button>
              </div>
              <div className="flex flex-col gap-1.5 px-3 pb-3">
                {myNotes.slice(0, 4).map((note: any) => {
                  const bookName = BOOKS[note.book_index]?.name ?? "";
                  const isOT = note.book_index < 39;
                  const plain = note.content.replace(/<[^>]*>/g, "");
                  return (
                    <div
                      key={note.id}
                      className="cursor-pointer rounded-lg border border-[var(--border)] px-3 py-2.5 transition-colors hover:bg-[var(--hover-bg)]"
                      onClick={() => navigate("profile", { defaultTab: "notes" })}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-full px-2 py-px text-[10px] font-bold ${
                          isOT ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"
                        }`}>
                          {bookName}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {note.chapter}{note.verse ? `:${note.verse}` : ""}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {plain}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
          <button className="home-notif-dismiss" onClick={() => { dismissPrompt(`streak-milestone-${streakMilestone}`); setShowStreakPrompt(false); }} aria-label="\u2715 Dismiss">{"\u2715"}</button>
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
          <button className="home-notif-dismiss" onClick={handleDismissNotif} aria-label="\u2715 Dismiss">{"\u2715"}</button>
        </div>
      )}

      {showOnboarding && (
        <OnboardingModal onClose={closeOnboarding} navigate={navigate} user={user} />
      )}

    </div>
  );
}
