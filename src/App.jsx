import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BOOKS, OT_COUNT } from "./data/books";
import BookCard from "./components/BookCard";
import AuthPage from "./components/auth/AuthPage";
import AdminPage from "./components/admin/AdminPage";
import ProfilePage from "./components/profile/ProfilePage";
import BlogPage from "./components/blog/BlogPage";
import BlogDashboard from "./components/blog/BlogDashboard";
import ForumPage from "./components/forum/ForumPage";
import LandingPage from "./components/LandingPage";
import { useSession, useLogout } from "./hooks/useAuth";
import { useProgress, useSaveProgress } from "./hooks/useProgress";
import { useFullProfile } from "./hooks/useAdmin";
import { supabase } from "./lib/supabase";
import "./styles/app.css";

export default function App() {
  const queryClient = useQueryClient();
  const { data: session, isLoading: authLoading } = useSession();
  const logout = useLogout();
  const user = session?.user ?? null;

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
        <div style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Nunito, sans-serif", fontSize: 14 }}>Loading…</div>
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

  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBlog, setShowBlog] = useState(false);
  const [showBlogDash, setShowBlogDash] = useState(false);
  const [showForum, setShowForum] = useState(false);
  const [chaptersState, setChaptersState] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [tab, setTab] = useState("all"); // all | ot | nt
  const [search, setSearch] = useState("");

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

  const handleReset = () => {
    if (window.confirm("Reset all reading progress?")) {
      setChaptersState({});
    }
  };

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
      if (search && !b.name.toLowerCase().includes(search.toLowerCase()) &&
          !b.abbr.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tab, search]);

  if (progressLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ color: "var(--text-muted)", fontFamily: "Nunito, sans-serif", fontSize: 14 }}>Loading progress…</div>
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
            <h1>Bible Reading Checklist</h1>
            <p>New World Translation · 66 Books</p>
          </div>
          <div className="header-user">
            <button className="header-avatar-btn" onClick={() => setShowProfile(true)} title="My Profile">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="header-avatar-img" alt="avatar" />
                : <span className="header-avatar-initials">{(profile?.display_name || user.email)?.[0]?.toUpperCase()}</span>
              }
            </button>
            <button className="header-logout-btn" onClick={() => setShowForum(true)}>Forum</button>
            <button className="header-logout-btn" onClick={() => setShowBlog(true)}>Blog</button>
            {(profile?.can_blog || profile?.is_admin) && (
              <button className="header-logout-btn" onClick={() => setShowBlogDash(true)}>Write</button>
            )}
            {profile?.is_admin && (
              <button className="header-logout-btn" onClick={() => setShowAdmin(true)}>Admin</button>
            )}
            <button className="header-logout-btn" onClick={onLogout}>Log out</button>
          </div>
        </div>
        <div className="global-progress" style={{ padding: "0 0 12px" }}>
          <div className="progress-meta">
            <span>Overall progress</span>
            <strong>{pct}%</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: pct + "%" }} />
          </div>
        </div>
        <div className="tabs">
          {[["all", "All 66 Books"], ["ot", "Hebrew Scriptures"], ["nt", "Christian Greek"]].map(([v, label]) => (
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
            placeholder="Search books…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="stats-pills">
        <span className="stat-pill">Books: <b>{doneBooks}/66</b></span>
        <span className="stat-pill">Chapters: <b>{doneCh}/{totalCh}</b></span>
        {tab !== "nt" && <span className="stat-pill">Hebrew: <b>{otDone}/39</b></span>}
        {tab !== "ot" && <span className="stat-pill">Greek: <b>{ntDone}/27</b></span>}
      </div>

      {/* Book list */}
      <div className="book-list">
        {filteredBooks.length === 0 && (
          <div className="empty-msg">No books match your search.</div>
        )}
        {filteredBooks.map((book) => {
          const showOTDivider = tab === "all" && book.index === 0 && !search;
          const showNTDivider = tab === "all" && book.index === OT_COUNT && !search;
          const wide = showOTDivider || showNTDivider;
          return (
            <div key={book.index} className={`book-list-item${wide ? " book-list-item--wide" : ""}`}>
              {showOTDivider && <div className="testament-divider">Hebrew Scriptures</div>}
              {showNTDivider && <div className="testament-divider">Christian Greek Scriptures</div>}
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
        <button className="reset-btn" onClick={handleReset}>↺ Reset all progress</button>
      </div>
    </div>
  );
}
