// @ts-nocheck
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  useMeetingWeek,
  useRecentMeetingWeeks,
  usePrepForWeek,
  usePrepHistory,
  usePrepStreak,
  useUpdatePrep,
  getMondayOfWeek,
  formatWeekLabel,
} from "../../hooks/useMeetingPrep";
import { useSubscription } from "../../hooks/useSubscription";
import "../../styles/meeting-prep.css";


// ── Song chip ─────────────────────────────────────────────────────────────────
function SongChip({ num, label }) {
  const { t } = useTranslation();
  if (!num) return null;
  return (
    <span className="mp-song">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
      </svg>
      {t("meetingPrep.song", { num })}{label ? ` — ${label}` : ""}
    </span>
  );
}

// ── Check item ────────────────────────────────────────────────────────────────
function CheckItem({ label, checked, onToggle }) {
  return (
    <button
      className={`mp-item${checked ? " mp-item--done" : ""}`}
      onClick={onToggle}
      aria-pressed={checked}
    >
      <span className="mp-checkbox">
        <svg className="mp-checkbox-check" viewBox="0 0 10 10" fill="none">
          <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <span className="mp-item-text">{label}</span>
    </button>
  );
}

// ── Notes editor with debounce + saved indicator ─────────────────────────────
function NotesEditor({ value, placeholder, onSave }) {
  const { t } = useTranslation();
  const [local, setLocal] = useState(value ?? "");
  const [status, setStatus] = useState(null); // null | "saving" | "saved"
  const timer = useRef(null);

  // Sync if external value changes (e.g. week switch)
  useEffect(() => { setLocal(value ?? ""); }, [value]);

  function handleChange(e) {
    setLocal(e.target.value);
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSave(e.target.value);
      setStatus("saved");
      setTimeout(() => setStatus(null), 2000);
    }, 800);
  }

  return (
    <div className="mp-notes-wrap">
      <div className="mp-notes-label">
        {t("meetingPrep.notesLabel")}
        {status === "saving" && <span className="mp-notes-status">{t("meetingPrep.notesSaving")}</span>}
        {status === "saved"  && <span className="mp-notes-status mp-notes-status--saved">{t("meetingPrep.notesSaved")}</span>}
      </div>
      <textarea
        className="mp-notes-textarea"
        placeholder={placeholder}
        value={local}
        onChange={handleChange}
      />
    </div>
  );
}

// ── CLAM tab ──────────────────────────────────────────────────────────────────
function ClamTab({ week, prep, onTogglePart, onNoteChange, isPremium, onUpgrade }) {
  const { t } = useTranslation();
  if (!week) {
    return (
      <div className="mp-scrape-notice">
        {t("meetingPrep.contentNotLoaded")}
      </div>
    );
  }

  const checkedMap = prep?.clam_checked ?? {};
  const parts = week.clam_parts ?? [];
  const total = parts.length;
  const done = parts.filter((p) => checkedMap[p.num]).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // Group parts by section
  const sections = ["treasures", "ministry", "living"];
  const sectionLabels = {
    treasures: t("meetingPrep.sectionTreasures"),
    ministry:  t("meetingPrep.sectionMinistry"),
    living:    t("meetingPrep.sectionLiving"),
  };
  const grouped = sections.reduce((acc, s) => {
    acc[s] = parts.filter((p) => p.section === s);
    return acc;
  }, {});

  return (
    <>
      {/* Bible reading + WOL link */}
      <div className="mp-meta">
        {week.clam_bible_reading && (
          <span className="mp-meta-bible">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            {week.clam_bible_reading}
          </span>
        )}
        {week.clam_wol_url && (
          <a href={week.clam_wol_url} target="_blank" rel="noopener noreferrer" className="mp-wol-link">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            {t("meetingPrep.openOnWol")}
          </a>
        )}
      </div>

      {/* Songs */}
      <div className="mp-songs">
        <SongChip num={week.clam_opening_song} label="Opening" />
        <SongChip num={week.clam_midpoint_song} />
        <SongChip num={week.clam_closing_song} label="Closing" />
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mp-progress-wrap">
          <div className="mp-progress-bar-bg">
            <div className="mp-progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="mp-progress-label">
            <span>{t("meetingPrep.parts", { done, total })}</span>
            <span>{pct}%</span>
          </div>
        </div>
      )}

      {/* Parts grouped by section */}
      {sections.map((section) => {
        const sectionParts = grouped[section];
        if (!sectionParts.length) return null;
        return (
          <div key={section} className="mp-section">
            <div className="mp-section-header">
              <span className={`mp-section-dot mp-section-dot--${section}`} aria-hidden="true" />
              <span className="mp-section-label">{sectionLabels[section]}</span>
            </div>
            <div className="mp-items">
              {sectionParts.map((part) => (
                <CheckItem
                  key={part.num}
                  label={`${part.num}. ${part.title}`}
                  checked={!!checkedMap[part.num]}
                  onToggle={() => onTogglePart(part.num)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Notes (premium) */}
      {isPremium ? (
        <NotesEditor
          value={prep?.clam_notes}
          placeholder="Add your notes for this week's CLAM meeting…"
          onSave={(v) => onNoteChange("clam_notes", v)}
        />
      ) : (
        <div className="mp-notes-wrap">
          <button className="mp-item mp-item--locked" onClick={onUpgrade} style={{ width: "100%", justifyContent: "center" }}>
            <span className="mp-item-text" style={{ textAlign: "center", color: "var(--text-muted)" }}>
              {t("meetingPrep.notesLockedMsg")}
            </span>
          </button>
        </div>
      )}
    </>
  );
}

// ── Watchtower tab ────────────────────────────────────────────────────────────
function WatchtowerTab({ week, prep, onTogglePara, onNoteChange, isPremium, onUpgrade }) {
  const { t } = useTranslation();
  if (!week) {
    return (
      <div className="mp-scrape-notice">
        {t("meetingPrep.contentNotLoadedShort")}
      </div>
    );
  }

  const checkedMap = prep?.wt_checked ?? {};
  const total = week.wt_paragraph_count ?? 20;
  const done = Object.keys(checkedMap).filter((k) => checkedMap[k]).length;
  const pct = Math.round((done / total) * 100);

  return (
    <>
      {/* Article card */}
      <div className="mp-wt-card">
        <p className="mp-wt-title">{week.wt_article_title || t("meetingPrep.watchtowerStudyArticle")}</p>
        {week.wt_theme_scripture && (
          <p className="mp-wt-theme">"{week.wt_theme_scripture}"</p>
        )}
      </div>

      <div className="mp-meta">
        {week.wt_wol_url && (
          <a href={week.wt_wol_url} target="_blank" rel="noopener noreferrer" className="mp-wol-link">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            {t("meetingPrep.readOnWol")}
          </a>
        )}
      </div>

      {/* Progress */}
      <div className="mp-progress-wrap">
        <div className="mp-progress-bar-bg">
          <div className="mp-progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="mp-progress-label">
          <span>{done === 0 ? t("meetingPrep.paragraphsToReview", { total }) : t("meetingPrep.paragraphsReviewed", { done, total })}</span>
          <span>{pct}%</span>
        </div>
      </div>

      {/* Paragraph grid */}
      <div className="mp-section">
        <div className="mp-section-header">
          <span className="mp-section-dot mp-section-dot--wt" aria-hidden="true" />
          <span className="mp-section-label">{t("meetingPrep.markParagraphs")}</span>
        </div>
      </div>
      <div className="mp-para-grid">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            className={`mp-para-btn${checkedMap[n] ? " mp-para-btn--done" : ""}`}
            onClick={() => onTogglePara(n)}
            aria-label={`Paragraph ${n}${checkedMap[n] ? " — done" : ""}`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Notes (premium) */}
      {isPremium ? (
        <NotesEditor
          value={prep?.wt_notes}
          placeholder="Add your notes for this week's Watchtower study…"
          onSave={(v) => onNoteChange("wt_notes", v)}
        />
      ) : (
        <div className="mp-notes-wrap">
          <button className="mp-item" onClick={onUpgrade} style={{ width: "100%", justifyContent: "center" }}>
            <span className="mp-item-text" style={{ textAlign: "center", color: "var(--text-muted)" }}>
              {t("meetingPrep.notesLockedMsg")}
            </span>
          </button>
        </div>
      )}
    </>
  );
}

// ── History tab ───────────────────────────────────────────────────────────────
function HistoryTab({ userId, isPremium, onUpgrade }) {
  const { t } = useTranslation();
  const { data: history = [], isLoading } = usePrepHistory(userId);

  if (!isPremium) {
    return (
      <div className="mp-empty">
        <div className="mp-empty-icon">📅</div>
        <p className="mp-empty-msg">{t("meetingPrep.historyTitle")}</p>
        <p className="mp-empty-sub">{t("meetingPrep.historyUpgradeMsg")}</p>
        <button className="mp-complete-btn" style={{ marginTop: "1rem", width: "auto", padding: ".6rem 1.5rem" }} onClick={onUpgrade}>
          {t("meetingPrep.historyUpgradeBtn")}
        </button>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner />;
  if (!history.length) {
    return (
      <div className="mp-empty">
        <div className="mp-empty-icon">📋</div>
        <p className="mp-empty-msg">{t("meetingPrep.historyEmptyTitle")}</p>
        <p className="mp-empty-sub">{t("meetingPrep.historyEmptyMsg")}</p>
      </div>
    );
  }

  return (
    <div className="mp-history">
      <div className="mp-history-title">{t("meetingPrep.pastWeeks")}</div>
      <div className="mp-history-grid">
        {history.map((h) => (
          <div key={h.week_start} className="mp-history-cell">
            <div className="mp-history-week">{formatWeekLabel(h.week_start)}</div>
            <div className="mp-history-badges">
              <span className={`mp-history-badge ${h.clam_completed ? "mp-history-badge--done" : "mp-history-badge--miss"}`}>
                {h.clam_completed ? "✓" : "–"} CLAM
              </span>
              <span className={`mp-history-badge ${h.wt_completed ? "mp-history-badge--done" : "mp-history-badge--miss"}`}>
                {h.wt_completed ? "✓" : "–"} WT
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function MeetingPrepSkeleton() {
  return (
    <div className="mp-container">
      <div className="skeleton" style={{ height: 38, width: '55%', marginBottom: 24 }} />
      {Array.from({ length: 4 }, (_, section) => (
        <div key={section} style={{ marginBottom: 20 }}>
          <div className="skeleton" style={{ height: 20, width: '30%', marginBottom: 10 }} />
          {Array.from({ length: 3 }, (_, row) => (
            <div key={row} className="skeleton" style={{ height: 16, width: `${75 - row * 10}%`, marginBottom: 8 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = ["midweek", "weekend", "history"];

export default function MeetingPrepPage({ user, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const currentWeek = getMondayOfWeek();
  // If Wed (3) or later, midweek meeting already happened — default to next week
  const defaultWeek = new Date().getDay() >= 3
    ? new Date(new Date(currentWeek + "T00:00:00").getTime() + 7 * 86400000).toISOString().slice(0, 10)
    : currentWeek;
  const [selectedWeek, setSelectedWeek] = useState(defaultWeek);
  const [activeTab, setActiveTab] = useState("midweek");

  const { isPremium } = useSubscription(user.id);
  const { data: streak = 0 } = usePrepStreak(user.id);
  const { data: recentWeeks = [] } = useRecentMeetingWeeks();
  const { data: week, isLoading: weekLoading } = useMeetingWeek(selectedWeek);
  const { data: prep } = usePrepForWeek(user.id, selectedWeek);
  const updatePrep = useUpdatePrep(user.id, selectedWeek);

  // Build week list: current + past available weeks (premium only for history)
  const availableWeeks = useMemo(() => {
    const seen = new Set();
    const result = [currentWeek];
    seen.add(currentWeek);
    if (isPremium) {
      recentWeeks.forEach((w) => {
        if (!seen.has(w.week_start)) { seen.add(w.week_start); result.push(w.week_start); }
      });
    }
    return result.sort((a, b) => b.localeCompare(a));
  }, [currentWeek, recentWeeks, isPremium]);

  // Toggle a CLAM part
  const handleTogglePart = useCallback((partNum) => {
    const current = prep?.clam_checked ?? {};
    const updated = { ...current, [partNum]: !current[partNum] };
    const parts = week?.clam_parts ?? [];
    const allDone = parts.every((p) => updated[p.num]);
    updatePrep.mutate({
      clam_checked: updated,
      clam_completed: allDone,
      ...(allDone ? { completed_at: new Date().toISOString() } : {}),
    });
  }, [prep, week, updatePrep]);

  // Toggle a WT paragraph
  const handleTogglePara = useCallback((paraNum) => {
    const current = prep?.wt_checked ?? {};
    const updated = { ...current, [paraNum]: !current[paraNum] };
    const total = week?.wt_paragraph_count ?? 20;
    const allDone = Object.keys(updated).filter((k) => updated[k]).length >= total;
    updatePrep.mutate({
      wt_checked: updated,
      wt_completed: allDone,
      ...(allDone ? { completed_at: new Date().toISOString() } : {}),
    });
  }, [prep, week, updatePrep]);

  // Debounced note save
  const handleNoteChange = useCallback((field, value) => {
    updatePrep.mutate({ [field]: value });
  }, [updatePrep]);

  // Mark all done shortcut
  const handleMarkComplete = (type) => {
    if (type === "clam") {
      const parts = week?.clam_parts ?? [];
      const checked = parts.reduce((a, p) => ({ ...a, [p.num]: true }), {});
      updatePrep.mutate({ clam_checked: checked, clam_completed: true, completed_at: new Date().toISOString() });
    } else {
      const total = week?.wt_paragraph_count ?? 20;
      const checked = Array.from({ length: total }, (_, i) => i + 1).reduce((a, n) => ({ ...a, [n]: true }), {});
      updatePrep.mutate({ wt_checked: checked, wt_completed: true, completed_at: new Date().toISOString() });
    }
  };

  const clamDone = prep?.clam_completed;
  const wtDone = prep?.wt_completed;

  const { t } = useTranslation();

  return (
    <div>
      <div className="mp-page">

        {/* Header */}
        <div className="mp-header">
          <div className="mp-header-left">
            <h1 className="mp-title">{t("meetingPrep.pageTitle")}</h1>
            <p className="mp-subtitle">
              {week?.clam_week_title || formatWeekLabel(selectedWeek)}
            </p>
            <span className="mp-premium-label">{t("meetingPrep.premiumLabel")}</span>
          </div>
          {streak > 0 && (
            <div className="mp-streak">
              🔥 {t("meetingPrep.streakLabel", { count: streak })}<span className="mp-streak-suffix"> · {streak >= 2 ? t("meetingPrep.streakSuffixKeep") : t("meetingPrep.streakSuffixNew")}</span>
            </div>
          )}
        </div>

        {/* Week selector */}
        {availableWeeks.length > 1 && (
          <div className="mp-week-nav">
            {availableWeeks.map((w) => (
              <button
                key={w}
                className={`mp-week-chip${w === selectedWeek ? " mp-week-chip--active" : ""}`}
                onClick={() => setSelectedWeek(w)}
              >
                {w === currentWeek ? t("meetingPrep.thisWeek") : w === defaultWeek && defaultWeek !== currentWeek ? t("meetingPrep.nextWeek") : formatWeekLabel(w)}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="mp-tabs">
          <button className={`mp-tab${activeTab === "midweek" ? " mp-tab--active" : ""}`} onClick={() => setActiveTab("midweek")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {t("meetingPrep.tabMidweek")} {clamDone ? "✓" : ""}
          </button>
          <button className={`mp-tab${activeTab === "weekend" ? " mp-tab--active" : ""}`} onClick={() => setActiveTab("weekend")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            {t("meetingPrep.tabWeekend")} {wtDone ? "✓" : ""}
          </button>
          <button className={`mp-tab${activeTab === "history" ? " mp-tab--active" : ""}`} onClick={() => setActiveTab("history")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {t("meetingPrep.tabHistory")}
          </button>
        </div>

        {/* Tab content */}
        {weekLoading && activeTab !== "history" ? (
          <MeetingPrepSkeleton />
        ) : activeTab === "midweek" ? (
          <>
            <ClamTab
              week={week}
              prep={prep}
              onTogglePart={handleTogglePart}
              onNoteChange={handleNoteChange}
              isPremium={isPremium}
              onUpgrade={onUpgrade}
            />
            {week && (
              <button
                className={`mp-complete-btn${clamDone ? " mp-complete-btn--done" : ""}`}
                onClick={() => clamDone ? null : handleMarkComplete("clam")}
              >
                {clamDone ? t("meetingPrep.clamComplete") : t("meetingPrep.markAllDone")}
              </button>
            )}
          </>
        ) : activeTab === "weekend" ? (
          <>
            <WatchtowerTab
              week={week}
              prep={prep}
              onTogglePara={handleTogglePara}
              onNoteChange={handleNoteChange}
              isPremium={isPremium}
              onUpgrade={onUpgrade}
            />
            {week && (
              <button
                className={`mp-complete-btn${wtDone ? " mp-complete-btn--done" : ""}`}
                onClick={() => wtDone ? null : handleMarkComplete("wt")}
              >
                {wtDone ? t("meetingPrep.wtComplete") : t("meetingPrep.markAllParas")}
              </button>
            )}
          </>
        ) : (
          <HistoryTab userId={user.id} isPremium={isPremium} onUpgrade={onUpgrade} />
        )}

      </div>
    </div>
  );
}
