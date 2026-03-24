import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useReadingHeatmap, useReadingStreaks, useSetDailyGoal } from "../../hooks/useReading";
import ReadingHeatmap from "./ReadingHeatmap";
import "../../styles/reading-plan.css";

export default function ReadingPlanWidget({ userId, dailyGoal = 3, readonly = false }) {
  const { t } = useTranslation();
  const { data: heatmap = [] } = useReadingHeatmap(userId);
  const { data: streaks = { current_streak: 0, longest_streak: 0 } } = useReadingStreaks(userId);
  const setGoal = useSetDailyGoal(userId);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(dailyGoal);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = heatmap.find(d => d.date === todayStr);
  const todayChapters = todayEntry?.chapters ?? 0;
  const progressPct = Math.min(100, (todayChapters / dailyGoal) * 100);

  function handleGoalSave() {
    const g = Math.min(10, Math.max(1, parseInt(goalInput) || 3));
    setGoal.mutate(g);
    setEditingGoal(false);
  }

  return (
    <div className="reading-plan">
      <div className="reading-plan-stats">
        <div className="reading-plan-stat">
          <span className="reading-plan-stat-value">🔥 {streaks.current_streak}</span>
          <span className="reading-plan-stat-label">{t("readingPlan.currentStreak", { count: streaks.current_streak })}</span>
        </div>
        <div className="reading-plan-stat">
          <span className="reading-plan-stat-value">⭐ {streaks.longest_streak}</span>
          <span className="reading-plan-stat-label">{t("readingPlan.longestStreak", { count: streaks.longest_streak })}</span>
        </div>
        <div className="reading-plan-stat">
          <span className="reading-plan-stat-value">{todayChapters}/{dailyGoal}</span>
          <span className="reading-plan-stat-label">{t("readingPlan.todayGoal", { done: todayChapters, goal: dailyGoal })}</span>
        </div>
      </div>

      <div className="reading-plan-progress-bar">
        <div className="reading-plan-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <ReadingHeatmap data={heatmap} dailyGoal={dailyGoal} />

      {!readonly && (
        <div className="reading-plan-goal-row">
          {editingGoal ? (
            <>
              <input
                type="number" min={1} max={10}
                className="reading-plan-goal-input"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
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
