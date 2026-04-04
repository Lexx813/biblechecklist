import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
const AICompanion = lazy(() => import("../../components/AICompanion"));
import { useFullProfile } from "../../hooks/useAdmin";
import { useSubscription } from "../../hooks/useSubscription";
import {
  useQuizProgress,
  useQuizQuestions,
  useSubmitQuiz,
  useInitQuizProgress,
} from "../../hooks/useQuiz";
import { useSaveTimedScore, useUserBestTimedScore } from "../../hooks/useQuizTimed";
import UpgradePrompt, { isDismissed, dismissPrompt } from "../../components/UpgradePrompt";
import "../../styles/quiz.css";

const LEVELS = [
  { level: 1,  themeKey: "quiz.theme1",  badge: "📖", badgeNameKey: "quiz.badgeName1" },
  { level: 2,  themeKey: "quiz.theme2",  badge: "📚", badgeNameKey: "quiz.badgeName2" },
  { level: 3,  themeKey: "quiz.theme3",  badge: "🌱", badgeNameKey: "quiz.badgeName3" },
  { level: 4,  themeKey: "quiz.theme4",  badge: "👨‍👩‍👦", badgeNameKey: "quiz.badgeName4" },
  { level: 5,  themeKey: "quiz.theme5",  badge: "🏺", badgeNameKey: "quiz.badgeName5" },
  { level: 6,  themeKey: "quiz.theme6",  badge: "⚔️", badgeNameKey: "quiz.badgeName6" },
  { level: 7,  themeKey: "quiz.theme7",  badge: "🎵", badgeNameKey: "quiz.badgeName7" },
  { level: 8,  themeKey: "quiz.theme8",  badge: "📯", badgeNameKey: "quiz.badgeName8" },
  { level: 9,  themeKey: "quiz.theme9",  badge: "🕊️", badgeNameKey: "quiz.badgeName9" },
  { level: 10, themeKey: "quiz.theme10", badge: "🌍", badgeNameKey: "quiz.badgeName10" },
  { level: 11, themeKey: "quiz.theme11", badge: "🔮", badgeNameKey: "quiz.badgeName11" },
  { level: 12, themeKey: "quiz.theme12", badge: "👑", badgeNameKey: "quiz.badgeName12" },
];

// ── QuizLevelCard ──────────────────────────────────────────────────────────────

function QuizLevelCard({ levelData, progress, onClick }) {
  const { t } = useTranslation();
  const { level, themeKey, badge, badgeNameKey } = levelData;
  const theme = t(themeKey);
  const badgeName = t(badgeNameKey);

  const isUnlocked = level === 1 || progress?.unlocked === true;
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

// ── QuizHubSkeleton ───────────────────────────────────────────────────────────

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

// ── QuizPage (Hub) ─────────────────────────────────────────────────────────────

export default function QuizPage({ user, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { t } = useTranslation();
  const { data: progress = [], isLoading } = useQuizProgress(user.id);
  const initProgress = useInitQuizProgress(user.id);
  const [showQuizPrompt, setShowQuizPrompt] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const { isPremium } = useSubscription(user.id);

  // Ensure level 1 is unlocked on first visit
  useEffect(() => {
    initProgress.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badgeCount = progress.filter(p => p.badge_earned).length;

  useEffect(() => {
    if (isPremium || isLoading) return;
    if (badgeCount !== 3) return;
    if (!isDismissed("quiz-3-badges")) setShowQuizPrompt(true);
  }, [badgeCount, isPremium, isLoading]);

  const progressMap = Object.fromEntries(progress.map((p) => [p.level, p]));

  return (
    <>
      <div className="quiz-hub">
        <div className="quiz-hub-header">
          <h1 className="quiz-hub-title">{t("quiz.hubTitle")}</h1>
          <p className="quiz-hub-sub">{t("quiz.hubSub")}</p>
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
            {LEVELS.map((levelData) => (
              <QuizLevelCard
                key={levelData.level}
                levelData={levelData}
                progress={progressMap[levelData.level]}
                onClick={() => navigate("quizLevel", { level: levelData.level, timedMode })}
              />
            ))}
          </div>
        )}
      </div>
      {showQuizPrompt && (
        <UpgradePrompt
          icon="🧠"
          title="Go deeper with AI"
          message="Ask the AI study assistant anything about the verses you just answered. Understand the context, not just the answer."
          ctaLabel="Try AI Study Tools"
          onCta={() => {
            dismissPrompt("quiz-3-badges");
            setShowQuizPrompt(false);
            navigate("aiTools");
          }}
          onDismiss={() => {
            dismissPrompt("quiz-3-badges");
            setShowQuizPrompt(false);
          }}
        />
      )}
    </>
  );
}

// ── ExplanationPanel ───────────────────────────────────────────────────────────

function ExplanationPanel({ question, isPremium, onUpgrade }) {
  if (!question?.explanation) return null;

  return (
    <div className={`quiz-explanation${isPremium ? "" : " quiz-explanation--locked"}`}>
      <div className="quiz-explanation-inner">
        <div className="quiz-explanation-ref">💡 Explanation</div>
        <p className="quiz-explanation-text">{question.explanation}</p>
        {!isPremium && (
          <button className="quiz-explanation-gate" onClick={onUpgrade}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            ✦ See explanations — Go Premium
          </button>
        )}
      </div>
    </div>
  );
}

// ── TimerRing ─────────────────────────────────────────────────────────────────

const TIMER_MAX = 60;
const CIRCUMFERENCE = 2 * Math.PI * 22; // r=22

function TimerRing({ timeLeft }) {
  const pct = timeLeft / TIMER_MAX;
  const offset = CIRCUMFERENCE * (1 - pct);
  const strokeColor = timeLeft > 30 ? "#10b981" : timeLeft > 10 ? "#f59e0b" : "#ef4444";

  return (
    <div className="quiz-timer-ring">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle className="track" cx="28" cy="28" r="22" strokeWidth="4" />
        <circle
          className="fill"
          cx="28" cy="28" r="22" strokeWidth="4"
          stroke={strokeColor}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="quiz-timer-ring-number">{timeLeft}</span>
    </div>
  );
}

function getMultiplier(timeLeft) {
  if (timeLeft > 50) return 3;
  if (timeLeft >= 30) return 2;
  return 1;
}

// ── QuizLevel (Active Quiz) ────────────────────────────────────────────────────

export function QuizLevel({ level, user, onBack, onComplete, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade, timedMode = false }) {
  const { t } = useTranslation();
  const { data: profile } = useFullProfile(user?.id);
  const { isPremium } = useSubscription(user?.id);
  const levelData = LEVELS.find((l) => l.level === level) ?? LEVELS[0];
  const theme = t(levelData.themeKey);
  const badgeName = t(levelData.badgeNameKey);

  const { data: questions = [], isLoading } = useQuizQuestions(level);
  const submitQuiz = useSubmitQuiz(user.id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [answers, setAnswers] = useState([]); // {questionIndex, selectedIndex, correct}
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_MAX);
  const [timedScores, setTimedScores] = useState([]);
  const timerRef = useRef(null);
  const saveTimedScore = useSaveTimedScore(user.id);
  const { data: prevBest } = useUserBestTimedScore(user.id, level);

  const currentQuestion = questions[currentIndex];
  const isAnswered = selectedIndex !== null;
  const isLastQuestion = currentIndex === questions.length - 1;

  const score = answers.filter((a) => a.correct).length;
  const badgeEarned = score === 10;

  function handleSelectOption(idx) {
    if (isAnswered) return;
    setSelectedIndex(idx);
    const correct = idx === currentQuestion.correct_index;
    setAnswers((prev) => [
      ...prev,
      { questionIndex: currentIndex, selectedIndex: idx, correct },
    ]);
  }

  function handleNext() {
    if (isLastQuestion) {
      setShowResults(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
    }
  }

  // Submit final score exactly once when results screen appears.
  // `answers` at this point contains all 10 entries (the last one was
  // appended by handleSelectOption before handleNext was called).
  useEffect(() => {
    if (!showResults || submitted) return;
    setSubmitted(true);
    const finalScore = answers.filter((a) => a.correct).length;
    submitQuiz.mutate({ level, score: finalScore });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResults]);

  // Start/restart timer when question changes (timed mode only).
  useEffect(() => {
    if (!timedMode || isAnswered || showResults) return;
    setTimeLeft(TIMER_MAX);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setSelectedIndex(-1);
          setAnswers((prev) => [
            ...prev,
            { questionIndex: currentIndex, selectedIndex: -1, correct: false, timedOut: true },
          ]);
          setTimedScores((prev) => [...prev, 0]);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, timedMode]);

  // Stop timer when answered and record multiplier score.
  useEffect(() => {
    if (isAnswered && timerRef.current) {
      clearInterval(timerRef.current);
      if (timedMode) {
        const multiplier = getMultiplier(timeLeft);
        const questionScore = selectedIndex === currentQuestion?.correct_index
          ? 10 * multiplier
          : 0;
        setTimedScores((prev) => {
          if (prev.length === currentIndex) return [...prev, questionScore];
          return prev;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnswered]);

  // Save timed score when results shown.
  useEffect(() => {
    if (!showResults || !timedMode) return;
    const totalTimedScore = timedScores.reduce((s, n) => s + n, 0);
    saveTimedScore.mutate({ level, score: totalTimedScore });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResults]);

  function handleTryAgain() {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswers([]);
    setShowResults(false);
    setSubmitted(false);
    setTimeLeft(TIMER_MAX);
    setTimedScores([]);
  }

  if (isLoading || questions.length === 0) {
    return (
      <div className="quiz-active quiz-active--loading">
        <div role="status" aria-label={t("quiz.loading")} style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
          <div className="skeleton" style={{ height: 22, width: "70%", borderRadius: 6 }} />
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 44, width: "100%", borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="quiz-active">
          <div className="quiz-results">
            <div className="quiz-results-header">
              <h2 className="quiz-results-title">{t("quiz.results")}</h2>
              <p className="quiz-results-score">{t("quiz.score", { score })}</p>
              <p className={`quiz-results-verdict ${badgeEarned ? "quiz-results-verdict--pass" : "quiz-results-verdict--fail"}`}>
                {badgeEarned ? t("quiz.pass") : t("quiz.fail")}
              </p>
              {badgeEarned && (
                <div className="quiz-badge-reveal">
                  <span className="quiz-badge-emoji" role="img" aria-label={badgeName}>{levelData.badge}</span>
                  <span className="quiz-badge-name">{t("quiz.badgeEarned", { name: badgeName })}</span>
                </div>
              )}
              {timedMode && (
                <div className="quiz-timed-result">
                  <div>Timed Score: <strong>{timedScores.reduce((s, n) => s + n, 0)}</strong> pts</div>
                  {prevBest != null && timedScores.reduce((s, n) => s + n, 0) > prevBest && (
                    <div className="quiz-timed-new-best">🏆 New best!</div>
                  )}
                </div>
              )}
            </div>

            <div className="quiz-results-review">
              {questions.map((q, qi) => {
                const ans = answers[qi];
                const wasCorrect = ans?.correct;
                const opts = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
                return (
                  <div key={q.id} className={`quiz-review-item ${wasCorrect ? "quiz-review-item--correct" : "quiz-review-item--wrong"}`}>
                    <div className="quiz-review-q">
                      <span className="quiz-review-icon">
                          {wasCorrect
                            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          }
                        </span>
                      <span className="quiz-review-text">{q.question}</span>
                    </div>
                    <div className="quiz-review-answers">
                      {!wasCorrect && (
                        <div className="quiz-review-your-answer">
                          {t("quiz.yourAnswer")} <span className="quiz-review-wrong-text">{opts[ans?.selectedIndex] ?? "—"}</span>
                        </div>
                      )}
                      <div className="quiz-review-correct-answer">
                        {t("quiz.correct")} <span className="quiz-review-correct-text">{opts[q.correct_index]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="quiz-results-actions">
              <button className="quiz-btn quiz-btn--secondary" onClick={onBack}>
                {t("quiz.backToLevels")}
              </button>
              <button className="quiz-btn quiz-btn--primary" onClick={handleTryAgain}>
                {t("quiz.tryAgain")}
              </button>
            </div>
          </div>
        </div>
    );
  }

  const opts = Array.isArray(currentQuestion.options)
    ? currentQuestion.options
    : JSON.parse(currentQuestion.options);

  return (
      <div className="quiz-active">
        {/* Level header */}
        <div className="quiz-level-header">
          <button className="back-btn" onClick={onBack}>{t("quiz.backToLevels")}</button>
          <div className="quiz-level-info">
            <span className="quiz-level-badge">{levelData.badge}</span>
            <span className="quiz-level-name">{t("quiz.level", { n: level })} · {theme}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="quiz-progress-wrap">
          <div className="quiz-progress-label">
            {t("quiz.questionOf", { current: currentIndex + 1, total: questions.length })}
          </div>
          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-fill"
              style={{ width: `${((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100}%` }}
            />
          </div>
          <div className="quiz-score-running">
            {answers.filter((a) => a.correct).length}/{currentIndex + (isAnswered ? 1 : 0)}
          </div>
        </div>

        {/* Timer (timed mode only) */}
        {timedMode && !isAnswered && (
          <div className="quiz-timer-wrap">
            <TimerRing timeLeft={timeLeft} />
            <span className="quiz-multiplier-badge">{getMultiplier(timeLeft)}×</span>
          </div>
        )}

        {/* Question */}
        <div className="quiz-question-card">
          <p className="quiz-question">{currentQuestion.question}</p>

          <div className="quiz-options">
            {opts.map((opt, idx) => {
              let cls = "quiz-option";
              if (isAnswered) {
                if (idx === currentQuestion.correct_index) cls += " quiz-option--correct";
                else if (idx === selectedIndex) cls += " quiz-option--wrong";
                else cls += " quiz-option--dim";
              }
              return (
                <button
                  key={idx}
                  className={cls}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                >
                  <span className="quiz-option-letter">{["A", "B", "C", "D"][idx]}</span>
                  <span className="quiz-option-text">{opt}</span>
                  {isAnswered && idx === currentQuestion.correct_index && (
                    <span className="quiz-option-indicator">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                  )}
                  {isAnswered && idx === selectedIndex && idx !== currentQuestion.correct_index && (
                    <span className="quiz-option-indicator">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <>
              {!timedMode && (
                <ExplanationPanel
                  question={currentQuestion}
                  isPremium={isPremium}
                  onUpgrade={onUpgrade}
                />
              )}
              <div className="quiz-next-wrap">
                <button className="quiz-btn quiz-btn--primary" onClick={handleNext}>
                  {isLastQuestion ? t("quiz.seeResults") : t("quiz.next")}
                </button>
              </div>
            </>
          )}
        </div>

        {isAnswered && isPremium && (
          <Suspense fallback={null}>
            <AICompanion
              passage={currentQuestion.question}
              reference={`Quiz · Level ${level} · ${theme}`}
              className="quiz-ai-companion"
            />
          </Suspense>
        )}
      </div>
  );
}
