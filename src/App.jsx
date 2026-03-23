import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BOOKS, OT_COUNT } from "./data/books";
import BookCard from "./components/BookCard";
import AuthPage from "./components/auth/AuthPage";
import AdminPage from "./components/admin/AdminPage";
import ProfilePage from "./components/profile/ProfilePage";
import BlogPage from "./components/blog/BlogPage";
import BlogDashboard from "./components/blog/BlogDashboard";
import ForumPage from "./components/forum/ForumPage";
import LandingPage from "./components/LandingPage";
import ConfirmModal from "./components/ConfirmModal";
import { useSession, useLogout } from "./hooks/useAuth";
import { useProgress, useSaveProgress } from "./hooks/useProgress";
import { useFullProfile } from "./hooks/useAdmin";
import { supabase } from "./lib/supabase";
import "./styles/app.css";
// Main app component that handles auth state and routing between pages

export default function App() {
  const queryClient = useQueryClient();
  const { data: session, isLoading: authLoading } = useSession();
  const logout = useLogout();
  const user = session?.user ?? null;
  const { t } = useTranslation();

  const [showLanding, setShowLanding] = useState(true);

  // Keep React Query cache in sync with Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      queryClient.setQueryData(["session"], newSession);
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0514" }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Nunito, sans-serif", fontSize: 14 }}>{t("app.loading")}</div>
      </div>
    );
  }

  if (!user) {
    if (showLanding) return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    return <AuthPage onBack={() => setShowLanding(true)} />;
  }

  return (
    <BibleApp
      user={user}
      onLogout={() => {
        logout.mutate();
        setShowLanding(true);
      }}
    />
  );
}

function BibleApp({ user, onLogout }) {
  const { data: profile } = useFullProfile(user.id);
  const { data: remoteProgress, isLoading: progressLoading } = useProgress(user.id);
  const saveProgress = useSaveProgress(user.id);
  const { t, i18n } = useTranslation();

  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBlog, setShowBlog] = useState(false);
  const [showBlogDash, setShowBlogDash] = useState(false);
  const [showForum, setShowForum] = useState(false);
  const [chaptersState, setChaptersState] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [tab, setTab] = useState("all"); // all | ot | nt
  const [search, setSearch] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
      const next = { ...prev, [bi]: { ...(prev[bi] || {}), [ch]: !prev[bi]?.[ch] } };
      return next;
    });
  };

  const handleToggleBook = (bi, forceValue) => {
    const total = BOOKS[bi].chapters;
    const done = Object.values(chaptersState[bi] || {}).filter(Boolean).length;
    const allDone = done === total;
    const val = forceValue !== undefined ? forceValue : !allDone;
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

  const toggleLang = () => i18n.changeLanguage(i18n.language.startsWith("es") ? "en" : "es");

  if (progressLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ color: "var(--text-muted)", fontFamily: "Nunito, sans-serif", fontSize: 14 }}>{t("app.loadingProgress")}</div>
      </div>
    );
  }

  if (showAdmin) return <AdminPage currentUser={user} onBack={() => setShowAdmin(false)} />;
  if (showProfile) return <ProfilePage user={user} onBack={() => setShowProfile(false)} />;
  if (showBlog) return (
    <BlogPage
      user={user}
      profile={profile}
      onBack={() => setShowBlog(false)}
      onWriteClick={() => { setShowBlog(false); setShowBlogDash(true); }}
    />
  );
  if (showBlogDash) return <BlogDashboard user={user} onBack={() => setShowBlogDash(false)} />;
  if (showForum) return <ForumPage user={user} profile={profile} onBack={() => setShowForum(false)} />;

  return (
    <div className="app-wrap">
      {/* Header */}
      <header className="app-header">
        <div className="header-top">
          <div className="header-logo">📖</div>
          <div className="header-text">
            <h1>{t("app.title")}</h1>
            <p>{t("app.subtitle")}</p>
          </div>
          <div className="header-user">
            <button className="header-avatar-btn" onClick={() => setShowProfile(true)} title={t("app.title")}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="header-avatar-img" alt="avatar" />
                : <span className="header-avatar-initials">{(profile?.display_name || user.email)?.[0]?.toUpperCase()}</span>
              }
            </button>
            <button className="header-logout-btn" onClick={() => setShowForum(true)}>{t("app.forum")}</button>
            <button className="header-logout-btn" onClick={() => setShowBlog(true)}>{t("app.blog")}</button>
            {(profile?.can_blog || profile?.is_admin) && (
              <button className="header-logout-btn" onClick={() => setShowBlogDash(true)}>{t("app.write")}</button>
            )}
            {profile?.is_admin && (
              <button className="header-logout-btn" onClick={() => setShowAdmin(true)}>{t("app.admin")}</button>
            )}
            <button className="header-logout-btn" onClick={onLogout}>{t("app.logOut")}</button>
            <button className="header-logout-btn" onClick={toggleLang} title="Switch language">
              {i18n.language.startsWith("es") ? "EN" : "ES"}
            </button>
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
              />
            </div>
          );
        })}
      </div>

      <div className="footer-reset">
        <button className="reset-btn" onClick={handleReset}>{t("app.resetProgress")}</button>
      </div>

      {showResetConfirm && (
        <ConfirmModal
          message={t("app.resetConfirmMsg")}
          confirmLabel={t("app.resetConfirmBtn")}
          danger={false}
          onConfirm={() => { setChaptersState({}); setShowResetConfirm(false); }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}
