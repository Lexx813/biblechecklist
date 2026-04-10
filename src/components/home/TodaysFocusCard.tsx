import { useMemo, useState, useEffect, useRef } from "react";
import {
  useMyPlans,
  usePlanCompletions,
  useMarkDay,
  useUnmarkDay,
} from "../../hooks/useReadingPlans";
import { useReadingStreak, useChapterTimestamps } from "../../hooks/useProgress";
import { getTemplateOrCustom, generateSchedule } from "../../data/readingPlanTemplates";
import { wolChapterUrl } from "../../utils/wol";
import { BOOKS } from "../../data/books";
import { formatDate } from "../../utils/formatters";
import "../../styles/todays-focus.css";
import "../../styles/gamification.css";
import { useFreezeStatus, useApplyFreeze } from "../../hooks/useStreakFreeze";

function effectiveDay(plan: { start_date: string; paused_days?: number; is_paused?: boolean; paused_at?: string }) {
  const start = new Date(plan.start_date + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const raw = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
  let pausedDays = plan.paused_days ?? 0;
  if (plan.is_paused && plan.paused_at) {
    const pausedDate = new Date(plan.paused_at);
    pausedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    pausedDays += Math.max(0, Math.floor((today.getTime() - pausedDate.getTime()) / 86400000));
  }
  return Math.max(1, raw - pausedDays);
}

function useLastReadChapter(userId: string | undefined) {
  const { data: timestamps = {} } = useChapterTimestamps(userId);
  return useMemo(() => {
    let best = null;
    for (const [bi, chapters] of Object.entries(timestamps)) {
      for (const [ch, ts] of Object.entries(chapters)) {
        if (!best || ts > best.ts) {
          best = { bookIndex: parseInt(bi, 10), chapter: parseInt(ch, 10), ts };
        }
      }
    }
    return best;
  }, [timestamps]);
}

function readingsLabel(readings: Array<{ bookIndex: number; chapter: number }> | null | undefined) {
  if (!readings || readings.length === 0) return "—";
  const byBook: Record<number, number[]> = {};
  for (const { bookIndex, chapter } of readings) {
    if (!byBook[bookIndex]) byBook[bookIndex] = [];
    byBook[bookIndex].push(chapter);
  }
  return Object.entries(byBook)
    .map(([bi, chs]) => {
      const name = BOOKS[parseInt(bi, 10)]?.name ?? "";
      if (chs.length === 1) return `${name} ${chs[0]}`;
      return `${name} ${chs[0]}–${chs[chs.length - 1]}`;
    })
    .join(", ");
}

interface Props {
  userId?: string;
  navigate: (page: string) => void;
  isPremium?: boolean;
  onUpgrade?: () => void;
  lang?: string;
}

export default function TodaysFocusCard({ userId, navigate, isPremium, onUpgrade, lang = "en" }: Props) {
  const { data: plans = [], isLoading: plansLoading } = useMyPlans();
  const activePlan = plans.find(p => !p.is_paused && !p.completed_at) ?? null;
  const activePlanTotalDays = activePlan ? getTemplateOrCustom(activePlan).totalDays : undefined;

  const { data: completions = [] } = usePlanCompletions(activePlan?.id ?? null);
  const markDay = useMarkDay(activePlan?.id ?? null, userId, activePlanTotalDays);
  const unmarkDay = useUnmarkDay(activePlan?.id ?? null);
  const { data: streak = { current_streak: 0 } } = useReadingStreak(userId);
  const lastRead = useLastReadChapter(userId);

  const { data: freezeStatus } = useFreezeStatus(userId);
  const applyFreeze = useApplyFreeze(userId);
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);

  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const yesterdayFrozen = freezeStatus?.recentFreezes?.includes(yesterdayStr);
  const canFreeze = (freezeStatus?.tokens ?? 0) > 0 && !yesterdayFrozen && (streak?.current_streak ?? 0) > 0;

  const [streakPop, setStreakPop] = useState(false);
  const streakPopFired = useRef(false);
  useEffect(() => {
    if (!streakPopFired.current && streak?.current_streak > 0) {
      streakPopFired.current = true;
      setStreakPop(true);
    }
  }, [streak?.current_streak]);

  const { template, currentDay, doneSet, todayReadings, pct } = useMemo(() => {
    if (!activePlan) return { template: null, currentDay: 1, doneSet: new Set(), todayReadings: [], pct: 0 };
    const tpl = getTemplateOrCustom(activePlan);
    const sched = generateSchedule(tpl.bookIndices, tpl.totalDays);
    const day = Math.min(effectiveDay(activePlan), tpl.totalDays);
    const done = new Set(completions.map(c => c.day_number));
    const readings = sched[day - 1]?.readings ?? [];
    const percent = Math.round((done.size / tpl.totalDays) * 100);
    return { template: tpl, currentDay: day, doneSet: done, todayReadings: readings, pct: percent };
  }, [activePlan, completions]);

  const todayDone = doneSet.has(currentDay);

  function handleMarkDone() {
    if (todayDone) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (unmarkDay.mutate as any)(currentDay);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (markDay.mutate as any)(currentDay);
    }
  }

  const wolUrl = todayReadings.length > 0
    ? wolChapterUrl(todayReadings[0].bookIndex, todayReadings[0].chapter, lang)
    : null;

  if (plansLoading) {
    return (
      <div className="tf-skeleton" aria-busy="true">
        <div className="tf-skeleton-bar tf-skeleton-bar--title" />
        <div className="tf-skeleton-bar tf-skeleton-bar--sub" />
        <div className="tf-skeleton-bar tf-skeleton-bar--progress" />
        <div className="tf-skeleton-bar tf-skeleton-bar--btn" />
      </div>
    );
  }

  if (!activePlan || !template) {
    return (
      <div>
        <div className="tf-no-plan">
          <div className="tf-no-plan-icon">📅</div>
          <div className="tf-no-plan-text">
            <div className="tf-no-plan-title">Start a reading plan</div>
            <div className="tf-no-plan-sub">Daily assignments, streak tracking, finish the NWT in 1 year.</div>
          </div>
          <button
            className="tf-no-plan-cta"
            onClick={() => isPremium ? navigate("readingPlans") : onUpgrade?.()}
          >
            {isPremium ? "Browse Plans" : "Unlock Plans"}
          </button>
        </div>
        {lastRead && (
          <button className="tf-continue" onClick={() => navigate("main")}>
            <span className="tf-continue-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </span>
            <div className="tf-continue-body">
              <div className="tf-continue-title">Continue — {BOOKS[lastRead.bookIndex]?.name} {lastRead.chapter}</div>
              <div className="tf-continue-sub">Last read {formatDate(lastRead.ts)}</div>
            </div>
            <span className="tf-continue-arrow">›</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="tf-card">
        <div className="tf-header">
          <div>
            <div className="tf-label">Today's Reading</div>
            <h3 className="tf-title">{readingsLabel(todayReadings)}</h3>
            <div className="tf-subtitle">{template.name} · Day {currentDay} of {template.totalDays}</div>
          </div>
          {streak.current_streak > 0 && (
            <div className="tf-streak">
              <div className="tf-streak-label">Streak</div>
              <div className="tf-streak-value">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fb923c" aria-hidden="true"><path d="M12 23c-4.97 0-8-3.03-8-7 0-2.44 1.34-4.81 2.5-6.35A1 1 0 0 1 8.18 10c.34 1.14 1.1 2.13 2.05 2.75C10.31 10 12 6 12 2a1 1 0 0 1 1.66-.75c2.24 1.92 5.84 5.63 5.84 10.75 0 5.68-3.55 11-7.5 11z"/></svg>
                <span
                  className={`tf-streak-number${streakPop ? ' streak-pop' : ''}`}
                  onAnimationEnd={() => setStreakPop(false)}
                >
                  {streak.current_streak}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Streak freeze */}
        {isPremium ? (
          <div className="tf-freeze-row">
            <span className="tf-freeze-token-count">
              ❄️ {freezeStatus?.tokens ?? 2} {(freezeStatus?.tokens ?? 2) === 1 ? "freeze" : "freezes"} left
            </span>
            {canFreeze && (
              <button
                className="tf-freeze-btn"
                onClick={() => setShowFreezeConfirm(true)}
                disabled={applyFreeze.isPending}
              >
                Freeze streak
              </button>
            )}
            {(freezeStatus?.tokens ?? 0) === 0 && (
              <span style={{ opacity: 0.5, fontSize: "0.78rem" }}>No freezes left this month</span>
            )}
          </div>
        ) : (
          <button
            className="tf-freeze-locked"
            onClick={() => onUpgrade?.()}
            aria-label="Streak Freeze — Premium feature"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            ✦ Streak Freeze (Premium)
          </button>
        )}

        {showFreezeConfirm && (
          <div className="freeze-confirm-overlay" onClick={() => setShowFreezeConfirm(false)}>
            <div className="freeze-confirm-dialog" role="dialog" aria-modal="true" aria-label="Confirm streak freeze" onClick={(e) => e.stopPropagation()}>
              <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Use a freeze token?</p>
              <p style={{ margin: "0 0 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                {freezeStatus?.tokens ?? 0} token{(freezeStatus?.tokens ?? 0) !== 1 ? "s" : ""} remaining after this.
              </p>
              <div className="freeze-confirm-actions">
                <button className="tf-freeze-btn" onClick={() => setShowFreezeConfirm(false)}>Cancel</button>
                <button
                  className="tf-freeze-btn"
                  style={{ background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}
                  onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (applyFreeze.mutate as any)(yesterdayStr);
                    setShowFreezeConfirm(false);
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="tf-progress">
          <div className="tf-progress-bar-track">
            <div className="tf-progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="tf-progress-meta">{pct}% complete · {template.totalDays - doneSet.size} days remaining</div>
        </div>

        <div className="tf-actions">
          <button
            className={`tf-mark-done${todayDone ? " tf-mark-done--done" : ""}`}
            onClick={handleMarkDone}
            disabled={markDay.isPending || unmarkDay.isPending}
          >
            {todayDone
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Done for today</>
              : "✓ Mark Done"
            }
          </button>
          {wolUrl && (
            <a
              href={wolUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tf-wol-btn"
            >
              Open in WOL →
            </a>
          )}
        </div>
      </div>

      {lastRead && (
        <button className="tf-continue" onClick={() => navigate("main")}>
          <span className="tf-continue-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </span>
          <div className="tf-continue-body">
            <div className="tf-continue-title">Continue — {BOOKS[lastRead.bookIndex]?.name} {lastRead.chapter}</div>
            <div className="tf-continue-sub">Last read {formatDate(lastRead.ts)}</div>
          </div>
          <span className="tf-continue-arrow">›</span>
        </button>
      )}
    </div>
  );
}
