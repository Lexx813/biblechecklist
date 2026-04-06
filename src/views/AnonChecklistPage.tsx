// @ts-nocheck
import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BOOKS, OT_COUNT } from "../data/books";
import BookCard from "../components/BookCard";
import { loadAnonProgress, saveAnonProgress, countAnonChapters, type AnonProgress } from "../lib/anonProgress";

interface Props {
  onSignUp: () => void;
  onBack: () => void;
}

/**
 * Anonymous Bible reading tracker. Lets logged-out visitors check off chapters
 * with localStorage persistence. Once they've checked enough chapters, a sticky
 * banner prompts them to create a free account so progress isn't lost.
 *
 * On signup, useProgress() detects existing anon progress and migrates it.
 */
export default function AnonChecklistPage({ onSignUp, onBack }: Props) {
  const { t } = useTranslation();
  const [chaptersState, setChaptersState] = useState<AnonProgress>({});
  const [tab, setTab] = useState<"all" | "ot" | "nt">("all");
  const [search, setSearch] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setChaptersState(loadAnonProgress());
  }, []);

  // Persist on every change
  useEffect(() => {
    saveAnonProgress(chaptersState);
  }, [chaptersState]);

  const handleToggleChapter = (bi: number, ch: number) => {
    setChaptersState(prev => {
      const wasRead = !!prev[bi]?.[ch];
      return { ...prev, [bi]: { ...(prev[bi] || {}), [ch]: !wasRead } };
    });
  };

  const handleToggleBook = (bi: number, forceValue?: boolean) => {
    const total = BOOKS[bi].chapters;
    const done = Object.values(chaptersState[bi] || {}).filter(Boolean).length;
    const allDone = done === total;
    const val = forceValue !== undefined ? forceValue : !allDone;
    setChaptersState(prev => {
      const next = { ...prev, [bi]: {} as Record<number, boolean> };
      for (let c = 1; c <= total; c++) next[bi][c] = val;
      return next;
    });
  };

  const filteredBooks = useMemo(() => {
    return BOOKS.map((b, i) => ({ ...b, index: i })).filter(b => {
      if (tab === "ot" && b.index >= OT_COUNT) return false;
      if (tab === "nt" && b.index < OT_COUNT) return false;
      if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tab, search]);

  const { doneCh, totalCh, doneBooks, otDone, ntDone } = useMemo(() => {
    let dc = 0, tc = 0, db = 0, ot = 0, nt = 0;
    BOOKS.forEach((b, bi) => {
      const done = Object.values(chaptersState[bi] || {}).filter(Boolean).length;
      dc += done;
      tc += b.chapters;
      if (done === b.chapters) {
        db++;
        if (bi < OT_COUNT) ot++;
        else nt++;
      }
    });
    return { doneCh: dc, totalCh: tc, doneBooks: db, otDone: ot, ntDone: nt };
  }, [chaptersState]);

  const totalChecked = countAnonChapters(chaptersState);
  // Show sticky save banner once they've checked at least 3 chapters
  const showSaveBanner = totalChecked >= 3 && !bannerDismissed;

  return (
    <div className="anon-tracker" id="main-content">
      {/* Top bar */}
      <div className="anon-topbar">
        <button className="anon-back" onClick={onBack} aria-label="Back to home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="anon-topbar-title">
          <strong>Bible Tracker</strong>
          <span className="anon-topbar-sub">Try it free — no signup</span>
        </div>
        <button className="anon-topbar-cta" onClick={onSignUp}>Sign up free</button>
      </div>

      <div className="checklist-container">
        {/* Tabs + search */}
        <div className="checklist-controls">
          <div className="tab-group" role="tablist">
            <button role="tab" aria-selected={tab === "all"} className={`tab-btn${tab === "all" ? " tab-btn--active" : ""}`} onClick={() => setTab("all")}>{t("app.tabAll", "All")}</button>
            <button role="tab" aria-selected={tab === "ot"} className={`tab-btn${tab === "ot" ? " tab-btn--active" : ""}`} onClick={() => setTab("ot")}>{t("app.testamentOT", "Hebrew")}</button>
            <button role="tab" aria-selected={tab === "nt"} className={`tab-btn${tab === "nt" ? " tab-btn--active" : ""}`} onClick={() => setTab("nt")}>{t("app.testamentNT", "Greek")}</button>
          </div>
          <div className="search-wrap">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="search-input"
              type="text"
              inputMode="search"
              placeholder={t("app.searchPlaceholder", "Search books…")}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="tracker-stats">
          <div className={`tracker-stat-card${doneBooks === 66 ? " tracker-stat-card--complete" : ""}`}>
            <span className="tracker-stat-label">{t("app.statBooks", "Books")}</span>
            <span className="tracker-stat-value">{doneBooks}<span className="tracker-stat-denom">/66</span></span>
            <div className="tracker-stat-bar"><div className="tracker-stat-bar-fill" style={{ width: `${(doneBooks / 66 * 100).toFixed(1)}%` }} /></div>
          </div>
          <div className={`tracker-stat-card${doneCh === totalCh && totalCh > 0 ? " tracker-stat-card--complete" : ""}`}>
            <span className="tracker-stat-label">{t("app.statChapters", "Chapters")}</span>
            <span className="tracker-stat-value">{doneCh}<span className="tracker-stat-denom">/{totalCh}</span></span>
            <div className="tracker-stat-bar"><div className="tracker-stat-bar-fill" style={{ width: totalCh > 0 ? `${(doneCh / totalCh * 100).toFixed(1)}%` : "0%" }} /></div>
          </div>
          {tab !== "nt" && (
            <div className={`tracker-stat-card${otDone === 39 ? " tracker-stat-card--complete" : ""}`}>
              <span className="tracker-stat-label">{t("app.statHebrew", "Hebrew")}</span>
              <span className="tracker-stat-value">{otDone}<span className="tracker-stat-denom">/39</span></span>
              <div className="tracker-stat-bar"><div className="tracker-stat-bar-fill" style={{ width: `${(otDone / 39 * 100).toFixed(1)}%` }} /></div>
            </div>
          )}
          {tab !== "ot" && (
            <div className={`tracker-stat-card${ntDone === 27 ? " tracker-stat-card--complete" : ""}`}>
              <span className="tracker-stat-label">{t("app.statGreek", "Greek")}</span>
              <span className="tracker-stat-value">{ntDone}<span className="tracker-stat-denom">/27</span></span>
              <div className="tracker-stat-bar"><div className="tracker-stat-bar-fill" style={{ width: `${(ntDone / 27 * 100).toFixed(1)}%` }} /></div>
            </div>
          )}
        </div>

        {/* Book grid */}
        <div className="book-list">
          {filteredBooks.map((book) => {
            const showOTDivider = tab === "all" && book.index === 0 && !search;
            const showNTDivider = tab === "all" && book.index === OT_COUNT && !search;
            return (
              <React.Fragment key={book.index}>
                {showOTDivider && <div className="testament-divider">{t("app.testamentOT", "Hebrew Scriptures")}</div>}
                {showNTDivider && <div className="testament-divider">{t("app.testamentNT", "Greek Scriptures")}</div>}
                <BookCard
                  book={book}
                  bookIndex={book.index}
                  chaptersState={chaptersState}
                  chapterTimestamps={{}}
                  versesState={{}}
                  onToggleChapter={handleToggleChapter}
                  onToggleBook={handleToggleBook}
                  userId={undefined}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Sticky save-progress banner */}
      {showSaveBanner && (
        <div className="anon-save-banner" role="region" aria-label="Save your progress">
          <div className="anon-save-banner-inner">
            <div className="anon-save-banner-text">
              <strong>You've read {totalChecked} chapter{totalChecked === 1 ? "" : "s"} 🎉</strong>
              <span>Create a free account to save your progress across all your devices.</span>
            </div>
            <div className="anon-save-banner-actions">
              <button className="anon-save-banner-cta" onClick={onSignUp}>Save my progress</button>
              <button className="anon-save-banner-dismiss" onClick={() => setBannerDismissed(true)} aria-label="Dismiss">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
