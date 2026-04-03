// @ts-nocheck
import "./i18n";
import { useState, useEffect, useLayoutEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import LandingPage from "./views/LandingPage";
import "./styles/app.css";

const TermsPage   = lazy(() => import("./views/TermsPage"));
const PrivacyPage = lazy(() => import("./views/PrivacyPage"));
const BlogPage    = lazy(() => import("./views/blog/BlogPage"));
const AuthedApp   = lazy(() => import("./AuthedApp"));

function getInitialDarkMode() {
  try {
    const saved = localStorage.getItem("nwt-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch { return false; }
}

// Sync localStorage check — no Supabase loaded at all
function hasStoredSession() {
  try {
    // OAuth callback: PKCE flow puts ?code= in URL, implicit flow puts #access_token= in hash.
    // Either means Supabase is mid-handshake — load AuthedApp so it can finish the exchange.
    if (new URLSearchParams(window.location.search).has("code")) return true;
    if (window.location.hash.includes("access_token=")) return true;

    // Supabase auth-js stores the session under "supabase.auth.token".
    // Presence of refresh_token means the session can be restored even if the access token expired.
    const raw = localStorage.getItem("supabase.auth.token");
    if (raw && JSON.parse(raw)?.currentSession?.refresh_token) return true;

    // Fallback: scan for any sb-*-auth-token key (newer auth-js versions use project-ref-based keys)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("sb-") && key.endsWith("-auth-token")) {
        const val = localStorage.getItem(key);
        if (val && JSON.parse(val)?.refresh_token) return true;
      }
    }
    return false;
  } catch { return false; }
}

export default function App() {
  const { i18n } = useTranslation();
  // null = not yet checked (avoid SSR/hydration mismatch with localStorage)
  const [showApp, setShowApp] = useState<boolean | null>(null);
  const [preAuthPath, setPreAuthPath] = useState(() => window.location.pathname.slice(1));
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  // Check localStorage only after mount — avoids server/client hydration mismatch
  useEffect(() => {
    setShowApp(hasStoredSession());
  }, []);

  // Remove SSR fallback content once the SPA has mounted — crawlers see it,
  // users don't because this runs before the first paint of the SPA.
  useLayoutEffect(() => {
    document.getElementById("ssr-fallback")?.remove();
  }, []);

  // Track popstate so legal pages work before login (browser back/forward)
  useEffect(() => {
    const handler = () => setPreAuthPath(window.location.pathname.slice(1));
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // Still checking localStorage — show nothing until resolved
  if (showApp === null) return <LoadingSpinner className="spinner-wrap--fullscreen" />;

  // If authenticated shell is active, it handles all routing internally
  if (showApp) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner className="spinner-wrap--fullscreen" />}>
          <AuthedApp onShowLanding={() => setShowApp(false)} i18n={i18n} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Pre-auth: legal pages accessible without login
  const legalNav = (p) => { history.pushState(null, "", "/" + p); setPreAuthPath(p); };
  const legalProps = { navigate: legalNav, darkMode, setDarkMode, i18n, user: null, onLogout: null };
  if (preAuthPath === "terms")   return <main id="main-content"><Suspense fallback={null}><TermsPage {...legalProps} /></Suspense></main>;
  if (preAuthPath === "privacy") return <main id="main-content"><Suspense fallback={null}><PrivacyPage {...legalProps} /></Suspense></main>;

  // Pre-auth: blog is fully public — reading requires no account
  const isBlogPath = preAuthPath === "blog" || preAuthPath.startsWith("blog/");
  if (isBlogPath) {
    const blogSlug = preAuthPath.startsWith("blog/") ? preAuthPath.slice(5) || null : null;
    const goBlogList = () => { history.pushState(null, "", "/blog"); setPreAuthPath("blog"); };
    const goBlogPost = (slug) => {
      if (!slug) return goBlogList();
      history.pushState(null, "", `/blog/${slug}`);
      setPreAuthPath(`blog/${slug}`);
    };
    // Navigating to auth-required areas triggers signup
    const blogNav = (page, params) => {
      if (page === "blog") return params?.slug ? goBlogPost(params.slug) : goBlogList();
      setShowApp(true);
    };
    return (
      <main id="main-content">
        <Suspense fallback={<LoadingSpinner className="spinner-wrap--fullscreen" />}>
          <BlogPage
            user={null}
            profile={null}
            slug={blogSlug}
            onSelectPost={goBlogPost}
            onBack={goBlogList}
            onWriteClick={() => setShowApp(true)}
            navigate={blogNav}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            i18n={i18n}
            onLogout={null}
            onUpgrade={() => setShowApp(true)}
          />
        </Suspense>
      </main>
    );
  }

  // No session — show landing page with zero Supabase loaded
  return <LandingPage onGetStarted={() => setShowApp(true)} />;
}
