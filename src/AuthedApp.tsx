import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSession, useLogout } from "./hooks/useAuth";
import { useFullProfile } from "./hooks/useAdmin";
import { useFeatureFlags } from "./hooks/useFeatureFlags";
import { supabase } from "./lib/supabase";
import { parsePath, buildPath, type NavState } from "./lib/router";
import { toast } from "./lib/toast";
import { getStoredReferralCode, clearStoredReferralCode, trackSignup } from "./lib/analytics";
import LoadingSpinner from "./components/LoadingSpinner";
import MobileTabBar from "./components/MobileTabBar";
import TopBar from "./components/TopBar";
import CommandPalette from "./components/CommandPalette";
import { BOOKS } from "./data/books";
import { usePostBySlugForEdit } from "./hooks/useBlog";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ConsentGate from "./components/ConsentGate";
import "./styles/app.css";

const AuthPage          = lazy(() => import("./views/auth/AuthPage"));
const ResetPasswordPage = lazy(() => import("./views/auth/ResetPasswordPage"));
const HomePage          = lazy(() => import("./views/HomePage"));
const ChecklistPage     = lazy(() => import("./views/ChecklistPage"));
const OfflineBanner        = lazy(() => import("./components/OfflineBanner"));
const AnnouncementBanner   = lazy(() => import("./components/AnnouncementBanner"));
const Toast             = lazy(() => import("./components/Toast"));
const InstallPrompt     = lazy(() => import("./components/InstallPrompt"));
const PageFooter        = lazy(() => import("./components/PageFooter"));
const AdminPage         = lazy(() => import("./views/admin/AdminPage"));
const ProfilePage       = lazy(() => import("./views/profile/ProfilePage"));
const BlogPage          = lazy(() => import("./views/blog/BlogPage"));
const BlogDashboard     = lazy(() => import("./views/blog/BlogDashboard"));
const MyPostsPage       = lazy(() => import("./views/blog/MyPostsPage"));
const WriterPage        = lazy(() => import("./views/blog/WriterPage"));
const ForumPage         = lazy(() => import("./views/forum/ForumPage"));
const QuizPage          = lazy(() => import("./views/quiz/QuizPage"));
const QuizLevel         = lazy(() => import("./views/quiz/QuizPage").then(m => ({ default: m.QuizLevel })));
const AdvancedQuizPage  = lazy(() => import("./views/quiz/AdvancedQuizPage"));
const AdvancedQuizLevel = lazy(() => import("./views/quiz/AdvancedQuizPage").then(m => ({ default: m.AdvancedQuizLevel })));
const MasterQuizPage    = lazy(() => import("./views/quiz/MasterQuizPage"));
const MasterQuizLevel   = lazy(() => import("./views/quiz/MasterQuizPage").then(m => ({ default: m.MasterQuizLevel })));
const SettingsPage      = lazy(() => import("./views/profile/SettingsPage"));
const SearchPage        = lazy(() => import("./views/search/SearchPage"));
const BookmarksPage     = lazy(() => import("./views/bookmarks/BookmarksPage"));
const ReadingHistory    = lazy(() => import("./views/reading/ReadingHistory"));
const ActivityFeed      = lazy(() => import("./views/social/ActivityFeed"));
const LeaderboardPage   = lazy(() => import("./views/LeaderboardPage"));
const AboutPage         = lazy(() => import("./views/AboutPage"));
const TermsPage         = lazy(() => import("./views/TermsPage"));
const PrivacyPage       = lazy(() => import("./views/PrivacyPage"));
const ReadingPlansPage  = lazy(() => import("./views/readingplans/ReadingPlansPage"));
const StudyNotesPage    = lazy(() => import("./views/studynotes/StudyNotesPage"));
const MessagesPage      = lazy(() => import("./views/messages/MessagesPage"));
const FloatingChat      = lazy(() => import("./components/messages/FloatingChat"));
const AIStudyBubble     = lazy(() => import("./components/AIStudyBubble"));
const GroupsPage        = lazy(() => import("./views/groups/GroupsPage"));
const GroupDetail       = lazy(() => import("./views/groups/GroupDetail"));
const NotFoundPage      = lazy(() => import("./views/NotFoundPage"));
const StudyTopicsPage   = lazy(() => import("./views/studytopics/StudyTopicsPage"));
const StudyTopicDetail  = lazy(() => import("./views/studytopics/StudyTopicDetail"));
const BookDetailPage    = lazy(() => import("./views/studytopics/BookDetailPage"));
const FamilyQuizPage    = lazy(() => import("./views/familyquiz/FamilyQuizPage"));
const MeetingPrepPage   = lazy(() => import("./views/meetingprep/MeetingPrepPage"));
const TriviaPage        = lazy(() => import("./views/trivia/TriviaPage"));
const FriendRequestsPage = lazy(() => import("./views/friends/FriendRequestsPage"));
const InviteLandingPage  = lazy(() => import("./views/friends/InviteLandingPage"));
const CommunityPage      = lazy(() => import("./views/community/CommunityPage"));
const VideosPage         = lazy(() => import("./views/videos/VideosPage"));
const VideoDetailPage    = lazy(() => import("./views/videos/VideoDetailPage"));
const VideoComposerPage  = lazy(() => import("./views/videos/VideoComposerPage"));
const CreatorRequestPage = lazy(() => import("./views/videos/CreatorRequestPage"));

// ── Lazy-page wrapper with error boundary ─────────────────────────────────────

const pageFallback = <LoadingSpinner />;

function Page({ children, noFooter = false }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={pageFallback}>
        <main id="main-content" className="page-transition">
          {children}
        </main>
        {!noFooter && <PageFooter />}
      </Suspense>
    </ErrorBoundary>
  );
}


// ── Authenticated app with routing ────────────────────────────────────────────

const VALID_PAGES = ["readingPlans", "studyNotes", "quiz", "forum", "blog", "main", "friends", "friendRequests"];

// Module-level so useState initializers can reference it synchronously
const HOME_PANELS = new Set(["quiz", "quizLevel", "advancedQuiz", "advancedQuizLevel", "masterQuiz", "masterQuizLevel", "leaderboard", "familyQuiz", "forum", "blog", "myPosts", "readingPlans", "studyNotes", "meetingPrep", "friends", "admin", "profile", "publicProfile", "main", "groups", "groupDetail", "community", "videos", "videoDetail", "friendRequests", "bookDetail", "studyTopicDetail", "history", "trivia", "search", "settings", "blogDash", "videosDash", "creatorRequest", "about", "terms", "privacy"]);

function toPanelKey(page: string) {
  if (page === "quizLevel") return "quiz";
  if (page === "advancedQuizLevel") return "advancedQuiz";
  if (page === "masterQuizLevel") return "masterQuiz";
  return page;
}

function BibleApp({ user, onLogout, i18n, aiEnabled }) {
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useFullProfile(user.id);

  // Apply referral code if present (runs once after profile loads)
  useEffect(() => {
    if (!profile || profile.referred_by) return;
    const refCode = getStoredReferralCode();
    if (!refCode) return;
    import("./api/referral").then(({ referralApi }) => {
      referralApi.applyReferral(user.id, refCode).then((applied) => {
        if (applied) clearStoredReferralCode();
      }).catch(() => {});
    });
  }, [profile, user.id]);

  // Update last_active_at for re-engagement email targeting
  useEffect(() => {
    supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", user.id).then(() => {});
  }, [user.id]);

  const [nav, setNav] = useState<NavState>(() => {
    const p = parsePath();
    return (p.page !== "home" && HOME_PANELS.has(p.page)) ? { page: "home" } : p;
  });
  const [pendingAIDraft, setPendingAIDraft] = useState<{ title: string; content: string; excerpt: string } | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("nwt-theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return true; // Default to dark — focused reading experience
  });
  const [showCmdPalette, setShowCmdPalette] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("nwt-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Follow OS theme changes in real time (user can still manually override via the toggle)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onOsChange(e) { setDarkMode(e.matches); }
    mq.addEventListener("change", onOsChange);
    return () => mq.removeEventListener("change", onOsChange);
  }, []);

  useEffect(() => {
    const handler = () => {
      const p = parsePath();
      if (p.page !== "home" && HOME_PANELS.has(p.page)) {
        setNav({ page: "home" });
        setHomePanelRequest({ panel: toPanelKey(p.page), params: p });
      } else {
        setNav(p);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // Navigate to blog editor when AI creates a draft from any page
  useEffect(() => {
    function handler(e: Event) {
      const draft = (e as CustomEvent<{ title: string; content: string; excerpt: string }>).detail;
      setPendingAIDraft(draft);
      navigate("blogNew");
    }
    window.addEventListener("ai:blog-draft", handler);
    return () => window.removeEventListener("ai:blog-draft", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // AI-driven navigation
  useEffect(() => {
    function handler(e: Event) {
      const { page } = (e as CustomEvent<{ page: string }>).detail;
      navigate(page);
    }
    window.addEventListener("ai:navigate", handler);
    return () => window.removeEventListener("ai:navigate", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ⌘K / Ctrl+K — open command palette
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCmdPalette(v => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Handle push notification tap — service worker posts { type: "push-navigate", url }
  // instead of using client.navigate() which is unreliable on Android Chrome.
  useEffect(() => {
    function handler(e) {
      if (e.data?.type === "push-navigate" && typeof e.data.url === "string") {
        const path = e.data.url;
        history.pushState(null, "", path);
        const p = parsePath();
        if (p.page !== "home" && HOME_PANELS.has(p.page)) {
          setNav({ page: "home" });
          setHomePanelRequest({ panel: toPanelKey(p.page), params: p });
        } else {
          setNav(p);
        }
      }
    }
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, []);

  // Clear the app icon badge when the user returns to the app
  useEffect(() => {
    function clearBadge() {
      if ("clearAppBadge" in navigator) navigator.clearAppBadge().catch(() => {});
    }
    clearBadge(); // clear on mount
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") clearBadge();
    });
  }, []);

  // Show a toast when a new badge is earned
  useEffect(() => {
    function handleBadgeEarned(e) {
      const { badge } = e.detail;
      toast(`${badge.emoji} Achievement Unlocked — ${badge.label}`);
    }
    window.addEventListener("badge-earned", handleBadgeEarned);
    return () => window.removeEventListener("badge-earned", handleBadgeEarned);
  }, []);

  const [homePanelRequest, setHomePanelRequest] = useState<{ panel: string; params: Record<string, any> } | null>(() => {
    const p = parsePath();
    if (p.page !== "home" && HOME_PANELS.has(p.page)) {
      return { panel: toPanelKey(p.page), params: p };
    }
    return null;
  });

  const navigate = (page, params: Record<string, any> = {}) => {
    if (page === "home") {
      if (window.location.pathname !== "/") history.pushState(null, "", "/");
      setNav({ page: "home" });
      setHomePanelRequest({ panel: "home", params: {} });
      return;
    }
    if (HOME_PANELS.has(page)) {
      // Always push the real URL so reload preserves state
      const url = buildPath(page, params);
      history.pushState(null, "", url);
      setNav({ page: "home" });
      setHomePanelRequest({ panel: toPanelKey(page), params });
      return;
    }
    const path = buildPath(page, params);
    history.pushState(null, "", path);
    setNav({ page, ...params });
  };

  // Handle email deep-link params: ?page=X navigates into the app
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get("page");
    if (!page) return;
    history.replaceState(null, "", window.location.pathname);
    if (VALID_PAGES.includes(page)) navigate(page);
  }, []); // runs once on mount

  const sharedNav = { navigate, darkMode, setDarkMode, i18n, user, onLogout, currentPage: nav.page, onSearchClick: () => setShowCmdPalette(true) };

  const aiContext = useMemo(() => {
    const ctx: { page: string; bookIndex?: number; bookName?: string; chapter?: number } = { page: nav.page };
    if ("bookIndex" in nav && typeof nav.bookIndex === "number") {
      ctx.bookIndex = nav.bookIndex;
      ctx.bookName  = BOOKS[nav.bookIndex]?.name;
    }
    if ("openBook" in nav && typeof nav.openBook === "number") {
      ctx.bookIndex = nav.openBook;
      ctx.bookName  = BOOKS[nav.openBook]?.name;
    }
    if ("openChapter" in nav && typeof nav.openChapter === "number") {
      ctx.chapter = nav.openChapter;
    }
    return ctx;
  }, [nav]);

  let pageContent = null;
  if (nav.page === "home") pageContent = <Page><HomePage user={user} navigate={navigate} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} panelRequest={homePanelRequest} onPanelConsumed={() => setHomePanelRequest(null)} /></Page>;
  else if (nav.page === "main") pageContent = <Page><ChecklistPage user={user} profile={profile} {...sharedNav} openBook={nav.openBook} openChapter={nav.openChapter} /></Page>;
  else if (nav.page === "admin") {
    if (!profileLoading && !profile?.is_admin && !profile?.is_moderator) navigate("home");
    else if (profile?.is_admin || profile?.is_moderator) pageContent = <Page><AdminPage currentUser={user} currentProfile={profile} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  }
  else if (nav.page === "profile")  pageContent = <Page><ProfilePage user={user} viewedUserId={user.id} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "settings") pageContent = <Page><SettingsPage user={user} onBack={() => navigate("profile")} {...sharedNav} /></Page>;
  else if (nav.page === "publicProfile") pageContent = <Page><ProfilePage user={user} viewedUserId={nav.userId} isOwner={false} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "blog") pageContent = (
    <Page>
      <BlogPage
        user={user} profile={profile} slug={nav.slug ?? null}
        onSelectPost={(slug) => navigate("blog", { slug })}
        onBack={() => navigate("home")}
        onWriteClick={() => navigate("blogNew")}
        onMyPostsClick={() => navigate("myPosts")}
        {...sharedNav}
      />
    </Page>
  );
  else if (nav.page === "blogDash") {
    pageContent = <Page><BlogDashboard user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  }
  else if (nav.page === "blogNew") {
    const prefill = !pendingAIDraft && nav.prefillTitle
      ? { title: nav.prefillTitle as string, content: "", excerpt: "" }
      : null;
    pageContent = <Page><WriterPage user={user} navigate={navigate} initialDraft={pendingAIDraft ?? prefill} onDraftConsumed={() => setPendingAIDraft(null)} /></Page>;
  }
  else if (nav.page === "blogEdit") {
    pageContent = <Page><BlogEditLoader slug={nav.slug} user={user} navigate={navigate} /></Page>;
  }
  else if (nav.page === "forum") pageContent = (
    <Page>
      <ForumPage
        user={user} profile={profile}
        categoryId={nav.categoryId ?? null} threadId={nav.threadId ?? null}
        onNavigate={(categoryId, threadId) => navigate("forum", { categoryId, threadId })}
        onBack={() => navigate("home")}
        {...sharedNav}
      />
    </Page>
  );
  else if (nav.page === "quiz")      pageContent = <Page><QuizPage user={user} {...sharedNav} /></Page>;
  else if (nav.page === "quizLevel") pageContent = <Page><QuizLevel level={nav.level} user={user} onBack={() => navigate("quiz")} onComplete={() => navigate("quiz")} {...sharedNav} /></Page>;
  else if (nav.page === "advancedQuiz")      pageContent = <Page><AdvancedQuizPage user={user} {...sharedNav} /></Page>;
  else if (nav.page === "advancedQuizLevel") pageContent = <Page><AdvancedQuizLevel level={nav.level} user={user} onBack={() => navigate("advancedQuiz")} onComplete={() => navigate("advancedQuiz")} {...sharedNav} timedMode={nav.timedMode} /></Page>;
  else if (nav.page === "masterQuiz")        pageContent = <Page><MasterQuizPage user={user} {...sharedNav} /></Page>;
  else if (nav.page === "masterQuizLevel")   pageContent = <Page><MasterQuizLevel level={nav.level} user={user} onBack={() => navigate("masterQuiz")} onComplete={() => navigate("masterQuiz")} {...sharedNav} timedMode={nav.timedMode} /></Page>;
  else if (nav.page === "search")    pageContent = <Page><SearchPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "bookmarks") pageContent = <Page><BookmarksPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "history")   pageContent = <Page><ReadingHistory user={user} onBack={() => navigate("main")} {...sharedNav} /></Page>;
  else if (nav.page === "feed")      pageContent = <Page><ActivityFeed user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "readingPlans") pageContent = <Page><ReadingPlansPage user={user} navigate={navigate} {...sharedNav} /></Page>;
  else if (nav.page === "studyNotes")   pageContent = <Page><StudyNotesPage user={user} navigate={navigate} initialTab={nav.tab ?? "mine"} {...sharedNav} /></Page>;
  else if (nav.page === "studyTopics")      pageContent = <Page><StudyTopicsPage user={user} navigate={navigate} {...sharedNav} /></Page>;
  else if (nav.page === "studyTopicDetail") pageContent = <Page><StudyTopicDetail user={user} navigate={navigate} slug={nav.slug} {...sharedNav} /></Page>;
  else if (nav.page === "bookDetail") pageContent = <Page><BookDetailPage user={user} navigate={navigate} bookIndex={nav.bookIndex} {...sharedNav} /></Page>;
  else if (nav.page === "familyQuiz") pageContent = (
    <Page>
      <FamilyQuizPage
        user={user}
        {...sharedNav}
        {...(nav.challengeId ? { initialChallengeId: nav.challengeId } : {})}
      />
    </Page>
  );
  else if (nav.page === "leaderboard") pageContent = <Page><LeaderboardPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "about")     pageContent = <Page><AboutPage {...sharedNav} /></Page>;
  else if (nav.page === "terms")     pageContent = <Page><TermsPage {...sharedNav} /></Page>;
  else if (nav.page === "privacy")   pageContent = <Page><PrivacyPage {...sharedNav} /></Page>;
  else if (nav.page === "messages")     pageContent = <Page noFooter><MessagesPage {...sharedNav} onBack={() => navigate("home")} initialConv={nav.conversationId ? { conversation_id: nav.conversationId, other_display_name: nav.otherDisplayName ?? null, other_avatar_url: nav.otherAvatarUrl ?? null } : null} /></Page>;
  else if (nav.page === "groups")       pageContent = <Page><GroupsPage {...sharedNav} /></Page>;
  else if (nav.page === "groupDetail")  pageContent = <Page><GroupDetail {...sharedNav} groupId={nav.groupId} /></Page>;
  else if (nav.page === "meetingPrep") pageContent = <Page><MeetingPrepPage user={user} navigate={navigate} {...sharedNav} /></Page>;
  else if (nav.page === "trivia") pageContent = <Page noFooter><TriviaPage user={user} navigate={navigate} prefillCode={(nav as any).prefillCode as string | undefined} /></Page>;
  else if (nav.page === "friends")
    pageContent = <Page><ProfilePage user={user} viewedUserId={user.id} onBack={() => navigate("home")} defaultTab="friends" {...sharedNav} /></Page>;
  else if (nav.page === "friendRequests")
    pageContent = <Page><FriendRequestsPage user={user} navigate={navigate} {...sharedNav} /></Page>;
  else if (nav.page === "community")
    pageContent = <Page><CommunityPage user={user} navigate={navigate} {...sharedNav} /></Page>;
  else if (nav.page === "videos")
    pageContent = (
      <Page>
        <VideosPage
          user={user}
          profile={profile}
          onSelectVideo={(slug: string) => navigate("videoDetail", { slug })}
          onBack={() => navigate("home")}
          onPostClick={() => navigate("videosDash")}
          {...sharedNav}
        />
      </Page>
    );
  else if (nav.page === "videoDetail")
    pageContent = (
      <Page>
        <VideoDetailPage
          user={user}
          slug={(nav as { page: "videoDetail"; slug: string }).slug}
          onBack={() => navigate("videos")}
          {...sharedNav}
        />
      </Page>
    );
  else if (nav.page === "videosDash") {
    if (!profileLoading && profile && !profile.is_approved_creator && !profile.is_admin) navigate("videos");
    else if (!profileLoading)
      pageContent = (
        <Page>
          <VideoComposerPage user={user} onBack={() => navigate("videos")} {...sharedNav} />
        </Page>
      );
  }
  else if (nav.page === "creatorRequest")
    pageContent = (
      <Page>
        <CreatorRequestPage user={user} onBack={() => navigate("videos")} {...sharedNav} />
      </Page>
    );
  // Truly unknown URL → 404
  else if (nav.page === "notFound") {
    pageContent = (
      <Page>
        <NotFoundPage navigate={navigate} {...sharedNav} />
      </Page>
    );
  }

  if (!pageContent) {
    if (profileLoading) return null;
    return null;
  }

  if (!profileLoading && profile && !profile.terms_accepted_at) {
    return <ConsentGate userId={user.id} />;
  }

  return (
    <>
      {/* inert hides all background content from keyboard/AT when palette is open */}
      <div inert={showCmdPalette}>
        <TopBar {...sharedNav} />
        <div key={nav.page} className="page-fade-in">
          {pageContent}
        </div>
        {nav.page !== "messages" && <MobileTabBar navigate={navigate} currentPage={nav.page} userId={user?.id} />}
        {nav.page !== "messages" && (
          <Suspense fallback={null}>
            <FloatingChat
              user={user}
              navigate={navigate}
              initialConvId={null}
              initialConvName={null}
              initialConvAvatar={null}
            />
          </Suspense>
        )}
        {nav.page !== "messages" && ["en", "es"].includes((i18n.language ?? "en").slice(0, 2)) && (
          <Suspense fallback={null}>
            <AIStudyBubble context={aiContext} />
          </Suspense>
        )}
      </div>
      {showCmdPalette && createPortal(
        <CommandPalette
          navigate={navigate}
          onClose={() => setShowCmdPalette(false)}
          isAdmin={!!profile?.is_admin || !!profile?.is_moderator}
        />,
        document.body
      )}
    </>
  );
}

// ── Blog edit loader — fetches post before mounting WriterPage ────────────────
function BlogEditLoader({ slug, user, navigate }: { slug: string; user: { id: string }; navigate: (p: string, params?: Record<string, unknown>) => void }) {
  const { data: post, isLoading } = usePostBySlugForEdit(slug, user.id);
  if (isLoading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>;
  if (!post) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Post not found.</div>;
  return (
    <Suspense fallback={null}>
      <WriterPage user={user} navigate={navigate} editPost={post as any} />
    </Suspense>
  );
}

// ── Auth shell ────────────────────────────────────────────────────────────────

export default function AuthedApp({ onShowLanding, i18n }) {
  const queryClient = useQueryClient();
  const { data: session, isLoading: authLoading } = useSession();
  const logout = useLogout();
  const user = session?.user ?? null;
  const { t } = useTranslation();
  const { maintenanceMode, aiEnabled } = useFeatureFlags();
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState(null);

  // Apply saved theme immediately so auth/sign-up pages respect dark mode
  useEffect(() => {
    const saved = localStorage.getItem("nwt-theme");
    if (saved === "dark" || saved === "light") {
      document.documentElement.dataset.theme = saved;
    } else {
      // Default to dark for new users — focused reading experience
      document.documentElement.dataset.theme = "dark";
    }
  }, []);

  // Keep React Query cache in sync with Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      queryClient.setQueryData(["session"], newSession);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      if ((event as string) === "USER_DELETED" || (event === "SIGNED_OUT" && !newSession)) {
        queryClient.removeQueries({ predicate: q => q.queryKey[0] !== "session" });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  if (authLoading) return <LoadingSpinner className="spinner-wrap--fullscreen" />;
  if (maintenanceMode) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:"1rem"}}><h1>🔧 Maintenance</h1><p>We'll be back shortly.</p></div>;

  // Allow unauthenticated read-only access to blog posts
  const publicNav = parsePath();
  if (!user && publicNav.page === "blog" && publicNav.slug) {
    document.documentElement.dataset.theme = "light";
    const publicNavigate = (page, params = {}) => {
      history.pushState(null, "", buildPath(page, params));
    };
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <BlogPage
            user={null} profile={null}
            slug={publicNav.slug}
            onSelectPost={(slug) => publicNavigate("blog", { slug })}
            onBack={() => { history.pushState(null, "", "/"); onShowLanding(); }}
            onWriteClick={null}
            navigate={publicNavigate}
            darkMode={false} setDarkMode={() => {}}
            i18n={i18n} onLogout={null}
          />
          <PageFooter />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (!user && publicNav.page === "invite") {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <InviteLandingPage token={publicNav.token} navigate={(page) => { history.pushState(null, "", "/" + page); }} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (passwordRecovery) {
    return <main id="main-content"><Suspense fallback={null}><ResetPasswordPage onDone={() => setPasswordRecovery(false)} /></Suspense></main>;
  }

  // Show email confirmation screen after signup — rendered here so it
  // survives even if Supabase sets a session before the user confirms.
  if (registeredEmail) {
    return (
      <main id="main-content">
        <Suspense fallback={null}>
          <AuthPage
            onBack={onShowLanding}
            confirmedEmail={registeredEmail}
            onConfirmDismiss={() => setRegisteredEmail(null)}
          />
        </Suspense>
      </main>
    );
  }

  if (!user) {
    if (publicNav.page === "notFound") {
      return (
        <ErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            <NotFoundPage navigate={() => { history.pushState(null, "", "/"); onShowLanding(); }} />
          </Suspense>
        </ErrorBoundary>
      );
    }
    return (
      <main id="main-content">
        <Suspense fallback={null}>
          <AuthPage onBack={onShowLanding} onRegisterSuccess={(email) => setRegisteredEmail(email)} />
        </Suspense>
      </main>
    );
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Suspense fallback={null}><OfflineBanner /></Suspense>
      <Suspense fallback={null}><AnnouncementBanner /></Suspense>
      <Suspense fallback={null}><Toast /></Suspense>
      <Suspense fallback={null}><InstallPrompt /></Suspense>
      <BibleApp
        user={user}
        onLogout={() => { logout.mutate(); onShowLanding(); }}
        i18n={i18n}
        aiEnabled={aiEnabled}
      />
    </>
  );
}
