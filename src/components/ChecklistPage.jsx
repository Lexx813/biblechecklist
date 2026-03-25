import { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BOOKS, OT_COUNT } from "../data/books";
import BookCard from "./BookCard";
import PageNav from "./PageNav";
import PageFooter from "./PageFooter";
import ConfirmModal from "./ConfirmModal";
import ReadingPlanWidget from "./reading/ReadingPlanWidget";
import ProgressShare from "./share/ProgressShare";
import LoadingSpinner from "./LoadingSpinner";
import BookCelebration from "./BookCelebration";
import { useProgress, useSaveProgress, useChapterTimestamps, useReadingStreak } from "../hooks/useProgress";
import { progressApi } from "../api/progress";
import { useNotes } from "../hooks/useNotes";
import { readingApi } from "../api/reading";

export default function ChecklistPage({ user, profile, navigate, darkMode, setDarkMode, i18n, onLogout }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: remoteProgress, isLoading: progressLoading } = useProgress(user.id);
  const { data: notes = [] } = useNotes(user.id);
  const { data: chapterTimestamps = {} } = useChapterTimestamps(user.id);
  const { data: streak = { current_streak: 0, longest_streak: 0 } } = useReadingStreak(user.id);
  const saveProgress = useSaveProgress(user.id);

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

  const [chaptersState, setChaptersState] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [celebrateBook, setCelebrateBook] = useState(null); // { name, icon, chapters }

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
      // Record/remove chapter timestamp (fire-and-forget)
      if (!wasRead) progressApi.markChapterRead(user.id, bi, ch);
      else progressApi.unmarkChapterRead(user.id, bi, ch);
      const next = { ...prev, [bi]: { ...(prev[bi] || {}), [ch]: !wasRead } };
      if (!wasRead) {
        const total = BOOKS[bi].chapters;
        const nowDone = Object.values(next[bi]).filter(Boolean).length;
        if (nowDone === total) {
          setTimeout(() => setCelebrateBook({ name: BOOKS[bi].name, icon: "📖", chapters: total }), 300);
        }
      }
      return next;
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
      if (val && !allDone) {
        setTimeout(() => setCelebrateBook({ name: BOOKS[bi].name, icon: "📖", chapters: total }), 300);
      }
      return { ...prev, [bi]: chs };
    });
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

  // Index notes by book for O(1) lookup per BookCard
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

  if (progressLoading) return <LoadingSpinner />;

  return (
    <>
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} currentPage="main" />
      <div className="app-wrap" id="main-content">
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

        <div className="stats-pills">
          <span className="stat-pill">{t("app.statBooks")}: <b>{doneBooks}/66</b></span>
          <span className="stat-pill">{t("app.statChapters")}: <b>{doneCh}/{totalCh}</b></span>
          {tab !== "nt" && <span className="stat-pill">{t("app.statHebrew")}: <b>{otDone}/39</b></span>}
          {tab !== "ot" && <span className="stat-pill">{t("app.statGreek")}: <b>{ntDone}/27</b></span>}
        </div>

        <div style={{ padding: "0 16px 4px" }}>
          <ReadingPlanWidget userId={user.id} dailyGoal={profile?.daily_chapter_goal ?? 3} chaptersRead={doneCh} totalChapters={totalCh} />
        </div>
        <div style={{ padding: "4px 16px 12px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="reset-btn" style={{ fontSize: 12, padding: "5px 14px" }} onClick={() => setShowShare(true)}>
            🖼 {t("share.shareBtn")}
          </button>
          <button className="reset-btn" style={{ fontSize: 12, padding: "5px 14px" }} onClick={() => navigate("history")}>
            📅 {t("history.viewBtn")}
          </button>
        </div>

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
                  chapterTimestamps={chapterTimestamps[book.index] ?? {}}
                  onToggleChapter={handleToggleChapter}
                  onToggleBook={handleToggleBook}
                  notes={notesByBook.get(book.index) ?? []}
                />
              </div>
            );
          })}
        </div>

        <div className="footer-reset">
          <button className="reset-btn" onClick={() => setShowResetConfirm(true)}>{t("app.resetProgress")}</button>
        </div>

        {showShare && (
          <ProgressShare
            stats={{ pct, doneCh, totalCh, doneBooks, otDone, ntDone, name: profile?.display_name, streak: streak.current_streak, longestStreak: streak.longest_streak }}
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

        {celebrateBook && (
          <BookCelebration
            bookName={celebrateBook.name}
            bookIcon={celebrateBook.icon}
            chaptersCount={celebrateBook.chapters}
            totalDoneBooks={doneBooks}
            onClose={() => setCelebrateBook(null)}
          />
        )}
      </div>
      <PageFooter />
    </>
  );
}
