import { useState, useEffect, lazy, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import AuthPage from "./components/auth/AuthPage";
import HomePage from "./components/HomePage";
import LandingPage from "./components/LandingPage";
import ChecklistPage from "./components/ChecklistPage";
import OfflineBanner from "./components/OfflineBanner";
import Toast from "./components/Toast";
import InstallPrompt from "./components/InstallPrompt";
import LoadingSpinner from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import PageFooter from "./components/PageFooter";
import { useSession, useLogout } from "./hooks/useAuth";
import { useFullProfile } from "./hooks/useAdmin";
import { useFeatureFlags } from "./hooks/useFeatureFlags";
import { supabase } from "./lib/supabase";
import { parsePath, buildPath } from "./lib/router";
import "./styles/app.css";

const AdminPage      = lazy(() => import("./components/admin/AdminPage"));
const ProfilePage    = lazy(() => import("./components/profile/ProfilePage"));
const BlogPage       = lazy(() => import("./components/blog/BlogPage"));
const BlogDashboard  = lazy(() => import("./components/blog/BlogDashboard"));
const ForumPage      = lazy(() => import("./components/forum/ForumPage"));
const QuizPage       = lazy(() => import("./components/quiz/QuizPage"));
const QuizLevel      = lazy(() => import("./components/quiz/QuizPage").then(m => ({ default: m.QuizLevel })));
const SearchPage     = lazy(() => import("./components/search/SearchPage"));
const BookmarksPage  = lazy(() => import("./components/bookmarks/BookmarksPage"));
const ReadingHistory = lazy(() => import("./components/reading/ReadingHistory"));
const ActivityFeed   = lazy(() => import("./components/social/ActivityFeed"));
const AboutPage      = lazy(() => import("./components/AboutPage"));
const TermsPage      = lazy(() => import("./components/TermsPage"));
const PrivacyPage    = lazy(() => import("./components/PrivacyPage"));

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

  // Keep React Query cache in sync with Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      queryClient.setQueryData(["session"], newSession);
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

  if (preAuthPath === "terms") return <Suspense fallback={null}><TermsPage {...legalProps} /></Suspense>;
  if (preAuthPath === "privacy") return <Suspense fallback={null}><PrivacyPage {...legalProps} /></Suspense>;

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

  if (!user) {
    if (showLanding) return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    return <AuthPage onBack={() => setShowLanding(true)} />;
  }

  return (
    <>
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
        {children}
        <PageFooter />
      </Suspense>
    </ErrorBoundary>
  );
}

// ── Authenticated app with routing ────────────────────────────────────────────

function BibleApp({ user, onLogout, i18n }) {
  const { data: profile } = useFullProfile(user.id);
  const [nav, setNav] = useState(parsePath);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("nwt-theme") === "dark");

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
    if (typeof gtag !== "undefined") {
      gtag("event", "page_view", { page_title: page, page_path: path });
    }
  };

  const sharedNav = { navigate, darkMode, setDarkMode, i18n, user, onLogout, currentPage: nav.page };

  if (nav.page === "home") return <HomePage user={user} navigate={navigate} onLogout={onLogout} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} />;
  if (nav.page === "main") return <ChecklistPage user={user} profile={profile} {...sharedNav} />;

  if (nav.page === "admin")   return <Page><AdminPage currentUser={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  if (nav.page === "profile") return <Page><ProfilePage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  if (nav.page === "publicProfile") return (
    <Page>
      <ProfilePage user={user} viewedUserId={nav.userId} isOwner={false} onBack={() => navigate("home")} {...sharedNav} />
    </Page>
  );
  if (nav.page === "blog") return (
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
  if (nav.page === "blogDash")  return <Page><BlogDashboard user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  if (nav.page === "forum") return (
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
  if (nav.page === "quiz")      return <Page><QuizPage user={user} {...sharedNav} /></Page>;
  if (nav.page === "quizLevel") return (
    <Page>
      <QuizLevel level={nav.level} user={user} onBack={() => navigate("quiz")} onComplete={() => navigate("quiz")} {...sharedNav} />
    </Page>
  );
  if (nav.page === "search")    return <Page><SearchPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  if (nav.page === "bookmarks") return <Page><BookmarksPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  if (nav.page === "history")   return <Page><ReadingHistory user={user} onBack={() => navigate("main")} {...sharedNav} /></Page>;
  if (nav.page === "feed")      return <Page><ActivityFeed user={user} {...sharedNav} /></Page>;
  if (nav.page === "about")     return <Page><AboutPage {...sharedNav} /></Page>;
  if (nav.page === "terms")     return <Page><TermsPage {...sharedNav} /></Page>;
  if (nav.page === "privacy")   return <Page><PrivacyPage {...sharedNav} /></Page>;

  // Unknown route → go home
  navigate("home");
  return null;
}
