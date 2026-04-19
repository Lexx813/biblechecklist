import { useMemo, useState, useEffect, useRef, lazy, Suspense } from "react";

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
const SearchInline          = lazy(() => import("./search/SearchPage"));
const SettingsInline        = lazy(() => import("./profile/SettingsPage"));
const BlogDashInline        = lazy(() => import("./blog/BlogDashboard"));
const VideosDashInline      = lazy(() => import("./videos/VideoComposerPage"));
const CreatorRequestInline  = lazy(() => import("./videos/CreatorRequestPage"));
const AboutInline           = lazy(() => import("./AboutPage"));
const TermsInline           = lazy(() => import("./TermsPage"));
const PrivacyInline         = lazy(() => import("./PrivacyPage"));
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
import TodaysFocusCard from "../components/home/TodaysFocusCard";
import EmptyState from "../components/EmptyState";
import OnboardingModal, { useOnboarding } from "../components/OnboardingModal";
import { isDismissed, dismissPrompt } from "../components/UpgradePrompt";
import { sanitizeRich } from "../lib/sanitize";
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

const AVATAR_GRADIENTS = [
  ["#7c3aed","#3b0764"], ["#1d4ed8","#1e3a8a"], ["#059669","#064e3b"],
  ["#ea580c","#7c2d12"], ["#db2777","#831843"], ["#0891b2","#164e63"],
  ["#7c3aed","#4c1d95"], ["#16a34a","#14532d"], ["#d97706","#78350f"],
  ["#dc2626","#7f1d1d"], ["#0284c7","#0c4a6e"], ["#9333ea","#581c87"],
];
function avatarGradient(id: string): [string, string] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length] as [string, string];
}
function fmtDiff(diff: number | null): string {
  if (diff == null) return "";
  if (diff < 60_000) return "Active now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ── Left sidebar nav items ──────────────────────────────────────────────────
const NAV_CORE = [
  {
    key: "home", labelKey: "nav.home",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-home" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#c4b5fd"/><stop offset="100%" stopColor="#5b21b6"/></linearGradient></defs><path d="M12 3L2 12h3v9h5v-5h4v5h5v-9h3L12 3z" fill="url(#g-home)"/></svg>,
  },
  {
    key: "main", labelKey: "nav.bibleTracker",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-bible" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#0d9488"/></linearGradient></defs><path d="M3 5h7.5a1.5 1.5 0 0 1 1.5 1.5V20H3V5z" fill="url(#g-bible)"/><path d="M21 5h-7.5A1.5 1.5 0 0 0 12 6.5V20h9V5z" fill="url(#g-bible)" opacity=".8"/><polyline points="6.5 11.5 9.5 14.5 16 8" fill="none" stroke="#f5f3ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    key: "readingPlans", labelKey: "nav.readingPlans", premium: true,
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-plans" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#0369a1"/></linearGradient></defs><rect x="3" y="4" width="18" height="18" rx="3" fill="url(#g-plans)"/><rect x="8" y="2" width="2" height="5" rx="1" fill="#e0f2fe"/><rect x="14" y="2" width="2" height="5" rx="1" fill="#e0f2fe"/><rect x="3" y="10" width="18" height="1.5" fill="rgba(255,255,255,.25)"/><rect x="6" y="14" width="3" height="3" rx=".5" fill="rgba(255,255,255,.55)"/><rect x="10.5" y="14" width="3" height="3" rx=".5" fill="rgba(255,255,255,.55)"/><rect x="15" y="14" width="3" height="3" rx=".5" fill="rgba(255,255,255,.55)"/></svg>,
  },
  {
    key: "studyNotes", labelKey: "nav.studyNotes", premium: true,
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-notes" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6ee7b7"/><stop offset="100%" stopColor="#047857"/></linearGradient></defs><rect x="4" y="3" width="13" height="18" rx="2" fill="url(#g-notes)"/><path d="M17 3l3 3h-2a1 1 0 0 1-1-1V3z" fill="rgba(255,255,255,.4)"/><rect x="7" y="8" width="7" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/><rect x="7" y="11.5" width="9" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/><rect x="7" y="15" width="5" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/></svg>,
  },
  {
    key: "studyTopics", labelKey: "nav.studyTopics",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-study" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6ee7b7"/><stop offset="100%" stopColor="#065f46"/></linearGradient></defs><path d="M3 5h7.5a1.5 1.5 0 0 1 1.5 1.5V19a2.5 2.5 0 0 0-4.5-1.5H3V5z" fill="url(#g-study)"/><path d="M21 5h-7.5A1.5 1.5 0 0 0 12 6.5V19a2.5 2.5 0 0 1 4.5-1.5H21V5z" fill="url(#g-study)" opacity=".8"/></svg>,
  },
];

const NAV_COMMUNITY = [
  {
    key: "forum", labelKey: "nav.forum",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-forum" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fb923c"/><stop offset="100%" stopColor="#c2410c"/></linearGradient></defs><path d="M21 3H3a1 1 0 0 0-1 1v14l5-4h14a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z" fill="url(#g-forum)"/><rect x="7" y="8" width="10" height="1.5" rx=".75" fill="rgba(255,255,255,.45)"/><rect x="7" y="11.5" width="6" height="1.5" rx=".75" fill="rgba(255,255,255,.45)"/></svg>,
  },
  {
    key: "friends", labelKey: "nav.friends",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-friends" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#1d4ed8"/></linearGradient></defs><circle cx="9" cy="7" r="4" fill="url(#g-friends)"/><path d="M2 21a7 7 0 0 1 14 0z" fill="url(#g-friends)"/><circle cx="17.5" cy="8" r="3" fill="url(#g-friends)" opacity=".65"/><path d="M14 21a5.5 5.5 0 0 1 9 0z" fill="url(#g-friends)" opacity=".65"/></svg>,
  },
  {
    key: "messages", labelKey: "nav.messages",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-msgs" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#c084fc"/><stop offset="100%" stopColor="#6d28d9"/></linearGradient></defs><rect x="2" y="4" width="20" height="16" rx="3" fill="url(#g-msgs)"/><path d="M2 8l10 7 10-7" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    key: "groups", labelKey: "nav.studyGroups",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-groups" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#34d399"/><stop offset="100%" stopColor="#065f46"/></linearGradient></defs><circle cx="8" cy="7" r="4" fill="url(#g-groups)"/><path d="M1 21a7 7 0 0 1 14 0z" fill="url(#g-groups)"/><rect x="17" y="8" width="6" height="2" rx="1" fill="url(#g-groups)"/><rect x="19" y="6" width="2" height="6" rx="1" fill="url(#g-groups)"/></svg>,
  },
  {
    key: "feed", labelKey: "nav.feed",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-feed" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#0ea5e9"/><stop offset="100%" stopColor="#38bdf8"/></linearGradient></defs><circle cx="5" cy="19" r="3" fill="url(#g-feed)"/><path d="M4 11a9 9 0 0 1 9 9H9a5 5 0 0 0-5-5v-4z" fill="url(#g-feed)"/><path d="M4 4a16 16 0 0 1 16 16h-4A12 12 0 0 0 4 8V4z" fill="url(#g-feed)"/></svg>,
  },
  {
    key: "bookmarks", labelKey: "nav.bookmarks",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-bm" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#b45309"/></linearGradient></defs><path d="M6 2h12a2 2 0 0 1 2 2v17l-7-4.5L6 21V4a2 2 0 0 1 2-2H6z" fill="url(#g-bm)"/></svg>,
  },
];

const NAV_EXPLORE = [
  {
    key: "blog", labelKey: "nav.blog",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-blog" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f0abfc"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs><rect x="4" y="2" width="13" height="20" rx="2" fill="url(#g-blog)"/><rect x="7" y="7" width="7" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/><rect x="7" y="10.5" width="10" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/><rect x="7" y="14" width="5" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/></svg>,
  },
  {
    key: "leaderboard", labelKey: "nav.leaderboard",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-lb" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#fde68a"/></linearGradient></defs><rect x="3" y="13" width="5" height="9" rx="1.5" fill="url(#g-lb)" opacity=".75"/><rect x="9.5" y="8" width="5" height="14" rx="1.5" fill="url(#g-lb)"/><rect x="16" y="4" width="5" height="18" rx="1.5" fill="url(#g-lb)" opacity=".85"/></svg>,
  },
];

const INLINE_PANELS = new Set(["main", "quiz", "advancedQuiz", "masterQuiz", "leaderboard", "familyQuiz", "readingPlans", "studyNotes", "forum", "blog", "myPosts", "meetingPrep", "friends", "admin", "profile", "publicProfile", "studyTopics", "studyTopicDetail", "bookDetail", "feed", "bookmarks", "groups", "groupDetail", "community", "videos", "videoDetail", "friendRequests", "messages", "history", "trivia", "search", "settings", "blogDash", "videosDash", "creatorRequest", "about", "terms", "privacy"]);

const NAV_SHORTCUTS = [
  {
    key: "quiz", labelKey: "nav.bibleQuiz", bg: "#4338ca",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-practice" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#818cf8"/><stop offset="100%" stopColor="#3730a3"/></linearGradient></defs><path d="M14.5 2L5.5 14h7l-3 8L20.5 10h-7L14.5 2z" fill="url(#g-practice)"/></svg>,
  },
  {
    key: "trivia", labelKey: "nav.triviaBattle", bg: "#6d28d9",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-trivia" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#c084fc"/><stop offset="100%" stopColor="#5b21b6"/></linearGradient></defs><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" fill="url(#g-trivia)"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 3" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1.2" fill="rgba(255,255,255,.8)"/></svg>,
  },
  {
    key: "familyQuiz", labelKey: "nav.familyChallenge", bg: "#0369a1",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-family" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#1d4ed8"/></linearGradient></defs><circle cx="9" cy="7" r="4" fill="url(#g-family)"/><path d="M2 21a7 7 0 0 1 14 0z" fill="url(#g-family)"/><circle cx="17.5" cy="8" r="3" fill="url(#g-family)" opacity=".65"/><path d="M14 21a5.5 5.5 0 0 1 9 0z" fill="url(#g-family)" opacity=".65"/></svg>,
  },
  {
    key: "meetingPrep", labelKey: "nav.meetingPrep", bg: "#0369a1", premium: true,
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-prep" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#0369a1"/></linearGradient></defs><rect x="3" y="3" width="18" height="18" rx="3" fill="url(#g-prep)"/><path d="M7 12l3 3 7-7" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
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
export default function HomePage({ user, navigate, onLogout, darkMode, setDarkMode, i18n, panelRequest, onPanelConsumed }) {
  const { t } = useTranslation();
  const lang = i18n?.language?.split("-")[0] ?? "en";

  // Defer non-critical fetches until after the first paint to keep INP clean
  const [deferred, setDeferred] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDeferred(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Critical — needed above the fold
  const { data: profile } = useFullProfile(user?.id);
  const updateProfile = useUpdateProfile(user?.id);
  const { data: streak = { current_streak: 0, longest_streak: 0 }, isLoading: streakLoading } = useReadingStreak(user?.id);
  const { data: friendPosts = [], isLoading: friendPostsLoading } = useFriendPosts(user?.id);
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const { incoming } = useFriendRequests(user?.id);
  const pendingRequests = incoming.data?.length ?? 0;

  // Deferred — below the fold, load after paint
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
    else if (INLINE_PANELS.has(page)) { setActivePanel(page); setQuizLevelState(null); setPanelParams(params); }
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
  const widgetCls = "rounded-[var(--radius)] border border-[var(--border)] bg-white/[0.03] [html[data-theme=light]_&]:bg-white";
  const metaCls = "text-xs text-[rgba(240,234,255,0.6)] [html[data-theme=light]_&]:text-[rgba(30,16,53,0.68)]";

  return (
    <div className="home-wrap">

      <main id="main-content" className={`home-layout${activePanel === "messages" ? " home-layout--messages" : (activePanel === "main" || activePanel === "profile" || activePanel === "admin") ? " home-layout--tracker" : ""}${activePanel === "admin" ? " home-layout--admin" : ""}${activePanel === "blog" && panelParams.slug ? " home-layout--reading" : ""}`}>

        {/* ═══════════════════════════════════════
            LEFT SIDEBAR
        ═══════════════════════════════════════ */}
        <aside className="home-left-sidebar">
          {/* Profile row */}
          <button className="hls-profile" onClick={() => { setActivePanel("profile"); setQuizLevelState(null); }}>
            <span className="hls-avatar">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt={displayName} width={40} height={40} />
                : <span className="hls-avatar-initials">{initials}</span>}
            </span>
            <span className="hls-name">{displayName}</span>
          </button>

          {/* Core */}
          <div className="hls-section-label">{t("nav.core", "Core")}</div>
          {NAV_CORE.map(item => (
            <button
              key={item.key}
              className={`hls-item${(activePanel === null && item.key === "home") || activePanel === item.key ? " hls-item--active" : ""}`}
              onClick={() => panelNavigate(item.key)}
            >
              <span className="hls-icon">{item.icon}</span>
              {t(item.labelKey)}
            </button>
          ))}

          <div className="hls-divider" />

          {/* Community */}
          <div className="hls-section-label">{t("nav.community", "Community")}</div>
          {NAV_COMMUNITY.map(item => (
            <button
              key={item.key}
              className={`hls-item${activePanel === item.key ? " hls-item--active" : ""}`}
              onClick={() => panelNavigate(item.key)}
            >
              <span className="hls-icon">{item.icon}</span>
              {t(item.labelKey)}
              {item.key === "friends"  && pendingRequests > 0 && <span className="hls-badge">{pendingRequests}</span>}
              {item.key === "messages" && unreadMessages  > 0 && <span className="hls-badge">{unreadMessages}</span>}
            </button>
          ))}

          <div className="hls-divider" />

          {/* Explore */}
          <div className="hls-section-label">{t("nav.explore", "Explore")}</div>
          {NAV_EXPLORE.map(item => (
            <button
              key={item.key}
              className={`hls-item${activePanel === item.key ? " hls-item--active" : ""}`}
              onClick={() => panelNavigate(item.key)}
            >
              <span className="hls-icon">{item.icon}</span>
              {t(item.labelKey)}
            </button>
          ))}

          <div className="hls-divider" />
          <div className="hls-section-label">{t("nav.shortcuts", "Shortcuts")}</div>

          {NAV_SHORTCUTS.map(item => (
            <button
              key={item.key}
              className={`hls-item${activePanel === item.key ? " hls-item--active" : ""}`}
              onClick={() => panelNavigate(item.key)}
            >
              <span className="hls-icon">{item.icon}</span>
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
                <span className="hls-icon">
                  <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-admin" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f87171"/><stop offset="100%" stopColor="#b91c1c"/></linearGradient></defs><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" fill="url(#g-admin)"/><circle cx="12" cy="12" r="3" fill="rgba(255,255,255,.9)"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="rgba(255,255,255,.35)"/></svg>
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
            <span className="hsidebar-footer-sep">&middot;</span>
            <a href="https://www.jw.org" className="hsidebar-footer-link" target="_blank" rel="noopener noreferrer">JW.org</a>
          </div>
        </aside>

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
          {activePanel === "search" && (
            <Suspense fallback={<div className="skeleton" style={{height:400,borderRadius:12}} />}>
              <SearchInline user={user} onBack={() => setActivePanel(null)} navigate={panelNavigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} />
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
          {/* ── Home feed (hidden when a panel is active) ── */}
          {activePanel === null && <>

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

          {/* Quick Actions */}
          <div className="home-quick-actions">
            <button className="hqa-btn hqa-btn--primary" onClick={() => panelNavigate("main")}>
              <span className="hqa-icon">📖</span>
              Continue Reading
            </button>
            <button className="hqa-btn" onClick={() => panelNavigate("quiz")}>
              <span className="hqa-icon">🎯</span>
              Today's Quiz
            </button>
            <button className="hqa-btn" onClick={() => panelNavigate("meetingPrep")}>
              <span className="hqa-icon">✅</span>
              Meeting Prep
            </button>
          </div>

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

          {/* Posts Feed — merge friend posts + public feed, dedup & sort */}
          {(() => {
            const seen = new Set<string>();
            const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
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
                      {/* Post header — avatar + name + time + delete */}
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

                      {/* Post content */}
                      <div
                        className="rich-content px-4 pb-3"
                        dangerouslySetInnerHTML={{ __html: sanitizeRich(post.content) }}
                      />

                      {/* Post image — aspect-ratio container reserves space before image loads */}
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

          {/* Videos — link to full list */}
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

          {/* Friends */}
          <div className={widgetCls}>
            <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[var(--text-primary)]">Friends</span>
                {onlineFriends.length > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-green-400">
                    <span className="inline-block size-1.5 rounded-full bg-green-400" />
                    {onlineFriends.length}
                  </span>
                )}
              </div>
              <button className={feedLinkCls} onClick={() => navigate("friends")}>See all</button>
            </div>
            {friendsLoading ? (
              <div className="flex flex-col gap-2 py-1 pb-3">
                {[0,1,2].map(i => (
                  <div key={i} className="flex items-center gap-3 px-4">
                    <div className="skeleton size-9 shrink-0 rounded-full" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="skeleton h-3 w-[50%] rounded" />
                      <div className="skeleton h-2.5 w-[30%] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : friends.length === 0 ? (
              <div className="px-4 pb-4 pt-1">
                <p className="mb-2 text-[13px] text-[var(--text-muted)]">Connect with fellow Bible students to see their activity here.</p>
                <button className="cursor-pointer border-none bg-none p-0 font-[inherit] text-xs font-bold text-[#a78bfa]" style={{ background: "none" }} onClick={() => navigate("friends")}>Find friends →</button>
              </div>
            ) : (
              <div className="pb-2">
                {shownFriends.map(f => {
                  const isOnline = !!f.last_active_at && now - new Date(f.last_active_at).getTime() < ONLINE_THRESHOLD_MS;
                  const diff = f.last_active_at ? now - new Date(f.last_active_at).getTime() : null;
                  const when = fmtDiff(isOnline ? 0 : diff);
                  const [g1, g2] = avatarGradient(f.id);
                  return (
                    <div key={f.id} className="flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors duration-100 hover:bg-brand-600/[0.07]" onClick={() => navigate("publicProfile", { userId: f.id })}>
                      <span className="relative shrink-0">
                        <span className="flex size-9 items-center justify-center overflow-hidden rounded-full text-[13px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
                          {f.avatar_url ? <img src={f.avatar_url} alt={f.display_name ?? ""} className="h-full w-full object-cover" width={36} height={36} loading="lazy" /> : (f.display_name || "?")[0].toUpperCase()}
                        </span>
                        {isOnline && <span className="absolute -bottom-px -right-px size-3 rounded-full border-2 border-[var(--card-bg,var(--bg))] bg-green-400" />}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{f.display_name || "Unknown"}</span>
                        <span className={`text-xs ${isOnline ? "font-semibold text-green-400" : metaCls}`}>{when}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Who's Online */}
          <div className={widgetCls}>
            <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[var(--text-primary)]">Who's Online</span>
                {totalOnline > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-green-400">
                    <span className="inline-block size-1.5 rounded-full bg-green-400" />
                    {totalOnline}
                  </span>
                )}
              </div>
              <button className={feedLinkCls} onClick={() => navigate("community")}>See all →</button>
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
              <p style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 16px", textAlign: "center", margin: 0 }}>
                Could not load members
              </p>
            ) : whoMembers.length === 0 ? (
              <div style={{ padding: "8px 16px 12px", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 4px" }}>No one active right now</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, opacity: 0.7 }}>Share your reading progress to show up here</p>
              </div>
            ) : (
              <>
                {whoMembers.slice(0, 6).map(m => {
                  const isOnline = m.last_active_at != null &&
                    now - new Date(m.last_active_at).getTime() < WHO_THRESHOLD_MS;
                  const diff = m.last_active_at ? now - new Date(m.last_active_at).getTime() : null;
                  const when = fmtDiff(isOnline ? 0 : diff);
                  const [g1, g2] = avatarGradient(m.id);
                  return (
                    <div
                      key={m.id}
                      className="flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors duration-100 hover:bg-brand-600/[0.07]"
                      onClick={() => navigate("publicProfile", { userId: m.id })}
                    >
                      <span className="relative shrink-0">
                        <span className="flex size-9 items-center justify-center overflow-hidden rounded-full text-[13px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}>
                          {m.avatar_url
                            ? <img src={m.avatar_url} alt={m.display_name ?? ""} loading="lazy" className="h-full w-full object-cover" width={36} height={36} />
                            : (m.display_name || "?")[0].toUpperCase()}
                        </span>
                        {isOnline && <span className="absolute -bottom-px -right-px size-3 rounded-full border-2 border-[var(--card-bg,var(--bg))] bg-green-400" />}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{m.display_name || "Anonymous"}</span>
                        <span className={`text-xs ${isOnline ? "font-semibold text-green-400" : metaCls}`}>{when}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="h-2" />
              </>
            )}
          </div>

          {/* Community Notes */}
          {(lang === "en" || previewNotes.length > 0) && (
          <div className={widgetCls}>
            <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
              <span className="text-base font-bold text-[var(--text-primary)]">{t("home.notesTitle")}</span>
              <button className={feedLinkCls} onClick={() => navigate("studyNotes", { tab: "public" })}>{t("home.notesViewAll")}</button>
            </div>
            {notesLoading ? <ForumSkeleton /> : previewNotes.length === 0 ? (
              <EmptyState
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>}
                title={t("home.notesEmpty")} sub={t("home.notesEmptySub")}
                btnLabel={t("home.notesWriteBtn")} onBtn={() => navigate("studyNotes", { tab: "public" })}
              />
            ) : (
              <>
                {(notesExpanded ? previewNotes : previewNotes.slice(0, 1)).map(note => {
                  const passage = note.book_index != null
                    ? `${BOOKS[note.book_index]?.name ?? ""} ${note.chapter ?? ""}`.trim()
                    : null;
                  return (
                    <div key={note.id} className="flex cursor-pointer items-start gap-2.5 px-4 py-2.5 transition-colors duration-100 hover:bg-brand-600/[0.06]" onClick={() => navigate("studyNotes", { tab: "public" })}>
                      <button
                        className="flex size-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#2e1a5c] to-brand-800 text-[12px] font-bold text-white"
                        onClick={e => { e.stopPropagation(); navigate("publicProfile", { userId: note.user_id }); }}
                        title={note.author?.display_name ?? "Anonymous"}
                      >
                        {note.author?.avatar_url
                          ? <img src={note.author.avatar_url} alt={note.author.display_name} className="h-full w-full object-cover" width={32} height={32} loading="lazy" />
                          : (note.author?.display_name ?? "A")[0].toUpperCase()}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold leading-snug text-[var(--text-primary)]">{note.title || "Untitled"}</div>
                        <div className={metaCls}>
                          {note.author?.display_name ?? "Anonymous"}
                          {passage && <> · {passage}</>}
                          {" · "}{formatDate(note.updated_at)}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 self-center text-[13px] ${note.user_has_liked ? "text-fuchsia-400" : "text-[rgba(240,234,255,0.5)] [html[data-theme=light]_&]:text-[rgba(30,16,53,0.4)]"}`}
                      >
                        {note.user_has_liked ? "\u2665" : "\u2661"}{note.like_count > 0 ? ` ${note.like_count}` : ""}
                      </span>
                    </div>
                  );
                })}
                <button
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-b-[var(--radius)] border-none bg-brand-600/10 py-2.5 text-xs font-semibold text-[var(--accent)] transition-colors duration-100 hover:bg-brand-600/20 [html[data-theme=light]_&]:bg-brand-600/[0.07] [html[data-theme=light]_&]:hover:bg-brand-600/[0.12]"
                  onClick={() => previewNotes.length > 1 && !notesExpanded ? setNotesExpanded(true) : navigate("studyNotes", { tab: "public" })}
                >
                  {notesExpanded ? "View all notes" : previewNotes.length > 1 ? `Show ${previewNotes.length - 1} more` : "View all notes"}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: notesExpanded ? "rotate(180deg)" : "none", transition: "transform 200ms" }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </>
            )}
          </div>
          )}

          {/* Forum Highlights */}
          {(lang === "en" || topThreads.length > 0) && (
          <div className={widgetCls}>
            <div className="flex items-center justify-between px-4 pb-2.5 pt-3.5">
              <span className="text-base font-bold text-[var(--text-primary)]">{t("home.forumTitle")}</span>
              <button className={feedLinkCls} onClick={() => navigate("forum")}>{t("home.forumViewAll")}</button>
            </div>
            {threadsLoading ? <ForumSkeleton /> : topThreads.length === 0 ? (
              <EmptyState
                icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                title="No discussions yet" sub="Start the first conversation."
                btnLabel="Start a thread \u2192" onBtn={() => navigate("forum")}
              />
            ) : (
              <>
                {(forumExpanded ? topThreads : topThreads.slice(0, 1)).map(thread => (
                  <div
                    key={thread.id}
                    className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 transition-colors duration-100 hover:bg-brand-600/[0.06]"
                    onClick={() => navigate("forum", { categoryId: thread.category_id, threadId: thread.id })}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white/[0.06] text-[12px] font-bold text-[var(--accent)]">
                      {(authorName(thread) || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold leading-snug text-[var(--text-primary)]">{thread.title}</div>
                      <div className={metaCls}>{authorName(thread)} · {formatDate(thread.updated_at)}</div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-[rgba(240,234,255,0.5)] [html[data-theme=light]_&]:text-[rgba(30,16,53,0.5)]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {formatNum(thread.forum_replies?.[0]?.count ?? 0)}
                    </span>
                  </div>
                ))}
                <button
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-b-[var(--radius)] border-none bg-brand-600/10 py-2.5 text-xs font-semibold text-[var(--accent)] transition-colors duration-100 hover:bg-brand-600/20 [html[data-theme=light]_&]:bg-brand-600/[0.07] [html[data-theme=light]_&]:hover:bg-brand-600/[0.12]"
                  onClick={() => topThreads.length > 1 && !forumExpanded ? setForumExpanded(true) : navigate("forum")}
                >
                  {forumExpanded ? "View all threads" : topThreads.length > 1 ? `Show ${topThreads.length - 1} more` : "View all threads"}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: forumExpanded ? "rotate(180deg)" : "none", transition: "transform 200ms" }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </>
            )}
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
