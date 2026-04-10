import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSubscription } from "../../hooks/useSubscription";
import {
  useQuizProgress,
  useInitQuizProgress,
} from "../../hooks/useQuiz";
import { ADVANCED_LEVELS, QuizLevel } from "./QuizPage";
import "../../styles/quiz.css";

// ── QuizLevelCard (reused layout from QuizPage) ──────────────────────────────

function QuizLevelCard({ levelData, progress, onClick }) {
  const { t } = useTranslation();
  const { level, themeKey, badge, badgeNameKey } = levelData;
  const theme = t(themeKey);
  const badgeName = t(badgeNameKey);

  const isUnlocked = level === 25 || progress?.unlocked === true;
  const isCompleted = progress?.badge_earned === true;
  const bestScore = progress?.best_score ?? 0;
  const attempts = progress?.attempts ?? 0;

  let cardClass = "quiz-level-card";
  if (!isUnlocked) cardClass += " quiz-level-card--locked";
  else if (isCompleted) cardClass += " quiz-level-card--completed";
  else cardClass += " quiz-level-card--unlocked";

  return (
    <div
      className={cardClass}
      onClick={isUnlocked ? onClick : undefined}
      role={isUnlocked ? "button" : undefined}
      tabIndex={isUnlocked ? 0 : undefined}
      onKeyDown={isUnlocked ? (e) => e.key === "Enter" && onClick() : undefined}
      aria-label={isUnlocked ? `${t("quiz.level", { n: level })}: ${theme}` : `${t("quiz.locked")}: ${theme}`}
    >
      <div className="quiz-level-card-header">
        <span className="quiz-level-number">{t("quiz.level", { n: level })}</span>
        {isCompleted && (
          <span className="quiz-level-badge-icon" title={badgeName}>{badge}</span>
        )}
        {!isUnlocked && (
          <span className="quiz-lock-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </span>
        )}
      </div>

      <div className="quiz-level-emoji">
        {isUnlocked ? <span role="img" aria-label={badgeName}>{badge}</span> : (
          <svg className="quiz-level-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        )}
      </div>
      <div className="quiz-level-theme">{theme}</div>

      {isUnlocked && (
        <div className="quiz-level-footer">
          {attempts > 0 ? (
            <>
              <span className="quiz-level-score">{t("quiz.bestScore", { score: bestScore })}</span>
              <span className="quiz-level-attempts">
                {t("quiz.attempts", { count: attempts })}
              </span>
            </>
          ) : (
            <span className="quiz-level-start">{t("quiz.unlocked")}</span>
          )}
          {isCompleted && (
            <span className="quiz-level-completed-label">{t("quiz.completed")}</span>
          )}
        </div>
      )}

      {!isUnlocked && (
        <div className="quiz-level-footer">
          <span className="quiz-level-locked-label">{t("quiz.locked")}</span>
        </div>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function QuizHubSkeleton() {
  return (
    <div className="quiz-hub">
      <div className="quiz-hub-header">
        <div className="skeleton" style={{ height: 44, width: '60%', margin: '0 auto 12px' }} />
        <div className="skeleton" style={{ height: 18, width: '40%', margin: '0 auto' }} />
      </div>
      <div className="quiz-level-grid">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
        ))}
      </div>
    </div>
  );
}

// ── AdvancedQuizPage (Hub) ────────────────────────────────────────────────────

export default function AdvancedQuizPage({ user, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { t } = useTranslation();
  const { data: progress = [], isLoading } = useQuizProgress(user.id);
  const initAdvanced = useInitQuizProgress(user.id, 25);
  const [timedMode, setTimedMode] = useState(false);
  const { isPremium } = useSubscription(user.id);

  // Ensure level 25 is unlocked on first visit
  useEffect(() => {
    initAdvanced.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badgeCount = progress.filter(p => p.badge_earned && p.level >= 25 && p.level <= 36).length;
  const progressMap = Object.fromEntries(progress.map((p) => [p.level, p]));

  return (
    <div className="quiz-hub">
      <div className="quiz-hub-header">
        <h1 className="quiz-hub-title">{t("quiz.advancedHubTitle")}</h1>
        <p className="quiz-hub-sub">{t("quiz.advancedHubSub")}</p>
        <button className="quiz-btn quiz-btn--secondary" style={{ marginTop: 8 }} onClick={() => navigate("quiz")}>
          {t("quiz.backToBasic")}
        </button>
      </div>

      <div className="quiz-timed-toggle-row">
        <span className="quiz-timed-toggle-label">
          Timed Mode
          <span className="gold-badge">✦ Premium</span>
        </span>
        <label className="quiz-timed-toggle">
          <input
            type="checkbox"
            checked={timedMode}
            onChange={(e) => {
              if (!isPremium) { onUpgrade?.(); return; }
              setTimedMode(e.target.checked);
            }}
          />
          <span className="quiz-timed-toggle-track" />
          <span className="quiz-timed-toggle-thumb" />
        </label>
      </div>

      {isLoading ? (
        <QuizHubSkeleton />
      ) : (
        <div className="quiz-level-grid">
          {ADVANCED_LEVELS.map((levelData) => (
            <QuizLevelCard
              key={levelData.level}
              levelData={levelData}
              progress={progressMap[levelData.level]}
              onClick={() => navigate("advancedQuizLevel", { level: levelData.level, timedMode })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Wrapper that passes ADVANCED_LEVELS to the shared QuizLevel component
export function AdvancedQuizLevel(props) {
  return <QuizLevel {...props} levelsArray={ADVANCED_LEVELS} />;
}
