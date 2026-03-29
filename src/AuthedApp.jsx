import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSession, useLogout } from "./hooks/useAuth";
import { useFullProfile } from "./hooks/useAdmin";
import { profileApi } from "./api/profile";
import { useFeatureFlags } from "./hooks/useFeatureFlags";
import { useSubscription } from "./hooks/useSubscription";
import { supabase } from "./lib/supabase";
import { parsePath, buildPath } from "./lib/router";
import { toast } from "./lib/toast";
import LoadingSpinner from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import UpgradeModal from "./components/UpgradeModal";
import WelcomePremiumModal from "./components/WelcomePremiumModal";

const AuthPage          = lazy(() => import("./pages/auth/AuthPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const HomePage          = lazy(() => import("./pages/HomePage"));
const ChecklistPage     = lazy(() => import("./pages/ChecklistPage"));
const OfflineBanner     = lazy(() => import("./components/OfflineBanner"));
const Toast             = lazy(() => import("./components/Toast"));
const InstallPrompt     = lazy(() => import("./components/InstallPrompt"));
const PageFooter        = lazy(() => import("./components/PageFooter"));
const AdminPage         = lazy(() => import("./pages/admin/AdminPage"));
const ProfilePage       = lazy(() => import("./pages/profile/ProfilePage"));
const BlogPage          = lazy(() => import("./pages/blog/BlogPage"));
const BlogDashboard     = lazy(() => import("./pages/blog/BlogDashboard"));
const ForumPage         = lazy(() => import("./pages/forum/ForumPage"));
const QuizPage          = lazy(() => import("./pages/quiz/QuizPage"));
const QuizLevel         = lazy(() => import("./pages/quiz/QuizPage").then(m => ({ default: m.QuizLevel })));
const SettingsPage      = lazy(() => import("./pages/profile/SettingsPage"));
const SearchPage        = lazy(() => import("./pages/search/SearchPage"));
const BookmarksPage     = lazy(() => import("./pages/bookmarks/BookmarksPage"));
const ReadingHistory    = lazy(() => import("./pages/reading/ReadingHistory"));
const ActivityFeed      = lazy(() => import("./pages/social/ActivityFeed"));
const LeaderboardPage   = lazy(() => import("./pages/LeaderboardPage"));
const AboutPage         = lazy(() => import("./pages/AboutPage"));
const TermsPage         = lazy(() => import("./pages/TermsPage"));
const PrivacyPage       = lazy(() => import("./pages/PrivacyPage"));
const ReadingPlansPage  = lazy(() => import("./pages/readingplans/ReadingPlansPage"));
const StudyNotesPage    = lazy(() => import("./pages/studynotes/StudyNotesPage"));
const MessagesPage      = lazy(() => import("./pages/messages/MessagesPage"));
const FloatingChat      = lazy(() => import("./components/messages/FloatingChat"));
const GroupsPage        = lazy(() => import("./pages/groups/GroupsPage"));
const GroupDetail       = lazy(() => import("./pages/groups/GroupDetail"));
const NotFoundPage      = lazy(() => import("./pages/NotFoundPage"));
const AIToolsPage       = lazy(() => import("./pages/aitools/AIToolsPage"));

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
  const { data: profile, isLoading: profileLoading } = useFullProfile(user.id);
  const { isPremium, subscribe } = useSubscription(user.id);
  const [nav, setNav] = useState(parsePath);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("nwt-theme") === "dark");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  function openUpgrade() { setShowUpgradeModal(true); }

  // Handle Stripe redirect callbacks
  const pollingRef = useRef(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("subscribed")) {
      history.replaceState(null, "", window.location.pathname);
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
            setShowWelcomeModal(true);
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

  // Handle push notification tap — service worker posts { type: "push-navigate", url }
  // instead of using client.navigate() which is unreliable on Android Chrome.
  useEffect(() => {
    function handler(e) {
      if (e.data?.type === "push-navigate" && typeof e.data.url === "string") {
        const path = e.data.url;
        history.pushState(null, "", path);
        setNav(parsePath());
      }
    }
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, []);

  const navigate = (page, params = {}) => {
    const path = buildPath(page, params);
    history.pushState(null, "", path);
    setNav({ page, ...params });
  };

  const sharedNav = { navigate, darkMode, setDarkMode, i18n, user, onLogout, currentPage: nav.page, onUpgrade: openUpgrade };

  let pageContent = null;
  if (nav.page === "home") pageContent = <Page><HomePage user={user} navigate={navigate} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} isPremium={isPremium} onUpgrade={openUpgrade} /></Page>;
  else if (nav.page === "main") pageContent = <Page><ChecklistPage user={user} profile={profile} {...sharedNav} /></Page>;
  else if (nav.page === "admin") {
    if (!profile?.is_admin && !profile?.is_moderator) navigate("home");
    else pageContent = <Page><AdminPage currentUser={user} currentProfile={profile} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  }
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
  else if (nav.page === "blogDash") {
    if (profile && !profile.can_blog && !profile.is_admin) navigate("blog");
    else pageContent = <Page><BlogDashboard user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
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
  else if (nav.page === "search")    pageContent = <Page><SearchPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "bookmarks") pageContent = <Page><BookmarksPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "history")   pageContent = <Page><ReadingHistory user={user} onBack={() => navigate("main")} {...sharedNav} /></Page>;
  else if (nav.page === "feed")      pageContent = <Page><ActivityFeed user={user} {...sharedNav} /></Page>;
  else if (isPremium && nav.page === "readingPlans") pageContent = <Page><ReadingPlansPage user={user} navigate={navigate} {...sharedNav} /></Page>;
  else if (isPremium && nav.page === "studyNotes")   pageContent = <Page><StudyNotesPage user={user} navigate={navigate} {...sharedNav} /></Page>;
  else if (nav.page === "aiTools")     pageContent = <Page><AIToolsPage user={user} {...sharedNav} /></Page>;
  else if (nav.page === "leaderboard") pageContent = <Page><LeaderboardPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  else if (nav.page === "about")     pageContent = <Page><AboutPage {...sharedNav} /></Page>;
  else if (nav.page === "terms")     pageContent = <Page><TermsPage {...sharedNav} /></Page>;
  else if (nav.page === "privacy")   pageContent = <Page><PrivacyPage {...sharedNav} /></Page>;
  else if (isPremium && nav.page === "messages")     pageContent = <Page><MessagesPage {...sharedNav} initialConv={nav.conversationId ? { conversation_id: nav.conversationId, other_display_name: nav.otherDisplayName ?? null, other_avatar_url: nav.otherAvatarUrl ?? null } : null} /></Page>;
  else if (isPremium && nav.page === "groups")       pageContent = <Page><GroupsPage {...sharedNav} /></Page>;
  else if (isPremium && nav.page === "groupDetail")  pageContent = <Page><GroupDetail {...sharedNav} groupId={nav.groupId} /></Page>;
  // Premium-gated pages for non-premium users → send home (with upgrade prompt)
  else if (!isPremium && ["messages", "groups", "groupDetail", "readingPlans", "studyNotes"].includes(nav.page)) {
    if (!profileLoading) { navigate("home"); openUpgrade(); }
  }
  // Truly unknown URL → 404
  else if (nav.page === "notFound") {
    pageContent = (
      <Page>
        <NotFoundPage navigate={navigate} />
      </Page>
    );
  }

  if (!pageContent) {
    if (profileLoading) return null;
    return null;
  }

  return (
    <>
      <div key={nav.page} className="page-fade-in">
        {pageContent}
      </div>
      {isPremium && nav.page !== "messages" && (
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
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onSubscribe={() => subscribe.mutate()}
          loading={subscribe.isPending}
        />
      )}
      {showWelcomeModal && (
        <WelcomePremiumModal
          onClose={() => setShowWelcomeModal(false)}
          navigate={navigate}
        />
      )}
    </>
  );
}

// ── Auth shell ────────────────────────────────────────────────────────────────

export default function AuthedApp({ onShowLanding, i18n }) {
  const queryClient = useQueryClient();
  const { data: session, isLoading: authLoading } = useSession();
  const logout = useLogout();
  const user = session?.user ?? null;
  const { t } = useTranslation();
  const { maintenanceMode } = useFeatureFlags();
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState(null);

  // Apply saved theme immediately so auth/sign-up pages respect dark mode
  useEffect(() => {
    const saved = localStorage.getItem("nwt-theme");
    if (saved === "dark" || saved === "light") {
      document.documentElement.dataset.theme = saved;
    } else {
      // Fall back to OS preference for new users
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
    }
  }, []);

  // Keep React Query cache in sync with Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      queryClient.setQueryData(["session"], newSession);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      if (event === "USER_DELETED" || (event === "SIGNED_OUT" && !newSession)) {
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
      <Suspense fallback={null}><Toast /></Suspense>
      <Suspense fallback={null}><InstallPrompt /></Suspense>
      <BibleApp
        user={user}
        onLogout={() => { logout.mutate(); onShowLanding(); }}
        i18n={i18n}
        t={t}
      />
    </>
  );
}
