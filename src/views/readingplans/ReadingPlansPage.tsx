// @ts-nocheck
import { useState, useMemo, useRef, useEffect, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import AppLayout from "../../components/AppLayout";
import ConfirmModal from "../../components/ConfirmModal";
const AICompanion = lazy(() => import("../../components/AICompanion"));
import { useAISkill } from "../../hooks/useAISkill";
import "../../styles/ai-tools.css";
import { useSubscription } from "../../hooks/useSubscription";
import { useUserGroupChallenges } from "../../hooks/useGroupChallenge";
import { BOOKS } from "../../data/books";
import {
  useMyPlans,
  usePlanCompletions,
  useEnrollPlan,
  useEnrollCustomPlan,
  useUnenrollPlan,
  useMarkDay,
  useUnmarkDay,
  usePausePlan,
  useResumePlan,
  useCatchUp,
} from "../../hooks/useReadingPlans";
import {
  PLAN_TEMPLATES,
  PLAN_CATEGORIES,
  getTemplateOrCustom,
  generateSchedule,
  DIFFICULTY_COLOR,
} from "../../data/readingPlanTemplates";
import { wolChapterUrl } from "../../utils/wol";
import "../../styles/reading-plans.css";
import "../../styles/group-challenge.css";
import { formatDate } from "../../utils/formatters";

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysSince(dateStr) {
  const start = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - start) / 86400000) + 1;
}

function effectiveDay(plan) {
  const raw = daysSince(plan.start_date);
  let pausedDays = plan.paused_days ?? 0;
  if (plan.is_paused && plan.paused_at) {
    const pausedDate = new Date(plan.paused_at);
    pausedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    pausedDays += Math.max(0, Math.floor((today - pausedDate) / 86400000));
  }
  return Math.max(1, raw - pausedDays);
}

function projectedFinish(plan, completedCount, totalDays) {
  if (completedCount === 0) return null;
  const elapsed = daysSince(plan.start_date) - (plan.paused_days ?? 0);
  if (elapsed <= 0) return null;
  const rate = completedCount / elapsed; // days completed per calendar day
  const remaining = totalDays - completedCount;
  if (rate <= 0) return null;
  const daysLeft = Math.ceil(remaining / rate);
  const finish = new Date();
  finish.setDate(finish.getDate() + daysLeft);
  return finish.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function planStreak(sortedCompletionDayNumbers) {
  // consecutive days completed up to today (by day_number order, not calendar)
  if (!sortedCompletionDayNumbers.length) return 0;
  const days = [...sortedCompletionDayNumbers].sort((a, b) => b - a);
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i - 1] - days[i] === 1) streak++;
    else break;
  }
  return streak;
}

// ── Custom Plan Builder Modal ─────────────────────────────────────────────────

const QUICK_DAY_OPTIONS = [14, 30, 60, 90, 180, 365];
const QUICK_BOOK_SETS = [
  { label: "Full Bible (66)", indices: Array.from({ length: 66 }, (_, i) => i) },
  { label: "Old Testament (39)", indices: Array.from({ length: 39 }, (_, i) => i) },
  { label: "New Testament (27)", indices: Array.from({ length: 27 }, (_, i) => i + 39) },
  { label: "Gospels (4)", indices: [39, 40, 41, 42] },
  { label: "Psalms & Proverbs", indices: [18, 19] },
  { label: "Paul's Letters (13)", indices: Array.from({ length: 13 }, (_, i) => i + 44) },
];

function CustomPlanModal({ onClose, onCreated }) {
  const { t } = useTranslation();
  const enrollCustom = useEnrollCustomPlan();
  const [name, setName] = useState("");
  const [selectedBooks, setSelectedBooks] = useState(new Set());
  const [days, setDays] = useState(90);
  const [customDays, setCustomDays] = useState("");
  const [useCustomDays, setUseCustomDays] = useState(false);
  const [otExpanded, setOtExpanded] = useState(false);
  const [ntExpanded, setNtExpanded] = useState(false);
  const [error, setError] = useState("");

  const totalDays = useCustomDays ? (parseInt(customDays) || 0) : days;
  const totalChapters = useMemo(
    () => [...selectedBooks].reduce((s, i) => s + BOOKS[i].chapters, 0),
    [selectedBooks]
  );
  const chaptersPerDay = totalDays > 0 && totalChapters > 0
    ? (totalChapters / totalDays).toFixed(1)
    : 0;

  function applyQuickSet(indices) {
    setSelectedBooks(new Set(indices));
  }

  function toggleBook(i) {
    setSelectedBooks(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError(t("readingPlans.customNameRequired")); return; }
    if (selectedBooks.size === 0) { setError(t("readingPlans.customBooksRequired")); return; }
    if (totalDays < 1 || totalDays > 3650) { setError(t("readingPlans.customDaysInvalid")); return; }
    setError("");
    const bookIndices = [...selectedBooks].sort((a, b) => a - b);
    enrollCustom.mutate(
      { name: name.trim(), bookIndices, totalDays, totalChapters, icon: "custom" },
      {
        onSuccess: (plan) => { onCreated(plan); onClose(); },
        onError: (err) => setError(err.message),
      }
    );
  }

  return createPortal(
    <div className="rp-modal-overlay" onClick={onClose}>
      <div className="rp-modal" onClick={e => e.stopPropagation()}>
        <div className="rp-modal-header">
          <h2 className="rp-modal-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:6}}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>{t("readingPlans.customPlanTitle")}</h2>
          <button className="rp-modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="rp-modal-body" onSubmit={handleSubmit}>
          {/* Plan name */}
          <label className="rp-field-label">{t("readingPlans.planName")}</label>
          <input
            className="rp-field-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t("readingPlans.planNamePlaceholder")}
            maxLength={60}
          />

          {/* Quick book sets */}
          <label className="rp-field-label">{t("readingPlans.quickSelect")}</label>
          <div className="rp-quick-sets">
            {QUICK_BOOK_SETS.map(qs => (
              <button
                key={qs.label}
                type="button"
                className="rp-quick-set-btn"
                onClick={() => applyQuickSet(qs.indices)}
              >
                {qs.label}
              </button>
            ))}
          </div>

          {/* Book picker */}
          <div className="rp-book-picker">
            <button type="button" className="rp-book-section-toggle" onClick={() => setOtExpanded(v => !v)}>
              {otExpanded ? "▾" : "▸"} {t("readingPlans.oldTestament")} ({Array.from({ length: 39 }, (_, i) => i).filter(i => selectedBooks.has(i)).length}/39)
            </button>
            {otExpanded && (
              <div className="rp-book-grid">
                {Array.from({ length: 39 }, (_, i) => i).map(i => (
                  <button
                    key={i}
                    type="button"
                    className={`rp-book-chip${selectedBooks.has(i) ? " rp-book-chip--on" : ""}`}
                    onClick={() => toggleBook(i)}
                  >
                    {BOOKS[i].abbr}
                  </button>
                ))}
              </div>
            )}
            <button type="button" className="rp-book-section-toggle" onClick={() => setNtExpanded(v => !v)}>
              {ntExpanded ? "▾" : "▸"} {t("readingPlans.newTestament")} ({Array.from({ length: 27 }, (_, i) => i + 39).filter(i => selectedBooks.has(i)).length}/27)
            </button>
            {ntExpanded && (
              <div className="rp-book-grid">
                {Array.from({ length: 27 }, (_, i) => i + 39).map(i => (
                  <button
                    key={i}
                    type="button"
                    className={`rp-book-chip${selectedBooks.has(i) ? " rp-book-chip--on" : ""}`}
                    onClick={() => toggleBook(i)}
                  >
                    {BOOKS[i].abbr}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Day count */}
          <label className="rp-field-label">{t("readingPlans.dayCount")}</label>
          <div className="rp-day-options">
            {QUICK_DAY_OPTIONS.map(d => (
              <button
                key={d}
                type="button"
                className={`rp-day-option-btn${!useCustomDays && days === d ? " rp-day-option-btn--active" : ""}`}
                onClick={() => { setDays(d); setUseCustomDays(false); }}
              >
                {d}d
              </button>
            ))}
            <button
              type="button"
              className={`rp-day-option-btn${useCustomDays ? " rp-day-option-btn--active" : ""}`}
              onClick={() => setUseCustomDays(true)}
            >
              {t("readingPlans.custom")}
            </button>
          </div>
          {useCustomDays && (
            <input
              className="rp-field-input rp-field-input--sm"
              type="number"
              inputMode="numeric"
              min={1}
              max={3650}
              value={customDays}
              onChange={e => setCustomDays(e.target.value)}
              placeholder={t("readingPlans.enterDays")}
            />
          )}

          {/* Preview */}
          {totalChapters > 0 && totalDays > 0 && (
            <div className="rp-custom-preview">
              <span>📖 {totalChapters} {t("readingPlans.chapters")}</span>
              <span>📅 {totalDays} {t("readingPlans.days")}</span>
              <span>~{chaptersPerDay} {t("readingPlans.chDay")}</span>
            </div>
          )}

          {error && <p className="rp-error">{error}</p>}

          <div className="rp-modal-actions">
            <button type="button" className="rp-ghost-btn" onClick={onClose}>{t("common.cancel")}</button>
            <button type="submit" className="rp-primary-btn" disabled={enrollCustom.isPending || !name.trim() || selectedBooks.size === 0 || totalDays < 1}>
              {enrollCustom.isPending ? t("readingPlans.starting") : t("readingPlans.createAndStart")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Plan template card (browse) ───────────────────────────────────────────────

function TemplateCard({ template, enrolled, onEnroll, enrolling, activeChallengeKeys = new Set() }) {
  const { t } = useTranslation();
  return (
    <div className={`rp-template-card${template.isPremiumHighlight ? " rp-template-card--premium" : ""}`}>
      {template.isPremiumHighlight && <span className="rp-premium-tag">✦ Premium</span>}
      {activeChallengeKeys.has(template.key) && (
        <span className="rp-challenge-badge">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Group challenge active
        </span>
      )}
      <div className="rp-template-icon">{template.icon}</div>
      <div className="rp-template-body">
        <div className="rp-template-header">
          <h3 className="rp-template-name">{template.name}</h3>
          <span className="rp-difficulty-badge" style={{ color: DIFFICULTY_COLOR[template.difficulty] }}>
            {template.difficulty}
          </span>
        </div>
        <p className="rp-template-desc">{template.description}</p>
        <div className="rp-template-meta">
          <span>📅 {template.totalDays} {t("readingPlans.days")}</span>
          <span>📖 {template.totalChapters} {t("readingPlans.chapters")}</span>
          <span>~{(template.totalChapters / template.totalDays).toFixed(1)} {t("readingPlans.chDay")}</span>
        </div>
      </div>
      <button
        className={`rp-enroll-btn${enrolled ? " rp-enroll-btn--enrolled" : ""}${enrolling ? " btn--loading" : ""}`}
        onClick={onEnroll}
        disabled={enrolled || enrolling}
      >
        {enrolled ? t("readingPlans.enrolled") : enrolling ? t("readingPlans.starting") : t("readingPlans.startPlan")}
      </button>
    </div>
  );
}

// ── Active plan card ──────────────────────────────────────────────────────────

function ActivePlanCard({ plan, onClick, activeChallengeKeys = new Set() }) {
  const { t } = useTranslation();
  const template = getTemplateOrCustom(plan);
  const { data: completions = [] } = usePlanCompletions(plan.id);
  if (!template) return null;

  const doneSet = new Set(completions.map(c => c.day_number));
  const completedCount = doneSet.size;
  const pct = Math.round((completedCount / template.totalDays) * 100);
  const currentDay = Math.min(effectiveDay(plan), template.totalDays);
  const todayDone = doneSet.has(currentDay);
  const behind = currentDay - completedCount;

  return (
    <div className="rp-active-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onClick(); }}>
      <div className="rp-active-card-top">
        <span className="rp-active-icon">{template.icon}</span>
        <div className="rp-active-info">
          <h3 className="rp-active-name">
            {template.name}
            {plan.is_paused && <span className="rp-paused-badge">{t("readingPlans.paused")}</span>}
            {activeChallengeKeys.has(plan.template_key) && (
              <span className="rp-challenge-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Group challenge active
              </span>
            )}
          </h3>
          <span className="rp-active-meta">
            {t("readingPlans.started")} {formatDate(plan.start_date)} · {t("readingPlans.day")} {currentDay} {t("readingPlans.of")} {template.totalDays}
          </span>
        </div>
        <span className="rp-active-pct">{pct}%</span>
      </div>
      <div className="rp-progress-bar">
        <div className="rp-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="rp-active-footer">
        <span className={`rp-today-badge${todayDone ? " rp-today-badge--done" : ""}`}>
          {plan.is_paused ? t("readingPlans.planPaused") : todayDone ? t("readingPlans.todayComplete") : t("readingPlans.todayPending")}
        </span>
        <div className="rp-active-footer-right">
          {behind > 3 && !plan.is_paused && (
            <span className="rp-behind-badge">{behind}d {t("readingPlans.behind")}</span>
          )}
          <span className="rp-active-done-count">{completedCount}/{template.totalDays} {t("readingPlans.days")}</span>
        </div>
      </div>
    </div>
  );
}

// ── Plan analytics panel ──────────────────────────────────────────────────────

function PlanAnalytics({ plan, template, completions }) {
  const { t } = useTranslation();
  const doneSet = new Set(completions.map(c => c.day_number));
  const completedCount = doneSet.size;
  const currentDay = Math.min(effectiveDay(plan), template.totalDays);
  const pct = Math.round((completedCount / template.totalDays) * 100);
  const behind = Math.max(0, currentDay - completedCount);
  const ahead = Math.max(0, completedCount - currentDay);
  const streak = planStreak(completions.map(c => c.day_number));
  const finish = projectedFinish(plan, completedCount, template.totalDays);

  // Weekly completion bar (last 7 day_numbers up to currentDay)
  const recentDays = Array.from({ length: 7 }, (_, i) => currentDay - 6 + i).filter(d => d >= 1 && d <= template.totalDays);

  return (
    <div className="rp-analytics">
      <h3 className="rp-analytics-title">{t("readingPlans.analytics")}</h3>
      <div className="rp-analytics-grid">
        <div className="rp-analytics-stat">
          <span className="rp-analytics-val">{pct}%</span>
          <span className="rp-analytics-label">{t("readingPlans.complete")}</span>
        </div>
        <div className="rp-analytics-stat">
          <span className="rp-analytics-val">{streak}</span>
          <span className="rp-analytics-label">{t("readingPlans.planStreak")}</span>
        </div>
        <div className="rp-analytics-stat">
          {behind > 0
            ? <span className="rp-analytics-val rp-analytics-val--warn">-{behind}</span>
            : <span className="rp-analytics-val rp-analytics-val--good">+{ahead}</span>
          }
          <span className="rp-analytics-label">{behind > 0 ? t("readingPlans.daysBehind") : t("readingPlans.daysAhead")}</span>
        </div>
        <div className="rp-analytics-stat">
          <span className="rp-analytics-val rp-analytics-val--sm">{finish ?? "—"}</span>
          <span className="rp-analytics-label">{t("readingPlans.projectedFinish")}</span>
        </div>
      </div>

      {/* Last 7 days mini-bar */}
      <div className="rp-week-bar">
        <span className="rp-week-bar-label">{t("readingPlans.last7Days")}</span>
        <div className="rp-week-bar-cells">
          {recentDays.map(d => (
            <div key={d} className={`rp-week-cell${doneSet.has(d) ? " rp-week-cell--done" : d === currentDay ? " rp-week-cell--today" : ""}`} title={`Day ${d}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Reading Summary widget ────────────────────────────────────────────────────

function ReadingSummaryWidget({ todayReadings }) {
  const { text, loading, error, run, reset } = useAISkill();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (ref.current && text) ref.current.scrollTop = ref.current.scrollHeight; }, [text]);

  if (!todayReadings?.length) return null;

  function handleSummarize() {
    if (loading) return;
    const books = [...new Set(todayReadings.map(r => r.bookName))].join(", ");
    const chapters = [...new Set(todayReadings.map(r => String(r.chapter)))].join(", ");
    run("reading_summary", { book: books, chapters });
  }

  return (
    <div className="ait-inline" style={{ marginTop: "1rem" }}>
      <div className="ait-inline-header" onClick={() => setOpen(o => !o)}>
        <span className="ait-inline-title">✨ Reading Summary & Reflection</span>
        <span className={`ait-inline-chevron${open ? " ait-inline-chevron--open" : ""}`}>▼</span>
      </div>
      {open && (
        <div className="ait-inline-body">
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted,#888)", margin: "0 0 0.75rem" }}>
            Get a warm debrief of today's reading — key events, characters, lessons, and spiritual application.
          </p>
          <button className="ait-submit-btn" type="button" onClick={handleSummarize} disabled={loading}>
            {loading ? "Summarizing…" : "✦ Summarize Today's Reading"}
          </button>
          {(loading || text || error) && (
            <div className="ait-result" style={{ marginTop: "0.75rem" }}>
              <div className="ait-result-header">
                <span className="ait-result-label">AI Summary</span>
                {!loading && (text || error) && <button className="ait-result-clear" type="button" onClick={reset}>Clear</button>}
              </div>
              <div className="ait-result-body" ref={ref}>
                {loading && !text && (
                  <div className="ait-loading">
                    <span className="ait-dot" /><span className="ait-dot" /><span className="ait-dot" />
                    <span className="ait-loading-label">Thinking…</span>
                  </div>
                )}
                {error && <div className="ait-error">{error}</div>}
                {text && <div className="ait-response-text">{text}{loading && <span className="ait-cursor" />}</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Plan detail view ──────────────────────────────────────────────────────────

function PlanDetail({ plan: initialPlan, allPlans, onBack, isPremium, navigate, userId }) {
  const { t } = useTranslation();
  // Always read the freshest plan object from allPlans
  const plan = allPlans.find(p => p.id === initialPlan.id) ?? initialPlan;
  const template = getTemplateOrCustom(plan);
  const { data: completions = [], isLoading } = usePlanCompletions(plan.id);
  const markDay = useMarkDay(plan.id, userId, template.totalDays);
  const unmarkDay = useUnmarkDay(plan.id);
  const unenroll = useUnenrollPlan();
  const pause = usePausePlan();
  const resume = useResumePlan();
  const catchUp = useCatchUp();
  const [showAll, setShowAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCatchUp, setConfirmCatchUp] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiFired = useRef(false);

  const schedule = useMemo(() => generateSchedule(template.bookIndices, template.totalDays), [template]);
  const doneSet = useMemo(() => new Set(completions.map(c => c.day_number)), [completions]);

  const confettiDots = [
    { tx: '30px',  ty: '-40px', color: '#f59e0b' },
    { tx: '-30px', ty: '-40px', color: '#7c3aed' },
    { tx: '45px',  ty: '-20px', color: '#10b981' },
    { tx: '-45px', ty: '-20px', color: '#ef4444' },
    { tx: '20px',  ty: '35px',  color: '#3b82f6' },
    { tx: '-20px', ty: '35px',  color: '#f59e0b' },
    { tx: '40px',  ty: '20px',  color: '#7c3aed' },
    { tx: '-40px', ty: '20px',  color: '#10b981' },
  ];

  const earlyPct = template ? Math.round((doneSet.size / template.totalDays) * 100) : 0;
  useEffect(() => {
    if (!confettiFired.current && earlyPct === 100) {
      confettiFired.current = true;
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 700);
      return () => clearTimeout(t);
    }
  }, [earlyPct]);

  if (!template) return null;

  const currentDay = Math.min(effectiveDay(plan), template.totalDays);
  const completedCount = doneSet.size;
  const pct = Math.round((completedCount / template.totalDays) * 100);
  const behind = currentDay - completedCount;

  const visibleDays = showAll ? schedule : schedule.slice(0, currentDay + 6);

  function toggleDay(dayNum) {
    if (doneSet.has(dayNum)) unmarkDay.mutate(dayNum);
    else markDay.mutate(dayNum);
  }

  function handleUnenroll() {
    unenroll.mutate(plan.id, { onSuccess: onBack });
  }

  function handleCatchUp() {
    catchUp.mutate({ planId: plan.id, completedCount }, { onSuccess: () => setConfirmCatchUp(false) });
  }

  const todayReadings = schedule[currentDay - 1]?.readings ?? [];
  const todayPassage = todayReadings.map(r => `${r.bookName} ${r.chapter}`).join(", ");
  const devotionalPrompt = `Today's reading is Day ${currentDay} of "${template.name}": ${todayPassage}. Please give me a short, warm devotional reflection (3-4 sentences) on these passages — include one key insight and a brief thought for the day.`;

  return (
    <div className="rp-detail">
      <div className="rp-detail-header">
        <button className="back-btn" onClick={onBack}>{t("common.back")}</button>
        <div className="rp-detail-title-row">
          <span className="rp-detail-icon">{template.icon}</span>
          <div>
            <h2 className="rp-detail-name">
              {template.name}
              {plan.is_paused && <span className="rp-paused-badge">{t("readingPlans.paused")}</span>}
            </h2>
            <p className="rp-detail-meta">
              {t("readingPlans.started")} {formatDate(plan.start_date)} · {template.totalDays} {t("readingPlans.days")} · {template.totalChapters} {t("readingPlans.chapters")}
            </p>
          </div>
        </div>
        <div className="rp-detail-header-actions">
          {plan.is_paused ? (
            <button className="rp-pause-btn rp-pause-btn--resume" onClick={() => resume.mutate(plan)} disabled={resume.isPending}>
              ▶ {t("readingPlans.resume")}
            </button>
          ) : (
            <button className="rp-pause-btn" onClick={() => pause.mutate(plan.id)} disabled={pause.isPending}>
              ⏸ {t("readingPlans.pause")}
            </button>
          )}
          <button className="rp-analytics-toggle-btn" onClick={() => setShowAnalytics(v => !v)}>
            {t("readingPlans.analytics")}
          </button>
        </div>
      </div>

      {/* Analytics panel */}
      {showAnalytics && (
        <PlanAnalytics plan={plan} template={template} completions={completions} />
      )}

      {/* Catch-up banner */}
      {behind > 5 && !plan.is_paused && (
        <div className="rp-catchup-banner">
          <span>⚡ {t("readingPlans.behindMessage", { days: behind })}</span>
          <button className="rp-catchup-btn" onClick={() => setConfirmCatchUp(true)}>
            {t("readingPlans.catchUpBtn")}
          </button>
        </div>
      )}

      {/* Progress overview */}
      <div className="rp-detail-progress">
        {showConfetti && confettiDots.map((dot, i) => (
          <span
            key={i}
            className="confetti-dot"
            style={{
              '--tx': dot.tx,
              '--ty': dot.ty,
              background: dot.color,
              animationDelay: `${i * 12}ms`,
            }}
          />
        ))}
        <div className="rp-progress-bar rp-progress-bar--lg">
          <div className="rp-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="rp-detail-stats">
          <div className="rp-stat">
            <span className="rp-stat-val">{pct}%</span>
            <span className="rp-stat-label">{t("readingPlans.complete")}</span>
          </div>
          <div className="rp-stat">
            <span className="rp-stat-val">{completedCount}</span>
            <span className="rp-stat-label">{t("readingPlans.daysDone")}</span>
          </div>
          <div className="rp-stat">
            <span className="rp-stat-val">{template.totalDays - completedCount}</span>
            <span className="rp-stat-label">{t("readingPlans.remaining")}</span>
          </div>
          <div className="rp-stat">
            <span className="rp-stat-val">{t("readingPlans.day")} {currentDay}</span>
            <span className="rp-stat-label">{t("readingPlans.today")}</span>
          </div>
        </div>
      </div>

      {/* Today's reading */}
      {!plan.is_paused && schedule[currentDay - 1] && (
        <div className={`rp-today-card${doneSet.has(currentDay) ? " rp-today-card--done" : ""}`}>
          <div className="rp-today-label">
            {doneSet.has(currentDay) ? "✓" : "📖"} {t("readingPlans.todaysReading")} {currentDay}
          </div>
          <div className="rp-today-readings">
            {schedule[currentDay - 1].readings.map((r, i) => (
              <a key={i} className="rp-reading-chip" href={wolChapterUrl(r.bookIndex, r.chapter)} target="_blank" rel="noopener noreferrer">
                {r.bookAbbr} {r.chapter}
              </a>
            ))}
          </div>
          <div className="rp-today-actions">
            <button
              className={`rp-mark-btn${doneSet.has(currentDay) ? " rp-mark-btn--done" : ""}${(markDay.isPending || unmarkDay.isPending) ? " btn--loading" : ""}`}
              onClick={() => toggleDay(currentDay)}
              disabled={isLoading || markDay.isPending || unmarkDay.isPending}
            >
              {doneSet.has(currentDay) ? t("readingPlans.markUnread") : t("readingPlans.markRead")}
            </button>
            {isPremium && navigate && (
              <button
                className="rp-note-shortcut-btn"
                onClick={() => navigate("studyNotes", {
                  prefill: { bookIndex: schedule[currentDay - 1].readings[0]?.bookIndex, chapter: schedule[currentDay - 1].readings[0]?.chapter }
                })}
              >
                {t("readingPlans.addNote")}
              </button>
            )}
          </div>
        </div>
      )}

      {plan.is_paused && (
        <div className="rp-paused-notice">
          <span>⏸</span>
          <p>{t("readingPlans.pausedNotice")}</p>
          <button className="rp-pause-btn rp-pause-btn--resume" onClick={() => resume.mutate(plan)} disabled={resume.isPending}>
            ▶ {t("readingPlans.resume")}
          </button>
        </div>
      )}

      {/* AI Devotional (premium) */}
      {isPremium && !plan.is_paused && schedule[currentDay - 1] && (
        <Suspense fallback={null}>
          <AICompanion
            reference={`${t("readingPlans.day")} ${currentDay} — ${template.name}`}
            passage={todayPassage}
            initialPrompt={devotionalPrompt}
            devotionalMode
            className="rp-ai-companion"
          />
        </Suspense>
      )}

      {/* AI Reading Summary (premium) */}
      {isPremium && !plan.is_paused && todayReadings.length > 0 && (
        <div style={{ padding: "0 1rem" }}>
          <ReadingSummaryWidget todayReadings={todayReadings} />
        </div>
      )}

      {/* Day list */}
      <div className="rp-day-list">
        <h3 className="rp-day-list-title">{t("readingPlans.readingSchedule")}</h3>
        {isLoading ? (
          <p className="rp-empty">{t("common.loading")}</p>
        ) : (
          <>
            {visibleDays.map(({ day, readings }) => {
              const done = doneSet.has(day);
              const isToday = day === currentDay;
              const isFuture = day > currentDay;
              return (
                <div
                  key={day}
                  className={`rp-day-row${done ? " rp-day-row--done" : ""}${isToday ? " rp-day-row--today" : ""}${isFuture ? " rp-day-row--future" : ""}`}
                >
                  <button
                    className={`rp-day-check${done ? " rp-day-check--done" : ""}`}
                    onClick={() => toggleDay(day)}
                    title={done ? t("readingPlans.markUnread") : t("readingPlans.markRead")}
                  >
                    {done ? "✓" : ""}
                  </button>
                  <div className="rp-day-info">
                    <span className="rp-day-num">{t("readingPlans.day")} {day}{isToday ? ` · ${t("readingPlans.today")}` : ""}</span>
                    <div className="rp-day-readings">
                      {readings.map((r, i) => (
                        <a key={i} className="rp-reading-chip rp-reading-chip--sm" href={wolChapterUrl(r.bookIndex, r.chapter)} target="_blank" rel="noopener noreferrer">
                          {r.bookAbbr} {r.chapter}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {!showAll && schedule.length > currentDay + 6 && (
              <button className="rp-show-all-btn" onClick={() => setShowAll(true)}>
                {t("readingPlans.showAll")} {schedule.length} {t("readingPlans.days")}
              </button>
            )}
          </>
        )}
      </div>

      <div className="rp-danger-zone">
        <button className="rp-unenroll-btn" onClick={() => setConfirmDelete(true)}>{t("readingPlans.removePlan")}</button>
      </div>

      {confirmDelete && (
        <ConfirmModal
          message={`${t("readingPlans.remove")} "${template.name}" ${t("readingPlans.removeConfirmSuffix")}`}
          onConfirm={handleUnenroll}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {confirmCatchUp && (
        <ConfirmModal
          message={t("readingPlans.catchUpConfirm")}
          onConfirm={handleCatchUp}
          onCancel={() => setConfirmCatchUp(false)}
        />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReadingPlansPage({ user, navigate, ...sharedNav }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("mine");
  const [detailPlan, setDetailPlan] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const { data: myPlans = [], isLoading } = useMyPlans();
  const enrollPlan = useEnrollPlan();
  const { isPremium } = useSubscription(user?.id);
  const { data: groupChallenges = [] } = useUserGroupChallenges(user?.id);

  const enrolledKeys = new Set(myPlans.map(p => p.template_key));
  const activeChallengeKeys = new Set(groupChallenges.map((c) => c.plan_key));

  const filteredTemplates = useMemo(() => {
    if (categoryFilter === "all") return PLAN_TEMPLATES;
    return PLAN_TEMPLATES.filter(t => t.category === categoryFilter);
  }, [categoryFilter]);

  function handleEnroll(templateKey) {
    enrollPlan.mutate(templateKey, {
      onSuccess: (plan) => { setDetailPlan(plan); setTab("mine"); },
    });
  }

  if (detailPlan) {
    return (
      <div className="rp-page">
        <AppLayout navigate={navigate} user={user} currentPage="readingPlans">
        <PlanDetail
          plan={detailPlan}
          allPlans={myPlans}
          onBack={() => setDetailPlan(null)}
          isPremium={isPremium}
          navigate={navigate}
          userId={user?.id}
        />
        </AppLayout>
      </div>
    );
  }

  return (
    <div className="rp-page">
      <AppLayout navigate={navigate} user={user} currentPage="readingPlans">
      <div className="rp-header">
        <button className="rp-nav-back" onClick={() => navigate("home")}>{t("common.back")}</button>
        <div className="rp-header-row">
          <div>
            <h1 className="rp-title">{t("readingPlans.title")}</h1>
            <p className="rp-subtitle">{t("readingPlans.subtitle")}</p>
          </div>
          <button className="rp-custom-plan-btn" onClick={() => setShowCustomModal(true)}>
            {t("readingPlans.buildCustom")}
          </button>
        </div>
      </div>

      <div className="rp-tabs">
        <button className={`rp-tab${tab === "mine" ? " rp-tab--active" : ""}`} onClick={() => setTab("mine")}>
          {t("readingPlans.myPlans")} {myPlans.length > 0 && <span className="rp-tab-count">{myPlans.length}</span>}
        </button>
        <button className={`rp-tab${tab === "browse" ? " rp-tab--active" : ""}`} onClick={() => setTab("browse")}>
          {t("readingPlans.browsePlans")}
        </button>
      </div>

      {tab === "mine" && (
        <div className="rp-content">
          {isLoading ? (
            <p className="rp-empty">{t("common.loading")}</p>
          ) : myPlans.length === 0 ? (
            <div className="rp-empty-state">
              <span className="rp-empty-icon">📅</span>
              <h3>{t("readingPlans.noActivePlans")}</h3>
              <p>{t("readingPlans.noActivePlansDesc")}</p>
              <div className="rp-empty-actions">
                <button className="rp-primary-btn" onClick={() => setTab("browse")}>{t("readingPlans.browsePlansBtn")}</button>
                <button className="rp-ghost-btn" onClick={() => setShowCustomModal(true)}>{t("readingPlans.buildCustom")}</button>
              </div>
            </div>
          ) : (
            <div className="rp-active-list">
              {myPlans.map(plan => (
                <ActivePlanCard key={plan.id} plan={plan} onClick={() => setDetailPlan(plan)} activeChallengeKeys={activeChallengeKeys} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "browse" && (
        <div className="rp-content">
          {/* Category filter */}
          <div className="rp-category-filter">
            {PLAN_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={`rp-category-btn${categoryFilter === cat.key ? " rp-category-btn--active" : ""}`}
                onClick={() => setCategoryFilter(cat.key)}
              >
                {t(`readingPlans.cat_${cat.key}`, cat.label)}
              </button>
            ))}
          </div>
          <div className="rp-template-list">
            {filteredTemplates.map(tmpl => (
              <TemplateCard
                key={tmpl.key}
                template={tmpl}
                enrolled={enrolledKeys.has(tmpl.key)}
                onEnroll={() => handleEnroll(tmpl.key)}
                enrolling={enrollPlan.isPending && enrollPlan.variables === tmpl.key}
                activeChallengeKeys={activeChallengeKeys}
              />
            ))}
          </div>
        </div>
      )}

      {showCustomModal && (
        <CustomPlanModal
          onClose={() => setShowCustomModal(false)}
          onCreated={(plan) => { setDetailPlan(plan); setTab("mine"); }}
        />
      )}
      </AppLayout>
    </div>
  );
}
