import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BOOKS, OT_COUNT } from "../data/books";
import { VERSE_COUNTS } from "../data/verseCounts";
import BookCard from "../components/BookCard";
import VerseModal from "../components/VerseModal";
import CustomSelect from "../components/CustomSelect";
import ConfirmModal from "../components/ConfirmModal";
import ReadingPlanWidget from "../components/reading/ReadingPlanWidget";
import ProgressShare from "../components/share/ProgressShare";
import BookCelebration from "../components/BookCelebration";
import UpgradePrompt, { isDismissed, dismissPrompt } from "../components/UpgradePrompt";
import { useProgress, useSaveProgress, useChapterTimestamps, useReadingStreak } from "../hooks/useProgress";
import { useSubscription } from "../hooks/useSubscription";
import { progressApi } from "../api/progress";
import { useNotes, useCreateNote, useDeleteNote } from "../hooks/useNotes";
import { readingApi } from "../api/reading";
import { toast } from "../lib/toast";

export default function ChecklistPage({ user, profile, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: remoteProgress, isLoading: progressLoading } = useProgress(user.id);
  const { data: notes = [] } = useNotes(user.id);
  const deleteNote = useDeleteNote(user.id);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const { data: chapterTimestamps = {} } = useChapterTimestamps(user.id);
  const { data: streak = { current_streak: 0, longest_streak: 0 } } = useReadingStreak(user.id);
  const saveProgress = useSaveProgress(user.id);
  const { isPremium } = useSubscription(user.id);

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
  // versesState: { [bookIndex]: { [chapter]: number[] } } — 1-based read verse numbers
  const [versesState, setVersesState] = useState<Record<number, Record<number, number[]>>>({});
  // Verse modal context
  const [verseModal, setVerseModal] = useState<{ bookIndex: number; chapter: number; pillEl: HTMLElement; pillRect: DOMRect } | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [celebrateBook, setCelebrateBook] = useState(null); // { name, icon, chapters }
  const [noteModal, setNoteModal] = useState(null); // { bookIndex } | null
  const [showBookPrompt, setShowBookPrompt] = useState(false);

  // Populate state once remote progress has loaded
  useEffect(() => {
    if (!progressLoading && !initialized) {
      const { _v: rawVerses, ...chapterData } = (remoteProgress ?? {}) as Record<string, unknown>;
      setChaptersState(chapterData);
      // Parse verse state (stored as { "[bi]": { "[ch]": number[] } })
      if (rawVerses && typeof rawVerses === "object") {
        const parsed: Record<number, Record<number, number[]>> = {};
        for (const [bi, chs] of Object.entries(rawVerses as Record<string, unknown>)) {
          if (chs && typeof chs === "object") {
            parsed[Number(bi)] = {};
            for (const [ch, vs] of Object.entries(chs as Record<string, unknown>)) {
              if (Array.isArray(vs)) parsed[Number(bi)][Number(ch)] = vs;
            }
          }
        }
        setVersesState(parsed);
      }
      setInitialized(true);
    }
  }, [progressLoading, remoteProgress, initialized]);

  // Debounced save to Supabase on every change
  useEffect(() => {
    if (!initialized) return;
    const timer = setTimeout(() => saveProgress.mutate(
      { ...chaptersState, _v: versesState },
      { onError: () => toast.error("Failed to save progress. Check your connection.") }
    ), 800);
    return () => clearTimeout(timer);
  }, [chaptersState, versesState, initialized]); // eslint-disable-line react-hooks/exhaustive-deps

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
          setTimeout(() => setCelebrateBook({ name: BOOKS[bi].name, icon: null, chapters: total }), 300);
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
        setTimeout(() => setCelebrateBook({ name: BOOKS[bi].name, icon: null, chapters: total }), 300);
      }
      return { ...prev, [bi]: chs };
    });
  };

  // ── Verse modal handlers ────────────────────────────────────────────────────
  const handleOpenChapterModal = (bi: number, ch: number, pillEl: HTMLElement, pillRect: DOMRect) => {
    // pillRect captured at pointerdown in BookCard — before Chrome focus-scrolls the button
    setVerseModal({ bookIndex: bi, chapter: ch, pillEl, pillRect });
  };

  const handleMarkChapterComplete = () => {
    if (!verseModal) return;
    const { bookIndex: bi, chapter: ch } = verseModal;
    const wasRead = !!chaptersState[bi]?.[ch];
    if (!wasRead) {
      // Mark complete + clear verse data
      scheduleLog(1);
      progressApi.markChapterRead(user.id, bi, ch);
      setChaptersState(prev => {
        const next = { ...prev, [bi]: { ...(prev[bi] || {}), [ch]: true } };
        const total = BOOKS[bi].chapters;
        const nowDone = Object.values(next[bi]).filter(Boolean).length;
        if (nowDone === total) setTimeout(() => setCelebrateBook({ name: BOOKS[bi].name, icon: null, chapters: total }), 300);
        return next;
      });
      setVersesState(prev => {
        const bookVs = { ...(prev[bi] || {}) };
        delete bookVs[ch];
        return { ...prev, [bi]: bookVs };
      });
      setVerseModal(null);
    } else {
      // Undo complete
      scheduleLog(-1);
      progressApi.unmarkChapterRead(user.id, bi, ch);
      setChaptersState(prev => ({ ...prev, [bi]: { ...(prev[bi] || {}), [ch]: false } }));
    }
  };

  const handleToggleVerse = (verse: number) => {
    if (!verseModal) return;
    const { bookIndex: bi, chapter: ch } = verseModal;
    // If chapter was done, switch to partial mode
    if (chaptersState[bi]?.[ch]) {
      scheduleLog(-1);
      progressApi.unmarkChapterRead(user.id, bi, ch);
      setChaptersState(prev => ({ ...prev, [bi]: { ...(prev[bi] || {}), [ch]: false } }));
      // Seed verse data with all except the toggled one
      const total = VERSE_COUNTS[bi]?.[ch - 1] ?? 0;
      const allVerses = Array.from({ length: total }, (_, i) => i + 1).filter(v => v !== verse);
      setVersesState(prev => ({ ...prev, [bi]: { ...(prev[bi] || {}), [ch]: allVerses } }));
      return;
    }
    setVersesState(prev => {
      const existing = prev[bi]?.[ch] ?? [];
      const updated = existing.includes(verse)
        ? existing.filter(v => v !== verse)
        : [...existing, verse].sort((a, b) => a - b);
      return { ...prev, [bi]: { ...(prev[bi] || {}), [ch]: updated } };
    });
  };

  const handleSelectAll = () => {
    if (!verseModal) return;
    const { bookIndex: bi, chapter: ch } = verseModal;
    const total = VERSE_COUNTS[bi]?.[ch - 1] ?? 0;
    setVersesState(prev => ({
      ...prev,
      [bi]: { ...(prev[bi] || {}), [ch]: Array.from({ length: total }, (_, i) => i + 1) },
    }));
  };

  const handleClearAll = () => {
    if (!verseModal) return;
    const { bookIndex: bi, chapter: ch } = verseModal;
    // Also unmark chapter if it was done
    if (chaptersState[bi]?.[ch]) {
      scheduleLog(-1);
      progressApi.unmarkChapterRead(user.id, bi, ch);
      setChaptersState(prev => ({ ...prev, [bi]: { ...(prev[bi] || {}), [ch]: false } }));
    }
    setVersesState(prev => {
      const bookVs = { ...(prev[bi] || {}) };
      delete bookVs[ch];
      return { ...prev, [bi]: bookVs };
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

  return (
    <>
      <div className="app-wrap" id="main-content">
        <header className="app-header">
          <div className="header-top">
            <div className="header-logo">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <div className="header-text">
              <h1>{t("app.title")}</h1>
              <p>{t("app.subtitle")}</p>
            </div>
            {streak.current_streak > 0 && (
              <div className="header-streak-badge" title={t("app.longestStreak", { n: streak.longest_streak })}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/>
                </svg>
                {streak.current_streak}
              </div>
            )}
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.4 }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              id="checklist-search"
              name="q"
              className="search-input"
              type="text"
              inputMode="search"
              placeholder={t("app.searchPlaceholder")}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="tracker-stats">
          <div className={`tracker-stat-card${doneBooks === 66 ? " tracker-stat-card--complete" : ""}`}>
            <span className="tracker-stat-label">{t("app.statBooks")}</span>
            <span className="tracker-stat-value">{doneBooks}<span className="tracker-stat-denom">/66</span></span>
            <div className="tracker-stat-bar"><div className="tracker-stat-bar-fill" style={{ width: `${(doneBooks / 66 * 100).toFixed(1)}%` }} /></div>
          </div>
          <div className={`tracker-stat-card${doneCh === totalCh && totalCh > 0 ? " tracker-stat-card--complete" : ""}`}>
            <span className="tracker-stat-label">{t("app.statChapters")}</span>
            <span className="tracker-stat-value">{doneCh}<span className="tracker-stat-denom">/{totalCh}</span></span>
            <div className="tracker-stat-bar"><div className="tracker-stat-bar-fill" style={{ width: totalCh > 0 ? `${(doneCh / totalCh * 100).toFixed(1)}%` : "0%" }} /></div>
          </div>
          {tab !== "nt" && (
            <div className={`tracker-stat-card${otDone === 39 ? " tracker-stat-card--complete" : ""}`}>
              <span className="tracker-stat-label">{t("app.statHebrew")}</span>
              <span className="tracker-stat-value">{otDone}<span className="tracker-stat-denom">/39</span></span>
              <div className="tracker-stat-bar"><div className="tracker-stat-bar-fill" style={{ width: `${(otDone / 39 * 100).toFixed(1)}%` }} /></div>
            </div>
          )}
          {tab !== "ot" && (
            <div className={`tracker-stat-card${ntDone === 27 ? " tracker-stat-card--complete" : ""}`}>
              <span className="tracker-stat-label">{t("app.statGreek")}</span>
              <span className="tracker-stat-value">{ntDone}<span className="tracker-stat-denom">/27</span></span>
              <div className="tracker-stat-bar"><div className="tracker-stat-bar-fill" style={{ width: `${(ntDone / 27 * 100).toFixed(1)}%` }} /></div>
            </div>
          )}
          {streak.current_streak > 0 && (
            <div className="tracker-stat-card">
              <span className="tracker-stat-label">{t("app.streak", "Streak")}</span>
              <span className="tracker-stat-value">{streak.current_streak}<span className="tracker-stat-denom"> {t("app.days", "d")}</span></span>
              <div className="tracker-stat-bar"><div className="tracker-stat-bar-fill" style={{ width: streak.longest_streak > 0 ? `${Math.min(streak.current_streak / streak.longest_streak * 100, 100).toFixed(1)}%` : "100%" }} /></div>
            </div>
          )}
        </div>

        <div style={{ padding: "0 16px 4px" }}>
          <ReadingPlanWidget userId={user.id} dailyGoal={profile?.daily_chapter_goal ?? 3} chaptersRead={doneCh} totalChapters={totalCh} />
        </div>
        <div style={{ padding: "4px 16px 12px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="quick-action-btn" onClick={() => setShowShare(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            {t("share.shareBtn")}
          </button>
          <button className="quick-action-btn" onClick={() => navigate("history")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {t("history.viewBtn")}
          </button>
          <button className="quick-action-btn" onClick={() => navigate("leaderboard")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
            {t("leaderboard.title")}
          </button>
        </div>

        <div className="book-list">
          {!initialized ? (
            Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="book-card-skeleton">
                <div className="sk-num skeleton" />
                <div className="sk-body">
                  <div className="sk-title skeleton" style={{ width: `${45 + (i % 5) * 10}%` }} />
                  <div className="sk-sub skeleton" />
                </div>
                <div className="sk-meta">
                  <div className="sk-count skeleton" />
                  <div className="sk-bar skeleton" />
                </div>
                <div className="sk-circle skeleton" />
              </div>
            ))
          ) : filteredBooks.length === 0 ? (
            <div className="empty-msg">{t("app.noBooksFound")}</div>
          ) : null}
          {initialized && filteredBooks.map((book) => {
            const showOTDivider = tab === "all" && book.index === 0 && !search;
            const showNTDivider = tab === "all" && book.index === OT_COUNT && !search;
            return (
              <React.Fragment key={book.index}>
                {showOTDivider && <div className="testament-divider">{t("app.testamentOT")}</div>}
                {showNTDivider && <div className="testament-divider">{t("app.testamentNT")}</div>}
                <BookCard
                  book={book}
                  bookIndex={book.index}
                  chaptersState={chaptersState}
                  chapterTimestamps={chapterTimestamps[book.index] ?? {}}
                  versesState={versesState}
                  onToggleChapter={handleToggleChapter}
                  onToggleBook={handleToggleBook}
                  onOpenChapterModal={handleOpenChapterModal}
                  notes={notesByBook.get(book.index) ?? []}
                  onAddNote={(bookIndex) => setNoteModal({ bookIndex })}
                  onDeleteNote={(id) => setNoteToDelete(id)}
                  userId={user?.id}
                  onUpgrade={onUpgrade}
                />
              </React.Fragment>
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
            onClose={() => {
              setCelebrateBook(null);
              if (!isPremium && !isDismissed("book-complete")) setShowBookPrompt(true);
            }}
          />
        )}
        {showBookPrompt && (
          <UpgradePrompt
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            title="Keep the momentum going"
            message="Join a reading plan to work through the whole NWT with a daily schedule and streak tracking."
            ctaLabel="View Reading Plans"
            onCta={() => {
              dismissPrompt("book-complete");
              setShowBookPrompt(false);
              navigate("readingPlans");
            }}
            onDismiss={() => {
              dismissPrompt("book-complete");
              setShowBookPrompt(false);
            }}
          />
        )}

        {noteModal && (
          <QuickNoteModal
            userId={user.id}
            bookIndex={noteModal.bookIndex}
            onClose={() => setNoteModal(null)}
            isPremium={isPremium}
          />
        )}

        {noteToDelete && (
          <ConfirmModal
            message={t("profile.deleteNoteConfirm")}
            onConfirm={() => { deleteNote.mutate(noteToDelete); setNoteToDelete(null); }}
            onCancel={() => setNoteToDelete(null)}
          />
        )}

        {verseModal && (
          <VerseModal
            bookName={t(`bookNames.${verseModal.bookIndex}`, BOOKS[verseModal.bookIndex].name)}
            bookIndex={verseModal.bookIndex}
            chapter={verseModal.chapter}
            totalVerses={VERSE_COUNTS[verseModal.bookIndex]?.[verseModal.chapter - 1] ?? 0}
            readVerses={versesState[verseModal.bookIndex]?.[verseModal.chapter] ?? []}
            isChapterDone={!!chaptersState[verseModal.bookIndex]?.[verseModal.chapter]}
            pillEl={verseModal.pillEl}
            initialRect={verseModal.pillRect}
            onClose={() => setVerseModal(null)}
            onMarkComplete={handleMarkChapterComplete}
            onToggleVerse={handleToggleVerse}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
          />
        )}
      </div>
    </>
  );
}

// ── Quick Note Modal ───────────────────────────────────────────────────────────

function QuickNoteModal({ userId, bookIndex, onClose, isPremium }) {
  const { t } = useTranslation();
  const createNote = useCreateNote(userId);
  const book = BOOKS[bookIndex];
  const totalChapters = book?.chapters ?? 1;

  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState("");
  const [content, setContent] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    createNote.mutate(
      { book_index: bookIndex, chapter, verse: verse.trim() || null, content: content.trim() },
      { onSuccess: onClose }
    );
  }

  // Close on backdrop click or Escape
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const bookName = t(`bookNames.${bookIndex}`, book?.name ?? "");

  return (
    <div className="qn-backdrop" onClick={handleBackdrop}>
      <div className="qn-modal" role="dialog" aria-modal="true" aria-label={t("app.quickNoteTitle")}>
        <div className="qn-header">
          <h2 className="qn-title">{t("app.quickNoteTitle")}</h2>
          <button className="qn-close" onClick={onClose} aria-label={t("common.cancel")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="qn-form">
          <div className="qn-book-row">
            <div className="qn-field">
              <label className="qn-label" htmlFor="qn-book">{t("profile.bookLabel")}</label>
              <input id="qn-book" name="book" className="qn-input qn-input--readonly" value={bookName} readOnly />
            </div>
            <div className="qn-field qn-field--sm">
              <label className="qn-label" htmlFor="qn-chapter">{t("profile.chapterLabel")}</label>
              <CustomSelect
                value={chapter}
                onChange={(v) => setChapter(v as number)}
                options={Array.from({ length: totalChapters }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
                className="cs-wrap--sm"
              />
            </div>
            <div className="qn-field qn-field--sm">
              <label className="qn-label" htmlFor="qn-verse">
                {t("profile.verseLabel")} <span className="qn-optional">{t("profile.verseOptional")}</span>
              </label>
              <input
                id="qn-verse"
                name="verse"
                type="text"
                className="qn-input"
                value={verse}
                onChange={e => setVerse(e.target.value)}
                placeholder="—"
              />
            </div>
          </div>

          <div className="qn-field">
            <label className="qn-label" htmlFor="qn-content">{t("profile.notePlaceholder")}</label>
            <textarea
              id="qn-content"
              name="content"
              className="qn-textarea"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={t("profile.notePlaceholder")}
              rows={5}
              autoFocus
              maxLength={2000}
            />
          </div>

          <div className="qn-actions">
            <button type="button" className="qn-btn qn-btn--ghost" onClick={onClose}>{t("common.cancel")}</button>
            <button type="submit" className="qn-btn qn-btn--primary" disabled={!content.trim() || createNote.isPending}>
              {createNote.isPending ? t("common.saving") : t("profile.saveNote")}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
