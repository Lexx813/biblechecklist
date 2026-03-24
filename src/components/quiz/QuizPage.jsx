import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageNav from "../PageNav";
import {
  useQuizProgress,
  useQuizQuestions,
  useSubmitQuiz,
  useInitQuizProgress,
} from "../../hooks/useQuiz";
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
  { level: 9,  themeKey: "quiz.theme9",  badge: "✝️", badgeNameKey: "quiz.badgeName9" },
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
        {!isUnlocked && <span className="quiz-lock-icon">🔒</span>}
      </div>

      <div className="quiz-level-emoji">{isUnlocked ? badge : "🔒"}</div>
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

// ── QuizPage (Hub) ─────────────────────────────────────────────────────────────

export default function QuizPage({ user, navigate, darkMode, setDarkMode, i18n, onLogout }) {
  const { t } = useTranslation();
  const { data: progress = [], isLoading } = useQuizProgress(user.id);
  const initProgress = useInitQuizProgress(user.id);

  // Ensure level 1 is unlocked on first visit
  useEffect(() => {
    initProgress.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressMap = Object.fromEntries(progress.map((p) => [p.level, p]));

  return (
    <div className="quiz-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />

      <div className="quiz-hub">
        <div className="quiz-hub-header">
          <h1 className="quiz-hub-title">{t("quiz.hubTitle")}</h1>
          <p className="quiz-hub-sub">{t("quiz.hubSub")}</p>
        </div>

        {isLoading ? (
          <div className="quiz-loading">{t("quiz.loading")}</div>
        ) : (
          <div className="quiz-level-grid">
            {LEVELS.map((levelData) => (
              <QuizLevelCard
                key={levelData.level}
                levelData={levelData}
                progress={progressMap[levelData.level]}
                onClick={() => navigate("quizLevel", { level: levelData.level })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── QuizLevel (Active Quiz) ────────────────────────────────────────────────────

export function QuizLevel({ level, user, onBack, onComplete, navigate, darkMode, setDarkMode, i18n, onLogout }) {
  const { t } = useTranslation();
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

  function handleTryAgain() {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswers([]);
    setShowResults(false);
    setSubmitted(false);
  }

  if (isLoading || questions.length === 0) {
    return (
      <div className="quiz-wrap">
        <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />
        <div className="quiz-active quiz-active--loading">
          <div className="quiz-loading">{t("quiz.loading")}</div>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="quiz-wrap">
        <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />
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
                  <span className="quiz-badge-emoji">{levelData.badge}</span>
                  <span className="quiz-badge-name">{t("quiz.badgeEarned", { name: badgeName })}</span>
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
                      <span className="quiz-review-icon">{wasCorrect ? "✓" : "✗"}</span>
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
      </div>
    );
  }

  const opts = Array.isArray(currentQuestion.options)
    ? currentQuestion.options
    : JSON.parse(currentQuestion.options);

  return (
    <div className="quiz-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />
      <div className="quiz-active">
        {/* Level header */}
        <div className="quiz-level-header">
          <button className="quiz-back-btn" onClick={onBack}>{t("quiz.backToLevels")}</button>
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
                    <span className="quiz-option-indicator">✓</span>
                  )}
                  {isAnswered && idx === selectedIndex && idx !== currentQuestion.correct_index && (
                    <span className="quiz-option-indicator">✗</span>
                  )}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="quiz-next-wrap">
              <button className="quiz-btn quiz-btn--primary" onClick={handleNext}>
                {isLastQuestion ? t("quiz.seeResults") : t("quiz.next")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
