import { useState, useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "./components/LoadingSpinner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/app.css";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const TermsPage   = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const AuthedApp   = lazy(() => import("./AuthedApp"));

// Sync localStorage check — no Supabase loaded at all
function hasStoredSession() {
  try {
    const ref = import.meta.env.VITE_SUPABASE_URL?.match(/\/\/([^.]+)/)?.[1] ?? "";
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return false;
    // Presence of refresh_token means Supabase can restore the session even if access token expired
    return !!JSON.parse(raw)?.refresh_token;
  } catch { return false; }
}

export default function App() {
  const { i18n } = useTranslation();
  const [showApp, setShowApp] = useState(hasStoredSession);
  const [preAuthPath, setPreAuthPath] = useState(() => window.location.pathname.slice(1));

  // Track popstate so legal pages work before login (browser back/forward)
  useEffect(() => {
    const handler = () => setPreAuthPath(window.location.pathname.slice(1));
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

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
  const legalProps = { navigate: legalNav, darkMode: false, setDarkMode: () => {}, i18n, user: null, onLogout: null };
  if (preAuthPath === "terms")   return <main id="main-content"><Suspense fallback={null}><TermsPage {...legalProps} /></Suspense></main>;
  if (preAuthPath === "privacy") return <main id="main-content"><Suspense fallback={null}><PrivacyPage {...legalProps} /></Suspense></main>;

  // No session — show landing page with zero Supabase loaded
  return (
    <Suspense fallback={null}>
      <LandingPage onGetStarted={() => setShowApp(true)} />
    </Suspense>
  );
}
