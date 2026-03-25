import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BOOKS, OT_COUNT } from "./data/books";
import BookCard from "./components/BookCard";
import AuthPage from "./components/auth/AuthPage";
import HomePage from "./components/HomePage";
import LandingPage from "./components/LandingPage";
import PageNav from "./components/PageNav";
import ConfirmModal from "./components/ConfirmModal";
import OfflineBanner from "./components/OfflineBanner";
import Toast from "./components/Toast";
import InstallPrompt from "./components/InstallPrompt";
import { ErrorBoundary } from "./components/ErrorBoundary";
import ReadingPlanWidget from "./components/reading/ReadingPlanWidget";
import ProgressShare from "./components/share/ProgressShare";

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
import { useSession, useLogout } from "./hooks/useAuth";
import { useProgress, useSaveProgress } from "./hooks/useProgress";
import { useFullProfile } from "./hooks/useAdmin";
import { useNotes } from "./hooks/useNotes";

import { readingApi } from "./api/reading";
import { supabase } from "./lib/supabase";
import "./styles/app.css";
// Main app component that handles auth state and routing between pages

export default function App() {
  const queryClient = useQueryClient();
  const { data: session, isLoading: authLoading } = useSession();
  const logout = useLogout();
  const user = session?.user ?? null;
  const { t, i18n } = useTranslation();

  const [showLanding, setShowLanding] = useState(true);
  const [preAuthHash, setPreAuthHash] = useState(() => window.location.hash.slice(1).replace(/^\//, ""));

  // Keep React Query cache in sync with Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      queryClient.setQueryData(["session"], newSession);
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Track hash changes so legal pages work before login
  useEffect(() => {
    const handler = () => setPreAuthHash(window.location.hash.slice(1).replace(/^\//, ""));
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0514" }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Nunito, sans-serif", fontSize: 14 }}>{t("app.loading")}</div>
      </div>
    );
  }

  const legalNav = (p) => { window.location.hash = p; };
  const legalProps = { navigate: legalNav, darkMode: false, setDarkMode: () => {}, i18n, user: null, onLogout: null };

  // Legal pages are accessible without login
  if (preAuthHash === "terms") return <Suspense fallback={null}><TermsPage {...legalProps} /></Suspense>;
  if (preAuthHash === "privacy") return <Suspense fallback={null}><PrivacyPage {...legalProps} /></Suspense>;

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
        onLogout={() => {
          logout.mutate();
          setShowLanding(true);
        }}
      />
    </>
  );
}

function parseHash() {
  const h = window.location.hash.slice(1).replace(/^\//, "");
  if (!h) return { page: "home" };
  if (h === "checklist") return { page: "main" };
  if (h === "admin") return { page: "admin" };
  if (h === "profile") return { page: "profile" };
  if (h === "blog-dash") return { page: "blogDash" };
  if (h === "blog") return { page: "blog", slug: null };
  if (h.startsWith("blog/")) return { page: "blog", slug: decodeURIComponent(h.slice(5)) };
  if (h === "forum") return { page: "forum", categoryId: null, threadId: null };
  if (h.startsWith("forum/")) {
    const parts = h.slice(6).split("/");
    return { page: "forum", categoryId: parts[0] || null, threadId: parts[1] || null };
  }
  if (h === "quiz") return { page: "quiz" };
  if (h.startsWith("quiz/")) return { page: "quizLevel", level: parseInt(h.slice(5)) };
  if (h.startsWith("user/")) return { page: "publicProfile", userId: h.slice(5) };
  if (h === "search") return { page: "search" };
  if (h === "bookmarks") return { page: "bookmarks" };
  if (h === "history") return { page: "history" };
  if (h === "feed") return { page: "feed" };
  if (h === "about") return { page: "about" };
  if (h === "terms") return { page: "terms" };
  if (h === "privacy") return { page: "privacy" };
  return { page: "home" };
}

function buildHash(page, params = {}) {
  switch (page) {
    case "admin":    return "admin";
    case "profile":  return "profile";
    case "blogDash": return "blog-dash";
    case "blog":     return params.slug ? `blog/${encodeURIComponent(params.slug)}` : "blog";
    case "forum":    return params.categoryId
      ? (params.threadId ? `forum/${params.categoryId}/${params.threadId}` : `forum/${params.categoryId}`)
      : "forum";
    case "quiz":          return "quiz";
    case "quizLevel":     return "quiz/" + params.level;
    case "publicProfile": return "user/" + params.userId;
    case "search":   return "search";
    case "bookmarks": return "bookmarks";
    case "history":  return "history";
    case "feed":     return "feed";
    case "about":    return "about";
    case "terms":    return "terms";
    case "privacy":  return "privacy";
    case "main":     return "checklist";
    default:         return "";
  }
}

function BibleApp({ user, onLogout }) {
  const { data: profile } = useFullProfile(user.id);
  const { data: remoteProgress, isLoading: progressLoading } = useProgress(user.id);
  const { data: notes = [] } = useNotes(user.id);

  const saveProgress = useSaveProgress(user.id);
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  // Debounced reading log — batches chapter toggles into one API call per second
  const pendingDelta = useRef(0);
  const logTimer = useRef(null);
  const scheduleLog = (delta) => {
    pendingDelta.current += delta;
    clearTimeout(logTimer.current);
    logTimer.current = setTimeout(async () => {
      if (pendingDelta.current === 0) return;
      const d = pendingDelta.current;
      pendingDelta.current = 0;
      try {
        await readingApi.logChapter(d);
        queryClient.invalidateQueries({ queryKey: ["reading", "stats", user.id] });
      } catch { /* reading log is non-critical */ }
    }, 1000);
  };

  const [nav, setNav] = useState(parseHash);

  const navigate = (page, params = {}) => {
    const newNav = { page, ...params };
    const hash = buildHash(page, params);
    window.location.hash = hash;
    setNav(newNav);
    if (typeof gtag !== "undefined") {
      gtag("event", "page_view", { page_title: page, page_path: "/" + hash });
    }
  };

  useEffect(() => {
    const handler = () => setNav(parseHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  const [chaptersState, setChaptersState] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [tab, setTab] = useState("all"); // all | ot | nt
  const [search, setSearch] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("nwt-theme") === "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("nwt-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Populate state once remote progress has loaded
  useEffect(() => {
    if (!progressLoading && !initialized) {
      setChaptersState(remoteProgress ?? {});
      setInitialized(true);
    }
  }, [progressLoading, remoteProgress, initialized]);

  // Debounced save to Supabase on every change
  useEffect(() => {
    if (!initialized) return;
    const timer = setTimeout(() => saveProgress.mutate(chaptersState), 800);
    return () => clearTimeout(timer);
  }, [chaptersState, initialized]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleChapter = (bi, ch) => {
    setChaptersState(prev => {
      const wasRead = !!prev[bi]?.[ch];
      scheduleLog(wasRead ? -1 : 1);
      return { ...prev, [bi]: { ...(prev[bi] || {}), [ch]: !wasRead } };
    });
  };

  const handleToggleBook = (bi, forceValue) => {
    const total = BOOKS[bi].chapters;
    const done = Object.values(chaptersState[bi] || {}).filter(Boolean).length;
    const allDone = done === total;
    const val = forceValue !== undefined ? forceValue : !allDone;
    const delta = val ? total - done : -done;
    if (delta !== 0) scheduleLog(delta);
    setChaptersState(prev => {
      const chs = {};
      for (let c = 1; c <= total; c++) chs[c] = val;
      return { ...prev, [bi]: chs };
    });
  };

  const handleReset = () => setShowResetConfirm(true);

  const { totalCh, doneCh, doneBooks, otDone, ntDone } = useMemo(() => {
    let totalCh = 0, doneCh = 0, doneBooks = 0, otDone = 0, ntDone = 0;
    BOOKS.forEach((b, bi) => {
      totalCh += b.chapters;
      const d = Object.values(chaptersState[bi] || {}).filter(Boolean).length;
      doneCh += d;
      if (d === b.chapters) {
        doneBooks++;
        if (bi < OT_COUNT) otDone++; else ntDone++;
      }
    });
    return { totalCh, doneCh, doneBooks, otDone, ntDone };
  }, [chaptersState]);

  const pct = totalCh > 0 ? (doneCh / totalCh * 100).toFixed(1) : "0.0";

  // Index notes by book once so each BookCard gets O(1) lookup instead of O(n) filter
  const notesByBook = useMemo(() => {
    const map = new Map();
    for (const note of notes) {
      const arr = map.get(note.book_index) ?? [];
      arr.push(note);
      map.set(note.book_index, arr);
    }
    return map;
  }, [notes]);

  const filteredBooks = useMemo(() => {
    return BOOKS.map((b, i) => ({ ...b, index: i })).filter(b => {
      if (tab === "ot" && b.index >= OT_COUNT) return false;
      if (tab === "nt" && b.index < OT_COUNT) return false;
      const translatedName = t(`bookNames.${b.index}`);
      if (search && !translatedName.toLowerCase().includes(search.toLowerCase()) &&
          !b.name.toLowerCase().includes(search.toLowerCase()) &&
          !b.abbr.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tab, search, t]);


  if (nav.page === "home") return (
    <HomePage
      user={user}
      navigate={navigate}
      onLogout={onLogout}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      i18n={i18n}
    />
  );

  if (progressLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ color: "var(--text-muted)", fontFamily: "Nunito, sans-serif", fontSize: 14 }}>{t("app.loadingProgress")}</div>
      </div>
    );
  }

  const sharedNav = { navigate, darkMode, setDarkMode, i18n, user, onLogout, currentPage: nav.page };

  const pageFallback = (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ color: "var(--text-muted)", fontFamily: "Nunito, sans-serif", fontSize: 14 }}>{t("app.loading")}</div>
    </div>
  );

  const Page = ({ children }) => (
    <ErrorBoundary key={nav.page}>
      <Suspense fallback={pageFallback}>{children}</Suspense>
    </ErrorBoundary>
  );

  if (nav.page === "admin") return <Page><AdminPage currentUser={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  if (nav.page === "profile") return <Page><ProfilePage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  if (nav.page === "publicProfile") return (
    <Page>
      <ProfilePage
        user={user}
        viewedUserId={nav.userId}
        isOwner={false}
        onBack={() => navigate("home")}
        {...sharedNav}
      />
    </Page>
  );
  if (nav.page === "blog") return (
    <Page>
      <BlogPage
        user={user}
        profile={profile}
        slug={nav.slug ?? null}
        onSelectPost={(slug) => navigate("blog", { slug })}
        onBack={() => navigate("home")}
        onWriteClick={() => navigate("blogDash")}
        {...sharedNav}
      />
    </Page>
  );
  if (nav.page === "blogDash") return <Page><BlogDashboard user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  if (nav.page === "forum") return (
    <Page>
      <ForumPage
        user={user}
        profile={profile}
        categoryId={nav.categoryId ?? null}
        threadId={nav.threadId ?? null}
        onNavigate={(categoryId, threadId) => navigate("forum", { categoryId, threadId })}
        onBack={() => navigate("home")}
        {...sharedNav}
      />
    </Page>
  );
  if (nav.page === "quiz") return <Page><QuizPage user={user} {...sharedNav} /></Page>;
  if (nav.page === "quizLevel") return (
    <Page>
      <QuizLevel
        level={nav.level}
        user={user}
        onBack={() => navigate("quiz")}
        onComplete={() => navigate("quiz")}
        {...sharedNav}
      />
    </Page>
  );
  if (nav.page === "search") return <Page><SearchPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  if (nav.page === "bookmarks") return <Page><BookmarksPage user={user} onBack={() => navigate("home")} {...sharedNav} /></Page>;
  if (nav.page === "history") return <Page><ReadingHistory user={user} onBack={() => navigate("main")} {...sharedNav} /></Page>;
  if (nav.page === "feed") return <Page><ActivityFeed user={user} {...sharedNav} /></Page>;
  if (nav.page === "about") return <Page><AboutPage {...sharedNav} /></Page>;
  if (nav.page === "terms") return <Page><TermsPage {...sharedNav} /></Page>;
  if (nav.page === "privacy") return <Page><PrivacyPage {...sharedNav} /></Page>;

  return (
    <>
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} currentPage="main" />
    <div className="app-wrap">
      {/* Header */}
      <header className="app-header">
        <div className="header-top">
          <div className="header-logo">📖</div>
          <div className="header-text">
            <h1>{t("app.title")}</h1>
            <p>{t("app.subtitle")}</p>
          </div>
        </div>
        <div className="global-progress" style={{ padding: "0 0 12px" }}>
          <div className="progress-meta">
            <span>{t("app.overallProgress")}</span>
            <strong>{pct}%</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: pct + "%" }} />
          </div>
        </div>
        <div className="tabs">
          {[["all", t("app.tabAll")], ["ot", t("app.tabOT")], ["nt", t("app.tabNT")]].map(([v, label]) => (
            <button key={v} className={`tab-btn${tab === v ? " active" : ""}`} onClick={() => setTab(v)}>
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-wrap">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="#666" strokeWidth="1.5" />
            <path d="M10 10L13 13" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder={t("app.searchPlaceholder")}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="stats-pills">
        <span className="stat-pill">{t("app.statBooks")}: <b>{doneBooks}/66</b></span>
        <span className="stat-pill">{t("app.statChapters")}: <b>{doneCh}/{totalCh}</b></span>
        {tab !== "nt" && <span className="stat-pill">{t("app.statHebrew")}: <b>{otDone}/39</b></span>}
        {tab !== "ot" && <span className="stat-pill">{t("app.statGreek")}: <b>{ntDone}/27</b></span>}
      </div>

      {/* Reading habit stats */}
      <div style={{ padding: "0 16px 4px" }}>
        <ReadingPlanWidget
          userId={user.id}
          dailyGoal={profile?.daily_chapter_goal ?? 3}
        />
      </div>
      <div style={{ padding: "4px 16px 12px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          className="reset-btn"
          style={{ fontSize: 12, padding: "5px 14px" }}
          onClick={() => setShowShare(true)}
        >
          🖼 {t("share.shareBtn")}
        </button>
        <button
          className="reset-btn"
          style={{ fontSize: 12, padding: "5px 14px" }}
          onClick={() => navigate("history")}
        >
          📅 {t("history.viewBtn")}
        </button>
      </div>

      {/* Book list */}
      <div className="book-list">
        {filteredBooks.length === 0 && (
          <div className="empty-msg">{t("app.noBooksFound")}</div>
        )}
        {filteredBooks.map((book) => {
          const showOTDivider = tab === "all" && book.index === 0 && !search;
          const showNTDivider = tab === "all" && book.index === OT_COUNT && !search;
          const wide = showOTDivider || showNTDivider;
          return (
            <div key={book.index} className={`book-list-item${wide ? " book-list-item--wide" : ""}`}>
              {showOTDivider && <div className="testament-divider">{t("app.testamentOT")}</div>}
              {showNTDivider && <div className="testament-divider">{t("app.testamentNT")}</div>}
              <BookCard
                book={book}
                bookIndex={book.index}
                chaptersState={chaptersState}
                onToggleChapter={handleToggleChapter}
                onToggleBook={handleToggleBook}
                notes={notesByBook.get(book.index) ?? []}
              />
            </div>
          );
        })}
      </div>

      <div className="footer-reset">
        <button className="reset-btn" onClick={handleReset}>{t("app.resetProgress")}</button>
      </div>

      {showShare && (
        <ProgressShare
          stats={{ pct, doneCh, totalCh, doneBooks, otDone, ntDone, name: profile?.display_name }}
          onClose={() => setShowShare(false)}
        />
      )}

      {showResetConfirm && (
        <ConfirmModal
          message={t("app.resetConfirmMsg")}
          confirmLabel={t("app.resetConfirmBtn")}
          danger={false}
          onConfirm={() => { if (doneCh > 0) scheduleLog(-doneCh); setChaptersState({}); setShowResetConfirm(false); }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
    </>
  );
}
