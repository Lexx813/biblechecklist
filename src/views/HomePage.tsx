import { useMemo, useState, useEffect, useRef, lazy, Suspense } from "react";
import { buildPath } from "../lib/router";

const QuizPageInline      = lazy(() => import("./quiz/QuizPage"));
const QuizLevelInline     = lazy(() => import("./quiz/QuizPage").then(m => ({ default: m.QuizLevel })));
const AdvancedQuizInline  = lazy(() => import("./quiz/AdvancedQuizPage"));
const AdvancedQuizLevelInline = lazy(() => import("./quiz/AdvancedQuizPage").then(m => ({ default: m.AdvancedQuizLevel })));
const MasterQuizInline    = lazy(() => import("./quiz/MasterQuizPage"));
const MasterQuizLevelInline = lazy(() => import("./quiz/MasterQuizPage").then(m => ({ default: m.MasterQuizLevel })));
const LeaderboardInline   = lazy(() => import("./LeaderboardPage"));
const FamilyQuizInline    = lazy(() => import("./familyquiz/FamilyQuizPage"));
const ReadingPlansInline  = lazy(() => import("./readingplans/ReadingPlansPage"));
const StudyNotesInline    = lazy(() => import("./studynotes/StudyNotesPage"));
const ForumInline         = lazy(() => import("./forum/ForumPage"));
const BlogInline          = lazy(() => import("./blog/BlogPage"));
const MyPostsInline       = lazy(() => import("./blog/MyPostsPage"));
const MeetingPrepInline   = lazy(() => import("./meetingprep/MeetingPrepPage"));
const LearnInline         = lazy(() => import("./learn/LearnPage"));
const FriendsInline       = lazy(() => import("./friends/FriendsPage"));
const AdminInline         = lazy(() => import("./admin/AdminPage"));
const ProfileInline       = lazy(() => import("./profile/ProfilePage"));
const MessagesInline      = lazy(() => import("./messages/MessagesPage"));
const ChecklistInline     = lazy(() => import("./ChecklistPage"));
const StudyTopicsInline   = lazy(() => import("./studytopics/StudyTopicsInline"));
const ActivityFeedInline  = lazy(() => import("./social/ActivityFeedInline"));
const BookmarksInline     = lazy(() => import("./bookmarks/BookmarksInline"));
const BookDetailInline      = lazy(() => import("./studytopics/BookDetailPage"));
const StudyTopicDetailInline = lazy(() => import("./studytopics/StudyTopicDetail"));
const GroupsInline          = lazy(() => import("./groups/GroupsPage"));
const GroupDetailInline   = lazy(() => import("./groups/GroupDetail"));
const CommunityInline     = lazy(() => import("./community/CommunityPage"));
const VideosInline        = lazy(() => import("./videos/VideosPage"));
const VideoDetailInline   = lazy(() => import("./videos/VideoDetailPage"));
const FriendRequestsInline  = lazy(() => import("./friends/FriendRequestsPage"));
const HistoryInline         = lazy(() => import("./reading/ReadingHistory"));
const TriviaInline          = lazy(() => import("./trivia/TriviaPage"));
const SettingsInline        = lazy(() => import("./profile/SettingsPage"));
const BlogDashInline        = lazy(() => import("./blog/BlogDashboard"));
const VideosDashInline      = lazy(() => import("./videos/VideoComposerPage"));
const CreatorRequestInline  = lazy(() => import("./videos/CreatorRequestPage"));
const AboutInline           = lazy(() => import("./AboutPage"));
const TermsInline           = lazy(() => import("./TermsPage"));
const PrivacyInline         = lazy(() => import("./PrivacyPage"));
const SupportInline         = lazy(() => import("./SupportPage"));
import { useTranslation } from "react-i18next";
import { usePublishedPosts } from "../hooks/useBlog";
import type { BlogPost } from "../api/blog";
import { usePublishedVideos, useSignedVideoUrl, useSpotlightVideo } from "../hooks/useVideos";
import { useTopThreads } from "../hooks/useForum";
import { usePublicNotes } from "../hooks/useStudyNotes";
import { formatDate, authorName, formatNum } from "../utils/formatters";
import { BOOKS } from "../data/books";
import { useFullProfile, useUpdateProfile } from "../hooks/useAdmin";
import { useReadingStreak } from "../hooks/useProgress";
import { useFriendPosts, usePublicFeed, useCreatePost, useUpdatePost, useDeletePost } from "../hooks/usePosts";
import CreatePostModal from "../components/CreatePostModal";
import PostInteractions from "../components/PostInteractions";
import ConfirmModal from "../components/ConfirmModal";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useFriends, useFriendRequests } from "../hooks/useFriends";
import { useOnlineMembers, ONLINE_THRESHOLD_MS as WHO_THRESHOLD_MS } from "../hooks/useOnlineMembers";
import DailyVerse from "../components/home/DailyVerse";
import DailyBriefCard from "../components/home/DailyBriefCard";
import TodaysFocusCard from "../components/home/TodaysFocusCard";
import HomeLeftSidebar from "../components/home/HomeLeftSidebar";
import HomeNotifBanners from "../components/home/HomeNotifBanners";
import FriendsWidget from "../components/home/FriendsWidget";
import WhosOnlineWidget from "../components/home/WhosOnlineWidget";
import CommunityNotesWidget from "../components/home/CommunityNotesWidget";
import ForumHighlightsWidget from "../components/home/ForumHighlightsWidget";
import EmptyState from "../components/EmptyState";
import OnboardingModal, { useOnboarding } from "../components/OnboardingModal";
import { isDismissed, dismissPrompt } from "../components/UpgradePrompt";
import { sanitizeRich } from "../lib/sanitize";
import { timeAgo } from "../lib/timeFormat";
import "../styles/home.css";
import "../styles/videos.css";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1455541504462-57ebb2a9cec1?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1519817914152-22d216bb9170?auto=format&fit=crop&w=400&q=70",
  "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?auto=format&fit=crop&w=400&q=70",
];

/** Renders the spotlight hero player, iframe for embed_url, <video> for storage. */
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

const INLINE_PANELS = new Set(["main", "quiz", "advancedQuiz", "masterQuiz", "leaderboard", "familyQuiz", "readingPlans", "studyNotes", "forum", "blog", "myPosts", "meetingPrep", "friends", "admin", "profile", "publicProfile", "studyTopics", "studyTopicDetail", "bookDetail", "feed", "bookmarks", "groups", "groupDetail", "community", "videos", "videoDetail", "friendRequests", "messages", "history", "trivia", "settings", "blogDash", "videosDash", "creatorRequest", "about", "terms", "privacy", "learn", "support"]);

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

// ── Main component ───────────────────────────────────────────────────────────
export default function HomePage({ user, navigate, onLogout, darkMode, setDarkMode, i18n, panelRequest, onPanelConsumed }) {
  const { t } = useTranslation();
  const lang = i18n?.language?.split("-")[0] ?? "en";

  // Defer non-critical fetches until after the first paint to keep INP clean
  const [deferred, setDeferred] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDeferred(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Critical, needed above the fold
  const { data: profile } = useFullProfile(user?.id);
  const updateProfile = useUpdateProfile(user?.id);
  const { data: streak = { current_streak: 0, longest_streak: 0 }, isLoading: streakLoading } = useReadingStreak(user?.id);
  const { data: friendPosts = [], isLoading: friendPostsLoading } = useFriendPosts(user?.id);
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const { incoming } = useFriendRequests(user?.id);
  const pendingRequests = incoming.data?.length ?? 0;

  // Deferred, below the fold, load after paint
  const { data: langPosts = [], isLoading: langPostsLoading } = usePublishedPosts(deferred ? lang : undefined);
  const { data: enPosts = [], isLoading: enPostsLoading } = usePublishedPosts(deferred && lang !== "en" ? "en" : undefined);
  const posts = langPosts.length > 0 ? langPosts : enPosts;
  const postsLoading = langPostsLoading || (langPosts.length === 0 && enPostsLoading);
  const { data: recentVideos = [], isLoading: videosLoading } = usePublishedVideos();
  const { data: spotlightVideo, isLoading: spotlightLoading } = useSpotlightVideo();
  const reelVideos = spotlightVideo
    ? recentVideos.filter((v: { id: string }) => v.id !== spotlightVideo.id)
    : recentVideos;
  const { data: topThreads = [], isLoading: threadsLoading } = useTopThreads(deferred ? 4 : 0, lang);
  const { data: publicNotes = [], isLoading: notesLoading } = usePublicNotes(deferred ? lang : null);
  const previewNotes = publicNotes.slice(0, 4);
  const { data: friends = [], isLoading: friendsLoading } = useFriends(deferred ? user?.id : null);
  const { data: publicFeed = [] } = usePublicFeed();
  const createPost = useCreatePost(user?.id);
  const updatePost = useUpdatePost(user?.id);
  const deletePost = useDeletePost(user?.id);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const { onlineNow: whoOnline, recentlyActive: whoRecent, totalOnline, isLoading: whoLoading, isError: whoError } = useOnlineMembers(deferred ? 50 : 0);
  const whoMembers = [...whoOnline, ...whoRecent];

  // Inline panels (quiz, leaderboard, familyQuiz, etc.)
  const [activePanel, setActivePanel] = useState(null);
  const [quizLevelState, setQuizLevelState] = useState(null); // null = hub, {level, timedMode}
  const [advQuizLevelState, setAdvQuizLevelState] = useState(null);
  const [masterQuizLevelState, setMasterQuizLevelState] = useState(null);
  const [panelParams, setPanelParams] = useState<Record<string, any>>({});

  // Consume panel requests from the global navigate (e.g. clicking sidebar on another page)
  useEffect(() => {
    if (!panelRequest) return;
    const { panel, params = {} } = panelRequest;
    if (panel === "home") {
      setActivePanel(null);
      setQuizLevelState(null);
      setAdvQuizLevelState(null);
      setMasterQuizLevelState(null);
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
      if (panel === "masterQuiz" && params.level != null) {
        setMasterQuizLevelState({ level: params.level, timedMode: !!params.timedMode });
      } else {
        setMasterQuizLevelState(null);
      }
      onPanelConsumed?.();
    }
  }, [panelRequest]);

  function panelNavigate(page, params: Record<string, any> = {}) {
    if (page === "quiz") { setQuizLevelState(null); setActivePanel("quiz"); setPanelParams({}); }
    else if (page === "quizLevel") { setQuizLevelState({ level: params.level, timedMode: !!params.timedMode }); }
    else if (page === "advancedQuiz") { setAdvQuizLevelState(null); setActivePanel("advancedQuiz"); setPanelParams({}); }
    else if (page === "advancedQuizLevel") { setAdvQuizLevelState({ level: params.level, timedMode: !!params.timedMode }); }
    else if (page === "masterQuiz") { setMasterQuizLevelState(null); setActivePanel("masterQuiz"); setPanelParams({}); }
    else if (page === "masterQuizLevel") { setMasterQuizLevelState({ level: params.level, timedMode: !!params.timedMode }); setActivePanel("masterQuiz"); }
    else if (page === "blog") {
      setActivePanel("blog"); setQuizLevelState(null); setPanelParams(params);
      history.pushState(null, "", params.slug ? `/blog/${params.slug}` : "/blog");
    }
    else if (INLINE_PANELS.has(page)) {
      setActivePanel(page); setQuizLevelState(null); setPanelParams(params);
      const url = buildPath(page, params);
      if (url && url !== "/" && window.location.pathname + window.location.search !== url) {
        history.pushState(null, "", url);
      }
    }
    else if (page === "home") {
      setActivePanel(null); setQuizLevelState(null); setAdvQuizLevelState(null); setPanelParams({});
      if (window.location.pathname.startsWith("/blog")) history.pushState(null, "", "/");
    }
    else { setActivePanel(null); setQuizLevelState(null); setAdvQuizLevelState(null); setMasterQuizLevelState(null); setPanelParams({}); navigate(page, params); }
  }

  // Onboarding / modals
  const [showOnboarding, closeOnboarding] = useOnboarding(user?.created_at);
  const [notifDismissed, setNotifDismissed] = useState(() => !!localStorage.getItem("nwt-notif-dismissed"));
  const [showStreakPrompt, setShowStreakPrompt] = useState(false);
  const [streakMilestone, setStreakMilestone] = useState(null);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [forumExpanded, setForumExpanded] = useState(false);

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
  const onlineFriends = friends.filter(f => f.last_active_at && now - new Date(f.last_active_at).getTime() < WHO_THRESHOLD_MS);
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
  const widgetCls = "rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.03] [html[data-theme=light]_&]:bg-white";
  const metaCls = "text-xs text-[rgba(240,234,255,0.6)] [html[data-theme=light]_&]:text-[rgba(30,16,53,0.68)]";

  return (
    <div className="home-wrap">

      <main id="main-content" className={`home-layout${activePanel === "messages" ? " home-layout--messages" : (activePanel === "main" || activePanel === "profile" || activePanel === "admin") ? " home-layout--tracker" : ""}${activePanel === "admin" ? " home-layout--admin" : ""}${activePanel === "blog" && panelParams.slug ? " home-layout--reading" : ""}`}>

        <HomeLeftSidebar
          profile={profile}
          displayName={displayName}
          initials={initials}
          activePanel={activePanel}
          pendingRequests={pendingRequests}
          unreadMessages={unreadMessages}
          panelNavigate={panelNavigate}
          setActivePanel={setActivePanel}
          setQuizLevelState={setQuizLevelState}
        />

        {/* ═══════════════════════════════════════
            MAIN FEED / INLINE PANELS
        ═══════════════════════════════════════ */}
        <div className="home-feed">

          {/* ── Inline panels ── */}
          {activePanel === "main" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <ChecklistInline user={user} profile={null} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "quiz" && !quizLevelState && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <QuizPageInline user={user} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "quiz" && quizLevelState && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <QuizLevelInline level={quizLevelState.level} timedMode={quizLevelState.timedMode} user={user} onBack={() => setQuizLevelState(null)} onComplete={() => setQuizLevelState(null)} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "advancedQuiz" && !advQuizLevelState && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <AdvancedQuizInline user={user} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "advancedQuiz" && advQuizLevelState && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <AdvancedQuizLevelInline level={advQuizLevelState.level} timedMode={advQuizLevelState.timedMode} user={user} onBack={() => setAdvQuizLevelState(null)} onComplete={() => setAdvQuizLevelState(null)} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "masterQuiz" && !masterQuizLevelState && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <MasterQuizInline user={user} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "masterQuiz" && masterQuizLevelState && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <MasterQuizLevelInline level={masterQuizLevelState.level} timedMode={masterQuizLevelState.timedMode} user={user} onBack={() => setMasterQuizLevelState(null)} onComplete={() => setMasterQuizLevelState(null)} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "leaderboard" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <LeaderboardInline user={user} onBack={() => setActivePanel(null)} navigate={navigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "familyQuiz" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <FamilyQuizInline user={user} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "readingPlans" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <ReadingPlansInline user={user} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "studyNotes" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <StudyNotesInline user={user} navigate={panelNavigate} initialTab={panelParams.tab ?? "mine"} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "forum" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <ForumInline user={user} profile={profile} categoryId={panelParams.categoryId ?? null} threadId={panelParams.threadId ?? null} onNavigate={(categoryId, threadId) => setPanelParams({ categoryId, threadId })} onBack={() => setActivePanel(null)} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "blog" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <BlogInline user={user} profile={profile} slug={panelParams.slug ?? null} onSelectPost={(slug) => { setPanelParams({ slug }); history.pushState(null, "", `/blog/${slug}`); }} onBack={() => { setPanelParams({}); history.pushState(null, "", "/blog"); }} onWriteClick={() => navigate("blogNew")} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "myPosts" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <MyPostsInline user={user} navigate={panelNavigate} />
            </Suspense>
          )}
          {activePanel === "meetingPrep" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <MeetingPrepInline user={user} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "learn" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <LearnInline onBack={() => { setActivePanel(null); if (window.location.pathname !== "/") history.pushState(null, "", "/"); }} />
            </Suspense>
          )}
          {activePanel === "friends" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <FriendsInline user={user} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "admin" && (profile?.is_admin || profile?.is_moderator) && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <AdminInline currentUser={user} currentProfile={profile} onBack={() => setActivePanel(null)} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "profile" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <ProfileInline user={user} viewedUserId={user?.id} onBack={() => setActivePanel(null)} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "publicProfile" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <ProfileInline user={user} viewedUserId={panelParams.userId} isOwner={false} onBack={() => setActivePanel(null)} navigate={panelNavigate} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "messages" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <MessagesInline user={user} navigate={panelNavigate} initialConv={panelParams.conversationId ? { conversation_id: panelParams.conversationId, other_display_name: panelParams.otherDisplayName ?? null, other_avatar_url: panelParams.otherAvatarUrl ?? null } : null} {...{ darkMode, setDarkMode, i18n, onLogout: () => {} }} />
            </Suspense>
          )}
          {activePanel === "studyTopics" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <StudyTopicsInline navigate={panelNavigate} />
            </Suspense>
          )}
          {activePanel === "feed" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <ActivityFeedInline user={user} navigate={panelNavigate} />
            </Suspense>
          )}
          {activePanel === "bookmarks" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <BookmarksInline user={user} navigate={panelNavigate} />
            </Suspense>
          )}
          {activePanel === "bookDetail" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <BookDetailInline user={user} navigate={panelNavigate} bookIndex={panelParams.bookIndex} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} />
            </Suspense>
          )}
          {activePanel === "studyTopicDetail" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <StudyTopicDetailInline user={user} navigate={panelNavigate} slug={panelParams.slug} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} />
            </Suspense>
          )}
          {activePanel === "groups" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <GroupsInline user={user} navigate={panelNavigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} />
            </Suspense>
          )}
          {activePanel === "groupDetail" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <GroupDetailInline groupId={panelParams.groupId} user={user} navigate={panelNavigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} />
            </Suspense>
          )}
          {activePanel === "community" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <CommunityInline navigate={panelNavigate} userId={user?.id} />
            </Suspense>
          )}
          {activePanel === "videos" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <VideosInline user={user} onSelectVideo={(slug: string) => { setPanelParams({ slug }); setActivePanel("videoDetail"); }} onPostClick={() => navigate("videosDash")} onBack={() => setActivePanel(null)} navigate={panelNavigate} />
            </Suspense>
          )}
          {activePanel === "videoDetail" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <VideoDetailInline user={user} navigate={panelNavigate} slug={panelParams.slug} onBack={() => setActivePanel("videos")} />
            </Suspense>
          )}
          {activePanel === "friendRequests" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <FriendRequestsInline user={user} navigate={panelNavigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} currentPage="friendRequests" />
            </Suspense>
          )}
          {activePanel === "history" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <HistoryInline user={user} onBack={() => setActivePanel(null)} navigate={panelNavigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} />
            </Suspense>
          )}
          {activePanel === "trivia" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <TriviaInline user={user} navigate={panelNavigate} prefillCode={panelParams.prefillCode} />
            </Suspense>
          )}
          {activePanel === "settings" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <SettingsInline user={user} onBack={() => setActivePanel(null)} navigate={panelNavigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} />
            </Suspense>
          )}
          {activePanel === "blogDash" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <BlogDashInline user={user} onBack={() => setActivePanel("blog")} navigate={panelNavigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} />
            </Suspense>
          )}
          {activePanel === "videosDash" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <VideosDashInline user={user} onBack={() => setActivePanel("videos")} navigate={panelNavigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} />
            </Suspense>
          )}
          {activePanel === "creatorRequest" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <CreatorRequestInline user={user} onBack={() => setActivePanel("videos")} navigate={panelNavigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} />
            </Suspense>
          )}
          {activePanel === "about" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <AboutInline user={user} navigate={panelNavigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} />
            </Suspense>
          )}
          {activePanel === "terms" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <TermsInline user={user} navigate={panelNavigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} />
            </Suspense>
          )}
          {activePanel === "privacy" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <PrivacyInline user={user} navigate={panelNavigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} />
            </Suspense>
          )}
          {activePanel === "support" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <SupportInline navigate={panelNavigate} />
            </Suspense>
          )}
          {/* ── Home feed (hidden when a panel is active) ── */}
          {activePanel === null && <>

          {/* Daily AI Brief */}
          <DailyBriefCard
            onOpenAI={(convId) => {
              if (convId) {
                window.location.href = `/ai/${convId}`;
              } else {
                window.location.href = "/ai";
              }
            }}
            onMeetingPrep={() => navigate("meetingPrep")}
          />

          {/* Today's Focus */}
          <div className="hcard hcard--focus">
            <TodaysFocusCard
              userId={user?.id}
              navigate={navigate}
              lang={lang}
            />
          </div>

          {/* Streak chip */}
          {!streakLoading && streak.current_streak > 0 && (
            <button className="hstreak-chip" onClick={() => navigate("profile")}>
              <span className="text-[26px] shrink-0 filter-[drop-shadow(0_2px_8px_rgba(251,146,60,0.35))]">{"\uD83D\uDD25"}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[17px] font-bold tracking-[-0.01em] text-(--text-primary)">
                  <span className="font-extrabold tabular-nums text-[#f59e0b]">{streak.current_streak}</span>
                  -{t("home.streakDay")} {t("home.streakLabel")}
                </span>
                <span className="mt-0.5 block text-[13px] text-[rgba(240,234,255,0.65)]">Keep it going, you're on a roll!</span>
              </span>
              {streak.longest_streak > streak.current_streak && (
                <span className="shrink-0 text-[13px] italic text-[rgba(240,234,255,0.75)]">{t("home.streakBest")}: {streak.longest_streak}</span>
              )}
            </button>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2.5 pb-1">
            <button
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-[rgba(124,58,237,0.3)] bg-[rgba(124,58,237,0.12)] px-2 py-3 pb-2.5 text-center text-xs font-semibold leading-snug text-[#c4b5fd] transition-all hover:-translate-y-0.5 hover:border-[rgba(124,58,237,0.5)] hover:bg-[rgba(124,58,237,0.2)] hover:text-[#e9d5ff]"
              onClick={() => panelNavigate("main")}
            >
              <span className="text-[22px] leading-none">📖</span>
              Continue Reading
            </button>
            <button
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-(--border) bg-(--card-bg) px-2 py-3 pb-2.5 text-center text-xs font-semibold leading-snug text-(--text-secondary) transition-all hover:-translate-y-0.5 hover:border-[#7c3aed] hover:bg-[rgba(124,58,237,0.06)] hover:text-(--text-primary)"
              onClick={() => panelNavigate("quiz")}
            >
              <span className="text-[22px] leading-none">🎯</span>
              Today's Quiz
            </button>
            <button
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-(--border) bg-(--card-bg) px-2 py-3 pb-2.5 text-center text-xs font-semibold leading-snug text-(--text-secondary) transition-all hover:-translate-y-0.5 hover:border-[#7c3aed] hover:bg-[rgba(124,58,237,0.06)] hover:text-(--text-primary)"
              onClick={() => panelNavigate("meetingPrep")}
            >
              <span className="text-[22px] leading-none">✅</span>
              Meeting Prep
            </button>
          </div>

          {/* Learn to Study, 9-lesson interactive course */}
          <LearnToStudyCard
            firstName={(profile?.display_name || "").split(" ")[0]}
            onOpen={() => panelNavigate("learn")}
          />

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
                        width={280}
                        height={108}
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

          {/* Create post bar */}
          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-4">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="size-10 shrink-0 rounded-full object-cover" width={40} height={40} />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-sm font-bold text-white">{initials}</div>
              )}
              <button
                type="button"
                className="flex-1 cursor-pointer rounded-full border-none bg-white/[0.08] px-4 py-2.5 text-left text-sm text-[var(--text-muted)] transition-colors hover:bg-white/[0.14] [html[data-theme=light]_&]:bg-gray-100 [html[data-theme=light]_&]:hover:bg-gray-200"
                onClick={() => setShowPostModal(true)}
              >
                {t("posts.placeholder")}
              </button>
            </div>
            <div className="mt-3 flex items-center border-t border-[var(--border)] pt-3">
              <button
                type="button"
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-transparent py-1.5 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-white/[0.06] [html[data-theme=light]_&]:hover:bg-gray-100"
                onClick={() => setShowPostModal(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Photo
              </button>
              <button
                type="button"
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-transparent py-1.5 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-white/[0.06] [html[data-theme=light]_&]:hover:bg-gray-100"
                onClick={() => setShowPostModal(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                Video
              </button>
            </div>
          </div>

          {/* Posts Feed, merge friend posts + public feed, dedup & sort */}
          {(() => {
            const seen = new Set<string>();
            const fiveDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            const merged = [...friendPosts, ...publicFeed]
              .filter((p: any) => { if (seen.has(p.id)) return false; seen.add(p.id); return new Date(p.created_at).getTime() >= fiveDaysAgo; })
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 10);
            if (merged.length === 0) return null;
            return (
              <div className="flex flex-col gap-3">
                {merged.map((post: any) => {
                  const author = post.profiles;
                  const name = author?.display_name || "Someone";
                  const initial = name[0].toUpperCase();
                  return (
                    <div key={post.id} className={`${cardCls} group/post overflow-hidden`}>
                      {/* Post header, avatar + name + time + delete */}
                      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
                        <div
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                          onClick={() => navigate("publicProfile", { userId: post.user_id })}
                        >
                          {author?.avatar_url ? (
                            <img src={author.avatar_url} alt="" className="size-10 shrink-0 rounded-full object-cover" width={40} height={40} loading="lazy" />
                          ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">{initial}</div>
                          )}
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="text-sm font-bold text-[var(--text-primary)]">{name}</span>
                            <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                              {timeAgo(post.created_at)}
                              {post.visibility === "friends" ? (
                                <span className="inline-flex items-center gap-0.5" title="Friends only">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5" title="Public">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        {post.user_id === user?.id && (
                          <span className="flex shrink-0 items-center gap-0.5">
                            <button
                              className="flex size-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                              onClick={() => { setEditingPost(post); setShowPostModal(true); }}
                              title={t("common.edit")}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            </button>
                            <button
                              className="flex size-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-[var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                              onClick={() => setDeletePostId(post.id)}
                              title={t("common.delete")}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </span>
                        )}
                      </div>

                      {/* Post content. px-5 (20px) gives bullet markers + first
                          line of text breathing room from the card edge. */}
                      <div
                        className="rich-content px-5 pb-3"
                        dangerouslySetInnerHTML={{ __html: sanitizeRich(post.content) }}
                      />

                      {/* Post image, aspect-ratio container reserves space before image loads */}
                      {post.image_url && (
                        <div className="border-t border-[var(--border)] bg-black/20" style={{ aspectRatio: "16/9", overflow: "hidden" }}>
                          <img
                            src={post.image_url}
                            alt=""
                            className="w-full h-full object-contain"
                            width={800}
                            height={450}
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Reactions + Comments */}
                      <PostInteractions
                        postId={post.id}
                        userId={user?.id}
                        commentCount={post.comment_count ?? 0}
                        reactionCounts={post.reaction_counts ?? {}}
                        navigate={navigate}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Create post modal */}
          {showPostModal && user && (
            <CreatePostModal
              onClose={() => { setShowPostModal(false); setEditingPost(null); }}
              onSubmit={(content, visibility, imageUrl) => {
                if (editingPost) {
                  updatePost.mutate(
                    { postId: editingPost.id, content, visibility, imageUrl: imageUrl ?? editingPost.image_url ?? null },
                    { onSuccess: () => { setShowPostModal(false); setEditingPost(null); } }
                  );
                } else {
                  createPost.mutate({ content, visibility, imageUrl }, {
                    onSuccess: () => setShowPostModal(false),
                  });
                }
              }}
              isPending={createPost.isPending || updatePost.isPending}
              userId={user.id}
              avatarUrl={profile?.avatar_url}
              displayName={displayName}
              editPost={editingPost}
            />
          )}

          {/* Delete post confirmation */}
          {deletePostId && (
            <ConfirmModal
              message={t("posts.deleteConfirm", { defaultValue: "Are you sure you want to delete this post? This action cannot be undone." })}
              onCancel={() => setDeletePostId(null)}
              onConfirm={() => {
                deletePost.mutate(deletePostId, { onSuccess: () => setDeletePostId(null) });
              }}
              confirmLabel={t("common.delete")}
              danger
            />
          )}

          {/* Spotlight video hero, skeleton reserves space to prevent CLS */}
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

          {/* Videos, link to full list */}
          {!videosLoading && reelVideos.length > 0 && (
            <div>
              <div className={feedHeadCls}>
                <span className={feedTitleCls}>Videos</span>
                <button className={feedLinkCls} onClick={() => navigate("videos")}>View all &rarr;</button>
              </div>
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

          <FriendsWidget
            friends={friends}
            shownFriends={shownFriends}
            onlineCount={onlineFriends.length}
            loading={friendsLoading}
            now={now}
            navigate={navigate}
          />

          <WhosOnlineWidget
            members={whoMembers}
            totalOnline={totalOnline}
            loading={whoLoading}
            error={whoError}
            now={now}
            navigate={navigate}
          />

          {(lang === "en" || previewNotes.length > 0) && (
            <CommunityNotesWidget
              notes={previewNotes}
              loading={notesLoading}
              expanded={notesExpanded}
              setExpanded={setNotesExpanded}
              navigate={navigate}
            />
          )}

          {(lang === "en" || topThreads.length > 0) && (
            <ForumHighlightsWidget
              threads={topThreads}
              loading={threadsLoading}
              expanded={forumExpanded}
              setExpanded={setForumExpanded}
              navigate={navigate}
            />
          )}

        </aside>

      </main>

      <HomeNotifBanners
        showStreakPrompt={showStreakPrompt}
        streakMilestone={streakMilestone}
        streakCurrent={streak.current_streak}
        showNotifBanner={!!showNotifBanner}
        navigate={navigate}
        onEnableNotif={handleEnableNotif}
        onDismissNotif={handleDismissNotif}
        onDismissStreak={() => { dismissPrompt(`streak-milestone-${streakMilestone}`); setShowStreakPrompt(false); }}
        updateProfilePending={updateProfile.isPending}
      />

      {showOnboarding && (
        <OnboardingModal onClose={closeOnboarding} navigate={navigate} user={user} />
      )}

    </div>
  );
}

const LEARN_TOTAL_LESSONS = 9;

function LearnToStudyCard({ firstName, onOpen }: { firstName: string; onOpen: () => void }) {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    import("./learn/progressStore").then(({ readLearnProgress, subscribeLearnProgress }) => {
      if (!mounted) return;
      const sync = () => mounted && setCompletedCount(readLearnProgress().completed.length);
      sync();
      const unsub = subscribeLearnProgress(sync);
      return () => unsub();
    });
    return () => {
      mounted = false;
    };
  }, []);

  const pct = Math.min(1, completedCount / LEARN_TOTAL_LESSONS);
  const pctLabel = Math.round(pct * 100);
  const isFresh = completedCount === 0;
  const isComplete = completedCount >= LEARN_TOTAL_LESSONS;
  const isInProgress = !isFresh && !isComplete;

  const eyebrow = isComplete
    ? "Course complete"
    : isInProgress
      ? firstName
        ? `Welcome back, ${firstName}`
        : "Welcome back"
      : "Interactive course · 9 lessons";

  const headline = isComplete
    ? "Revisit any lesson"
    : isInProgress
      ? "Pick up where you left off"
      : "Learn to Study the Bible";

  const subcopy = isComplete
    ? "You've walked the full path. Return to any lesson to sharpen a skill, S.O.A.P., cross-referencing, meditation, highlighting."
    : isInProgress
      ? `${completedCount} of ${LEARN_TOTAL_LESSONS} lessons complete. Just a few minutes a day.`
      : "Nine short lessons with hands-on exercises, S.O.A.P., cross-referencing, meditation, highlighting. Study like a Berean.";

  const ctaLabel = isComplete ? "Review course" : isInProgress ? "Continue" : "Begin lesson 1";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group relative block w-full overflow-hidden rounded-md border border-[var(--color-jw-purple-soft)] bg-[#7c3aed] p-5 text-left text-white no-underline shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-jw-gold)] focus-visible:ring-offset-2 cursor-pointer sm:p-6"
      aria-label={`${headline}. ${completedCount} of ${LEARN_TOTAL_LESSONS} lessons complete.`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light"
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(201,169,97,0.6) 0%, transparent 45%), radial-gradient(circle at 10% 90%, rgba(255,255,255,0.15) 0%, transparent 40%)",
        }}
      />
      <div className="relative flex flex-col gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isComplete && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-jw-gold)] text-[var(--color-jw-purple-deep)]">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 010 1.4l-7.9 7.9a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4l3.3 3.3 7.2-7.2a1 1 0 011.4 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
              {eyebrow}
            </p>
          </div>
          <h3 className="mt-1.5 text-xl font-semibold leading-tight text-white font-[var(--font-fraunces)] sm:text-2xl">
            {headline}
          </h3>
          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-white/80">
            {subcopy}
          </p>

          {/* Progress bar (hidden in fresh state; meta chips shown instead) */}
          {!isFresh ? (
            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between text-[11px] font-medium text-white/70">
                <span>
                  {completedCount} of {LEARN_TOTAL_LESSONS} lessons
                </span>
                <span className="tabular-nums text-white">{pctLabel}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-jw-gold)] to-white transition-[width] duration-700 ease-out"
                  style={{ width: `${pctLabel}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-4 text-xs text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M10 2a1 1 0 011 1v1.07A7 7 0 0117 11h1a1 1 0 110 2h-1a7 7 0 01-6 6.93V21a1 1 0 11-2 0v-1.07A7 7 0 013 13H2a1 1 0 110-2h1A7 7 0 019 4.07V3a1 1 0 011-1z" />
                </svg>
                3 units · 9 lessons
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.3.7l2.5 2.5a1 1 0 001.4-1.4L11 9.6V6z"
                    clipRule="evenodd"
                  />
                </svg>
                ~25 min total
              </span>
            </div>
          )}
        </div>
        <span className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-jw-purple-deep shadow-sm transition-transform duration-200 group-hover:translate-x-0.5 sm:w-auto sm:self-start">
          {ctaLabel}
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M7.3 5.3a1 1 0 011.4 0l4 4a1 1 0 010 1.4l-4 4a1 1 0 01-1.4-1.4L10.6 10 7.3 6.7a1 1 0 010-1.4z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}
