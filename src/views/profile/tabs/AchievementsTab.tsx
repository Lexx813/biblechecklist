import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BADGES } from "../../../data/badges";
import { BOOKS } from "../../../data/books";
import { useNotes } from "../../../hooks/useNotes";
import { useMyPlans } from "../../../hooks/useReadingPlans";
import { useQuizProgress } from "../../../hooks/useQuiz";
import { useBadges } from "../../../hooks/useBadges";

const OT_COUNT = 39;
const TOTAL_CHAPTERS = BOOKS.reduce((s, b) => s + b.chapters, 0);
const OT_CHAPTERS = BOOKS.slice(0, OT_COUNT).reduce((s, b) => s + b.chapters, 0);
const NT_CHAPTERS = BOOKS.slice(OT_COUNT).reduce((s, b) => s + b.chapters, 0);

const LEVEL_BADGES = [
  { level: 1,  emoji: "\u{1F4D6}" }, { level: 2,  emoji: "\u{1F4DA}" },
  { level: 3,  emoji: "\u{1F331}" }, { level: 4,  emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}" },
  { level: 5,  emoji: "\u{1F3FA}" }, { level: 6,  emoji: "\u2694\uFE0F" },
  { level: 7,  emoji: "\u{1F3B5}" }, { level: 8,  emoji: "\u{1F4EF}" },
  { level: 9,  emoji: "\u{1F54A}\uFE0F" }, { level: 10, emoji: "\u{1F30D}" },
  { level: 11, emoji: "\u{1F52E}" }, { level: 12, emoji: "\u{1F451}" },
  { level: 25, emoji: "\u2696\uFE0F" }, { level: 26, emoji: "\u{1F4DC}" },
  { level: 27, emoji: "\u{1F3DB}\uFE0F" }, { level: 28, emoji: "\u{1F33E}" },
  { level: 29, emoji: "\u2728" }, { level: 30, emoji: "\u{1F52D}" },
  { level: 31, emoji: "\u{1F3F0}" }, { level: 32, emoji: "\u26EA" },
  { level: 33, emoji: "\u{1F5FA}\uFE0F" }, { level: 34, emoji: "\u{1F469}" },
  { level: 35, emoji: "\u{1F4D0}" }, { level: 36, emoji: "\u{1F517}" },
];

/** Compute progress (0–1) for a given badge key */
function badgeProgress(
  key: string,
  { streak, otRead, ntRead, totalRead, levelsCompleted, notesCount, plansCompleted }: {
    streak: { current_streak: number; longest_streak: number };
    otRead: number;
    ntRead: number;
    totalRead: number;
    levelsCompleted: number;
    notesCount: number;
    plansCompleted: number;
  }
): number {
  switch (key) {
    case "full_bible_read": return Math.min(1, totalRead / TOTAL_CHAPTERS);
    case "streak_30":       return Math.min(1, streak.longest_streak / 30);
    case "streak_100":      return Math.min(1, streak.longest_streak / 100);
    case "streak_365":      return Math.min(1, streak.longest_streak / 365);
    case "quiz_all_levels": return Math.min(1, levelsCompleted / LEVEL_BADGES.length);
    case "first_note":      return Math.min(1, notesCount);
    case "first_group":     return 0; // can't easily measure
    case "plan_complete":   return Math.min(1, plansCompleted);
    case "full_nt_read":    return Math.min(1, ntRead / NT_CHAPTERS);
    case "full_ot_read":    return Math.min(1, otRead / OT_CHAPTERS);
    default: return 0;
  }
}

/** Human-readable progress label */
function progressLabel(key: string, progress: number, ctx: { streak: { longest_streak: number }; otRead: number; ntRead: number; totalRead: number; levelsCompleted: number; notesCount: number; plansCompleted: number }): string {
  if (progress >= 1) return "Completed!";
  switch (key) {
    case "full_bible_read": return `${ctx.totalRead} / ${TOTAL_CHAPTERS} chapters`;
    case "streak_30":       return `${Math.min(ctx.streak.longest_streak, 30)} / 30 days`;
    case "streak_100":      return `${Math.min(ctx.streak.longest_streak, 100)} / 100 days`;
    case "streak_365":      return `${Math.min(ctx.streak.longest_streak, 365)} / 365 days`;
    case "quiz_all_levels": return `${ctx.levelsCompleted} / ${LEVEL_BADGES.length} levels`;
    case "first_note":      return ctx.notesCount > 0 ? "Completed!" : "Write your first note";
    case "first_group":     return "Join a group";
    case "plan_complete":   return ctx.plansCompleted > 0 ? "Completed!" : "Finish a reading plan";
    case "full_nt_read":    return `${ctx.ntRead} / ${NT_CHAPTERS} chapters`;
    case "full_ot_read":    return `${ctx.otRead} / ${OT_CHAPTERS} chapters`;
    default: return "";
  }
}

/** Badge rarity tier based on difficulty */
function badgeTier(key: string): "common" | "rare" | "epic" | "legendary" {
  switch (key) {
    case "first_note":
    case "first_group":
      return "common";
    case "streak_30":
    case "plan_complete":
      return "rare";
    case "full_nt_read":
    case "full_ot_read":
    case "streak_100":
    case "quiz_all_levels":
      return "epic";
    case "full_bible_read":
    case "streak_365":
      return "legendary";
    default:
      return "common";
  }
}

interface Props {
  userId: string;
  streak: { current_streak: number; longest_streak: number; total_days?: number };
  readingProgress: Record<string, unknown>;
}

export default function AchievementsTab({ userId, streak, readingProgress }: Props) {
  const { t } = useTranslation();
  const { data: notes = [] } = useNotes(userId);
  const { data: plans = [] } = useMyPlans();
  const { data: quizProgress = [] } = useQuizProgress(userId);
  const { data: earnedBadges = [] } = useBadges(userId);

  // Quiz stats
  const quizProgressMap = useMemo(
    () => Object.fromEntries(quizProgress.map(p => [p.level, p])),
    [quizProgress]
  );
  const levelsCompleted = quizProgress.filter(p => p.badge_earned).length;
  const highestUnlocked = quizProgress.filter(p => p.unlocked).reduce((max, p) => Math.max(max, p.level), 0);

  // Reading stats
  const { totalRead, otRead, ntRead } = useMemo(() => {
    let totalRead = 0, otRead = 0, ntRead = 0;
    BOOKS.forEach((b, bi) => {
      const done = Object.values((readingProgress as any)[bi] || {}).filter(Boolean).length;
      totalRead += done;
      if (bi < OT_COUNT) otRead += done;
      else ntRead += done;
    });
    return { totalRead, otRead, ntRead };
  }, [readingProgress]);

  const plansCompleted = plans.filter((p: any) => p.completed_at).length;

  // Milestone badges
  const earnedKeys = useMemo(() => new Set(earnedBadges.map(b => b.badge_key)), [earnedBadges]);
  const earnedMap = useMemo(() => Object.fromEntries(earnedBadges.map(b => [b.badge_key, b.earned_at])), [earnedBadges]);
  const earnedCount = earnedKeys.size;

  const ctx = { streak, otRead, ntRead, totalRead, levelsCompleted, notesCount: notes.length, plansCompleted };

  // Sort: earned first, then by progress descending
  const sortedBadges = useMemo(() => {
    return [...BADGES].sort((a, b) => {
      const aE = earnedKeys.has(a.key) ? 1 : 0;
      const bE = earnedKeys.has(b.key) ? 1 : 0;
      if (aE !== bE) return bE - aE;
      return badgeProgress(b.key, ctx) - badgeProgress(a.key, ctx);
    });
  }, [earnedKeys, ctx]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Quiz Progress ── */}
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-5">
        <div className="pf-section pf-section--stats">
          <div className="pf-section-header">
            <h2><span className="pf-section-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="8 17 8 21"/><polyline points="16 17 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M6 21h12"/><path d="M8 17h8a4 4 0 0 0 4-4V5H4v8a4 4 0 0 0 4 4z"/><path d="M4 5H2"/><path d="M20 5h2"/></svg></span>{t("profile.quizProgress")}</h2>
            {highestUnlocked > 0 && (
              <span className="pf-quiz-meta">{levelsCompleted} / {LEVEL_BADGES[LEVEL_BADGES.length - 1].level} {t("profile.levelsComplete")}</span>
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
                    title={earned ? `${t(`quiz.theme${level}`)} \u2014 ${t(`quiz.badgeName${level}`)}` : unlocked ? t("quiz.unlocked") : t("quiz.locked")}
                  >
                    <span className="pf-quiz-badge-emoji">{emoji}</span>
                    <span className="pf-quiz-badge-level">{level}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Achievements ── */}
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="7"/>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
            </svg>
            Achievements
          </h2>
          <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-bold text-[var(--accent)]">
            {earnedCount} / {BADGES.length}
          </span>
        </div>

        {/* Overall progress bar */}
        <div className="mb-5">
          <div className="ach-overall-bar">
            <div
              className="ach-overall-fill"
              style={{ width: `${Math.round((earnedCount / BADGES.length) * 100)}%` }}
            />
          </div>
        </div>

        <div className="ach-grid">
          {sortedBadges.map((badge) => {
            const earned = earnedKeys.has(badge.key);
            const earnedAt = earnedMap[badge.key];
            const progress = earned ? 1 : badgeProgress(badge.key, ctx);
            const tier = badgeTier(badge.key);
            const label = progressLabel(badge.key, progress, ctx);

            return (
              <div
                key={badge.key}
                className={`ach-card ach-card--${tier}${earned ? " ach-card--earned" : ""}`}
              >
                {/* Tier indicator */}
                <div className={`ach-tier-dot ach-tier-dot--${tier}`} title={tier} />

                {/* Emoji */}
                <div className={`ach-emoji${earned ? " ach-emoji--earned" : ""}`}>
                  {badge.emoji}
                </div>

                {/* Info */}
                <div className="ach-info">
                  <span className="ach-name">{badge.label}</span>
                  <span className="ach-desc">{badge.description}</span>

                  {/* Progress */}
                  {!earned && progress > 0 && progress < 1 && (
                    <div className="ach-progress-wrap">
                      <div className="ach-progress-bar">
                        <div className="ach-progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
                      </div>
                      <span className="ach-progress-label">{label}</span>
                    </div>
                  )}

                  {!earned && progress === 0 && (
                    <span className="ach-progress-label ach-progress-label--dim">{label}</span>
                  )}

                  {earned && earnedAt && (
                    <span className="ach-earned-date">
                      Earned {new Date(earnedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>

                {/* Earned checkmark */}
                {earned && (
                  <div className="ach-check">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
