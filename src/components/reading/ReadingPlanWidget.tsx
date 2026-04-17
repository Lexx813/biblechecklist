import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useReadingHeatmap, useReadingStreaks, useSetDailyGoal } from "../../hooks/useReading";
import ReadingHeatmap from "./ReadingHeatmap";
import "../../styles/reading-plan.css";

function estimateFinishDays(heatmap: Array<{ date: string; chapters: number }>, chaptersRemaining: number) {
  if (chaptersRemaining <= 0) return null;
  const recent = heatmap.slice(-14);
  const activeDays = recent.filter(d => d.chapters > 0);
  if (activeDays.length < 3) return null;
  const avgPerDay = activeDays.reduce((s, d) => s + d.chapters, 0) / activeDays.length;
  if (avgPerDay <= 0) return null;
  return Math.ceil(chaptersRemaining / avgPerDay);
}

interface Props {
  userId?: string;
  dailyGoal?: number;
  readonly?: boolean;
  compact?: boolean;
  chaptersRead?: number;
  totalChapters?: number;
}

export default function ReadingPlanWidget({ userId, dailyGoal = 3, readonly = false, compact = false, chaptersRead = 0, totalChapters = 1189 }: Props) {
  const { t } = useTranslation();
  const { data: heatmap = [] } = useReadingHeatmap(userId);
  const { data: streaks = { current_streak: 0, longest_streak: 0 } } = useReadingStreaks(userId);
  const setGoal = useSetDailyGoal(userId);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(dailyGoal);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = heatmap.find(d => d.date === todayStr);
  const todayChapters = todayEntry?.chapters ?? 0;
  const goalMet = todayChapters >= dailyGoal;

  const daysToFinish = useMemo(
    () => estimateFinishDays(heatmap, totalChapters - chaptersRead),
    [heatmap, chaptersRead, totalChapters]
  );

  function handleGoalSave() {
    const g = Math.min(30, Math.max(1, goalInput || 3));
    setGoal.mutate(g);
    setEditingGoal(false);
  }

  return (
    <div className="reading-plan">
      {!compact && (
        <div className="reading-plan-top">
          <div className="reading-plan-stats">
            <div className="reading-plan-stat">
              <span className="reading-plan-stat-value"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{verticalAlign:"middle",marginRight:2}}><path d="M12 23c-4.97 0-8-3.03-8-7 0-2.44 1.34-4.81 2.5-6.35A1 1 0 0 1 8.18 10c.34 1.14 1.1 2.13 2.05 2.75C10.31 10 12 6 12 2a1 1 0 0 1 1.66-.75c2.24 1.92 5.84 5.63 5.84 10.75 0 5.68-3.55 11-7.5 11z"/></svg>{streaks.current_streak}</span>
              <span className="reading-plan-stat-label">{t("readingPlan.currentStreak", { count: streaks.current_streak })}</span>
            </div>
            <div className="reading-plan-stat">
              <span className="reading-plan-stat-value"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{verticalAlign:"middle",marginRight:2}}><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6z"/></svg>{streaks.longest_streak}</span>
              <span className="reading-plan-stat-label">{t("readingPlan.longestStreak", { count: streaks.longest_streak })}</span>
            </div>
            <div className="reading-plan-stat">
              <span className="reading-plan-stat-value">{todayChapters}/{dailyGoal}</span>
              <span className="reading-plan-stat-label">{t("readingPlan.todayGoal", { done: todayChapters, goal: dailyGoal })}</span>
            </div>
          </div>

          {daysToFinish && (
            <div className="reading-plan-finish-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle",marginRight:4}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{t("readingPlan.finishIn", { days: daysToFinish })}
            </div>
          )}
        </div>
      )}

      {/* Chapter dots */}
      <div className="reading-plan-dots-row">
        {Array.from({ length: dailyGoal }, (_, i) => (
          <span key={i} className={`reading-plan-dot${i < todayChapters ? " reading-plan-dot--done" : ""}`} />
        ))}
        {goalMet && (
          <span className="reading-plan-goal-met">{t("readingPlan.goalMet")}</span>
        )}
      </div>

      <ReadingHeatmap data={heatmap} dailyGoal={dailyGoal} />

      {!readonly && (
        <div className="reading-plan-goal-row">
          {editingGoal ? (
            <>
              <span className="reading-plan-goal-label">Daily goal:</span>
              <input
                id="reading-plan-goal"
                name="daily_goal"
                type="number" inputMode="numeric" min={1} max={30}
                className="reading-plan-goal-input"
                value={goalInput}
                onChange={e => setGoalInput(Number(e.target.value))}
                onKeyDown={e => { if (e.key === "Enter") handleGoalSave(); if (e.key === "Escape") setEditingGoal(false); }}
                autoFocus
              />
              <button className="reading-plan-goal-save" onClick={handleGoalSave}>
                {t("readingPlan.goalSave")}
              </button>
              <button className="reading-plan-goal-cancel" onClick={() => setEditingGoal(false)}>
                {t("common.cancel")}
              </button>
            </>
          ) : (
            <button
              className="reading-plan-goal-edit-btn"
              onClick={() => { setGoalInput(dailyGoal); setEditingGoal(true); }}
            >
              {t("readingPlan.setGoal")} ({dailyGoal}/day)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
