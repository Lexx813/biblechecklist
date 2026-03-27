import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
const AuthPage          = lazy(() => import("./components/auth/AuthPage"));
const ResetPasswordPage = lazy(() => import("./components/auth/ResetPasswordPage"));
const HomePage          = lazy(() => import("./components/HomePage"));
const LandingPage       = lazy(() => import("./components/LandingPage"));
const ChecklistPage     = lazy(() => import("./components/ChecklistPage"));
import OfflineBanner from "./components/OfflineBanner";
import Toast from "./components/Toast";
import InstallPrompt from "./components/InstallPrompt";
import LoadingSpinner from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import PageFooter from "./components/PageFooter";
import { useSession, useLogout } from "./hooks/useAuth";
import { useFullProfile } from "./hooks/useAdmin";
import { profileApi } from "./api/profile";
import { useFeatureFlags } from "./hooks/useFeatureFlags";
import { useSubscription } from "./hooks/useSubscription";
import { supabase } from "./lib/supabase";
import { parsePath, buildPath } from "./lib/router";
import { toast } from "./lib/toast";
import "./styles/app.css";

const AdminPage      = lazy(() => import("./components/admin/AdminPage"));
const ProfilePage    = lazy(() => import("./components/profile/ProfilePage"));
const BlogPage       = lazy(() => import("./components/blog/BlogPage"));
const BlogDashboard  = lazy(() => import("./components/blog/BlogDashboard"));
const ForumPage      = lazy(() => import("./components/forum/ForumPage"));
const QuizPage       = lazy(() => import("./components/quiz/QuizPage"));
const QuizLevel      = lazy(() => import("./components/quiz/QuizPage").then(m => ({ default: m.QuizLevel })));
const SettingsPage   = lazy(() => import("./components/profile/SettingsPage"));
const SearchPage     = lazy(() => import("./components/search/SearchPage"));
const BookmarksPage  = lazy(() => import("./components/bookmarks/BookmarksPage"));
const ReadingHistory = lazy(() => import("./components/reading/ReadingHistory"));
const ActivityFeed   = lazy(() => import("./components/social/ActivityFeed"));
const LeaderboardPage = lazy(() => import("./components/LeaderboardPage"));
const AboutPage      = lazy(() => import("./components/AboutPage"));
const TermsPage      = lazy(() => import("./components/TermsPage"));
const PrivacyPage    = lazy(() => import("./components/PrivacyPage"));
const ReadingPlansPage = lazy(() => import("./components/readingplans/ReadingPlansPage"));
const StudyNotesPage   = lazy(() => import("./components/studynotes/StudyNotesPage"));
const MessagesPage     = lazy(() => import("./components/messages/MessagesPage"));
const FloatingChat     = lazy(() => import("./components/messages/FloatingChat"));
const GroupsPage       = lazy(() => import("./components/groups/GroupsPage"));
const GroupDetail      = lazy(() => import("./components/groups/GroupDetail"));

// ── Auth shell ────────────────────────────────────────────────────────────────

export default function App() {
  const queryClient = useQueryClient();
  const { data: session, isLoading: authLoading } = useSession();
  const logout = useLogout();
  const user = session?.user ?? null;
  const { t, i18n } = useTranslation();

  const { maintenanceMode } = useFeatureFlags();
  const [showLanding, setShowLanding] = useState(true);
  const [preAuthPath, setPreAuthPath] = useState(() => window.location.pathname.slice(1));
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  // Keep React Query cache in sync with Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      queryClient.setQueryData(["session"], newSession);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Track popstate so legal pages work before login (browser back/forward)
  useEffect(() => {
    const handler = () => setPreAuthPath(window.location.pathname.slice(1));
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  if (authLoading) return <LoadingSpinner className="spinner-wrap--fullscreen" />;
  if (maintenanceMode) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:"1rem"}}><h1>🔧 Maintenance</h1><p>We'll be back shortly.</p></div>;

  const legalNav = (p) => { history.pushState(null, "", "/" + p); setPreAuthPath(p); };
  const legalProps = { navigate: legalNav, darkMode: false, setDarkMode: () => {}, i18n, user: null, onLogout: null };

  if (preAuthPath === "terms") return <main id="main-content"><Suspense fallback={null}><TermsPage {...legalProps} /></Suspense></main>;
  if (preAuthPath === "privacy") return <main id="main-content"><Suspense fallback={null}><PrivacyPage {...legalProps} /></Suspense></main>;

  // Allow unauthenticated read-only access to blog posts
  const publicNav = parsePath();
  if (!user && publicNav.page === "blog" && publicNav.slug) {
    document.documentElement.dataset.theme = "light";
    const publicNavigate = (page, params = {}) => {
      const path = buildPath(page, params);
      history.pushState(null, "", path);
      setPreAuthPath(path.slice(1));
    };
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <BlogPage
            user={null} profile={null}
            slug={publicNav.slug}
            onSelectPost={(slug) => publicNavigate("blog", { slug })}
            onBack={() => { history.pushState(null, "", "/"); setShowLanding(true); setPreAuthPath(""); }}
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

  if (passwordRecovery) {
    return <main id="main-content"><Suspense fallback={null}><ResetPasswordPage onDone={() => setPasswordRecovery(false)} /></Suspense></main>;
  }

  if (!user) {
    if (showLanding) return <main id="main-content"><Suspense fallback={null}><LandingPage onGetStarted={() => setShowLanding(false)} /></Suspense></main>;
    return <main id="main-content"><Suspense fallback={null}><AuthPage onBack={() => setShowLanding(true)} /></Suspense></main>;
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <OfflineBanner />
      <Toast />
      <InstallPrompt />
      <BibleApp
        user={user}
        onLogout={() => { logout.mutate(); setShowLanding(true); }}
        i18n={i18n}
        t={t}
      />
    </>
  );
}

// ── Lazy-page wrapper with error boundary ─────────────────────────────────────

const pageFallback = <LoadingSpinner />;

function Page({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={pageFallback}>
        <main id="main-content">
          {children}
        </main>
        <PageFooter />
      </Suspense>
    </ErrorBoundary>
  );
}

// ── Authenticated app with routing ────────────────────────────────────────────

function BibleApp({ user, onLogout, i18n }) {
  const queryClient = useQueryClient();
  const { data: profile } = useFullProfile(user.id);
  const { isPremium } = useSubscription(user.id);
  const [nav, setNav] = useState(parsePath);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("nwt-theme") === "dark");

  // Handle Stripe redirect callbacks
  const pollingRef = useRef(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("subscribed")) {
      history.replaceState(null, "", window.location.pathname);
      // Poll until the webhook updates subscription_status (up to 12s)
      let attempts = 0;
      pollingRef.current = setInterval(async () => {
        try {
          const data = await queryClient.fetchQuery({
            queryKey: ["fullProfile", user.id],
            queryFn: () => profileApi.get(user.id),
            staleTime: 0,
          });
          if (data?.subscription_status === "active" || data?.subscription_status === "trialing") {
            clearInterval(pollingRef.current);
            toast("🎉 Welcome to Premium! Your features are now unlocked.");
          } else if (++attempts >= 6) {
            clearInterval(pollingRef.current);
            toast("🎉 Subscription received! Refresh if features aren't unlocked yet.");
          }
        } catch {
          clearInterval(pollingRef.current);
        }
      }, 2000);
      return () => clearInterval(pollingRef.current);
    } else if (params.has("checkout_canceled")) {
      history.replaceState(null, "", window.location.pathname);
    }
  }, [queryClient, user.id]);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("nwt-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const handler = () => setNav(parsePath());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const navigate = (page, params = {}) => {
    const path = buildPath(page, params);
    history.pushState(null, "", path);
    setNav({ page, ...params });
  };

  const sharedNav = { navigate, darkMode, setDarkMode, i18n, user, onLogout, currentPage: nav.page };

  let pageContent = null;
  if (nav.page === "home") pageContent = <Page><HomePage user={user} navigate={navigate} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} /></Page>;
  else if (nav.page === "main") pageContent = <Page><ChecklistPage user={user} profile={profile} {...sharedNav} /></Page>;
  else if (nav.page === "admin")    pageContent = <Page><AdminPage currentUser={user} currentProfile={profile} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "profile")  pageContent = <Page><ProfilePage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "settings") pageContent = <Page><SettingsPage user={user} onBack={() => navigate("profile")} {...sharedNav} /></Page>;
  else if (nav.page === "publicProfile") pageContent = <Page><ProfilePage user={user} viewedUserId={nav.userId} isOwner={false} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "blog") pageContent = (
    <Page>
      <BlogPage
        user={user} profile={profile} slug={nav.slug ?? null}
        onSelectPost={(slug) => navigate("blog", { slug })}
        onBack={() => navigate("home")}
        onWriteClick={() => navigate("blogDash")}
        {...sharedNav}
      />
    </Page>
  );
  else if (nav.page === "blogDash")  pageContent = <Page><BlogDashboard user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
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
  else if (nav.page === "search")    pageContent = <Page><SearchPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "bookmarks") pageContent = <Page><BookmarksPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "history")   pageContent = <Page><ReadingHistory user={user} onBack={() => navigate("main")} {...sharedNav} /></Page>;
  else if (nav.page === "feed")      pageContent = <Page><ActivityFeed user={user} {...sharedNav} /></Page>;
  else if (isPremium && nav.page === "readingPlans") pageContent = <Page><ReadingPlansPage user={user} navigate={navigate} {...sharedNav} /></Page>;
  else if (isPremium && nav.page === "studyNotes")   pageContent = <Page><StudyNotesPage user={user} navigate={navigate} {...sharedNav} /></Page>;
  else if (nav.page === "leaderboard") pageContent = <Page><LeaderboardPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "about")     pageContent = <Page><AboutPage {...sharedNav} /></Page>;
  else if (nav.page === "terms")     pageContent = <Page><TermsPage {...sharedNav} /></Page>;
  else if (nav.page === "privacy")   pageContent = <Page><PrivacyPage {...sharedNav} /></Page>;
  else if (isPremium && nav.page === "messages")     pageContent = <Page><MessagesPage {...sharedNav} initialConv={nav.conversationId ? { conversation_id: nav.conversationId, other_display_name: nav.otherDisplayName ?? null, other_avatar_url: nav.otherAvatarUrl ?? null } : null} /></Page>;
  else if (isPremium && nav.page === "groups")       pageContent = <Page><GroupsPage {...sharedNav} /></Page>;
  else if (isPremium && nav.page === "groupDetail")  pageContent = <Page><GroupDetail {...sharedNav} groupId={nav.groupId} /></Page>;

  if (!pageContent) { navigate("home"); return null; }

  return (
    <>
      <div key={nav.page} className="page-fade-in">
        {pageContent}
      </div>
      {isPremium && (
        <Suspense fallback={null}>
          <FloatingChat
            user={user}
            navigate={navigate}
            initialConvId={nav.conversationId ?? null}
            initialConvName={nav.otherDisplayName ?? null}
            initialConvAvatar={nav.otherAvatarUrl ?? null}
          />
        </Suspense>
      )}
    </>
  );
}
