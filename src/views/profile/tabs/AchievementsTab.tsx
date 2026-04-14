import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BADGES } from "../../../data/badges";

const LEVEL_BADGES = [
  { level: 1,  emoji: "📖" }, { level: 2,  emoji: "📚" },
  { level: 3,  emoji: "🌱" }, { level: 4,  emoji: "👨‍👩‍👦" },
  { level: 5,  emoji: "🏺" }, { level: 6,  emoji: "⚔️" },
  { level: 7,  emoji: "🎵" }, { level: 8,  emoji: "📯" },
  { level: 9,  emoji: "🕊️" }, { level: 10, emoji: "🌍" },
  { level: 11, emoji: "🔮" }, { level: 12, emoji: "👑" },
];

interface Props {
  userId: string;
  quizProgress: Array<{ level: number; badge_earned: boolean; unlocked: boolean }>;
  earnedBadges: Array<{ badge_key: string; earned_at: string }>;
}

export default function AchievementsTab({ userId, quizProgress, earnedBadges }: Props) {
  const { t } = useTranslation();

  // Quiz stats
  const quizProgressMap = useMemo(
    () => Object.fromEntries(quizProgress.map(p => [p.level, p])),
    [quizProgress]
  );
  const levelsCompleted = quizProgress.filter(p => p.badge_earned).length;
  const highestUnlocked = quizProgress.filter(p => p.unlocked).reduce((max, p) => Math.max(max, p.level), 0);

  // Milestone badges
  const earnedKeys = useMemo(() => new Set(earnedBadges.map(b => b.badge_key)), [earnedBadges]);
  const earnedMap = useMemo(() => Object.fromEntries(earnedBadges.map(b => [b.badge_key, b.earned_at])), [earnedBadges]);
  const earnedCount = earnedKeys.size;

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-5">
      {/* Quiz Progress */}
      <div className="pf-section pf-section--stats">
        <div className="pf-section-header">
          <h2><span className="pf-section-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="8 17 8 21"/><polyline points="16 17 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M6 21h12"/><path d="M8 17h8a4 4 0 0 0 4-4V5H4v8a4 4 0 0 0 4 4z"/><path d="M4 5H2"/><path d="M20 5h2"/></svg></span>{t("profile.quizProgress")}</h2>
          {highestUnlocked > 0 && (
            <span className="pf-quiz-meta">{levelsCompleted} / 12 {t("profile.levelsComplete")}</span>
          )}
        </div>
        {highestUnlocked === 0 ? (
          <p className="pf-empty">{t("profile.quizNotStarted")}</p>
        ) : (
          <div className="pf-quiz-badges">
            {LEVEL_BADGES.map(({ level, emoji }) => {
              const prog = quizProgressMap[level];
              const earned = prog?.badge_earned === true;
              const unlocked = level === 1 || prog?.unlocked === true;
              return (
                <div
                  key={level}
                  className={`pf-quiz-badge${earned ? " pf-quiz-badge--earned" : unlocked ? " pf-quiz-badge--unlocked" : " pf-quiz-badge--locked"}`}
                  title={earned ? `${t(`quiz.theme${level}`)} — ${t(`quiz.badgeName${level}`)}` : unlocked ? t("quiz.unlocked") : t("quiz.locked")}
                >
                  <span className="pf-quiz-badge-emoji">{emoji}</span>
                  <span className="pf-quiz-badge-level">{level}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Achievements / Milestone Badges */}
      <div className="achievements-section">
        <h3 className="achievements-title">
          Achievements ({earnedCount} / {BADGES.length})
        </h3>
        <div className="badge-grid">
          {BADGES.map((badge) => {
            const earned = earnedKeys.has(badge.key);
            const earnedAt = earnedMap[badge.key];
            return (
              <div
                key={badge.key}
                className={`badge-card ${earned ? "badge-card--earned" : "badge-card--locked"}`}
                title={badge.description + (earnedAt ? `\nEarned ${new Date(earnedAt).toLocaleDateString()}` : "")}
              >
                <span className="badge-emoji" role="img" aria-label={badge.label}>
                  {badge.emoji}
                </span>
                <span className="badge-label">{badge.label}</span>
                {earned && earnedAt && (
                  <span className="badge-earned-date">
                    {new Date(earnedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
