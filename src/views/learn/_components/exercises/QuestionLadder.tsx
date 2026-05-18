import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { QuestionLadderPayload, ExerciseResult } from "../../content";

interface Props {
  lessonId: string;
  exerciseId: string;
  payload: QuestionLadderPayload;
  onComplete: (result: ExerciseResult) => void;
}

export default function QuestionLadder({ lessonId, exerciseId, payload, onComplete }: Props) {
  const { t } = useTranslation();
  const rungLabels: Record<string, string> = {
    who: t("learn.exercises.questionLadder.rungs.who"),
    what: t("learn.exercises.questionLadder.rungs.what"),
    when_where: t("learn.exercises.questionLadder.rungs.whenWhere"),
    why: t("learn.exercises.questionLadder.rungs.why"),
    how: t("learn.exercises.questionLadder.rungs.how"),
  };
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const filledCount = Object.values(answers).filter((v) => v.trim().length > 0).length;
  const canComplete = filledCount >= payload.rungs.length;

  function handleComplete() {
    // [SUPABASE HOOK] insert study_course_progress row: lesson_id, exercise_id, response_data=answers
    setSubmitted(true);
    onComplete({
      lessonId,
      exerciseId,
      completedAt: new Date().toISOString(),
      score: filledCount,
      responseData: answers,
    });
  }

  return (
    <div className="rounded-md border border-violet-100 bg-white p-5 sm:p-7 shadow-sm dark:border-white/10 dark:bg-[#1a1033]">
      <div className="mb-6 rounded-md bg-violet-50 p-4 dark:bg-white/5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
          {payload.verseCitation}
        </p>
        <p className="text-lg leading-relaxed text-violet-900 dark:text-white">
          {t(payload.verseTextKey)}
        </p>
      </div>

      <ol className="space-y-4">
        {payload.rungs.map((rung, i) => {
          const value = answers[rung.key] ?? "";
          const isFilled = value.trim().length > 0;
          const isRevealed = revealed[rung.key];
          return (
            <li key={rung.key} className="relative">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                    isFilled
                      ? "bg-violet-600 text-white"
                      : "bg-violet-50 text-violet-600"
                  }`}
                  aria-hidden
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <label
                    htmlFor={`rung-${rung.key}`}
                    className="mb-1 block text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    <span className="text-violet-600 dark:text-violet-300">{rungLabels[rung.key]}</span>{" "}
                    {t(rung.promptKey)}
                  </label>
                  <textarea
                    id={`rung-${rung.key}`}
                    value={value}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [rung.key]: e.target.value }))
                    }
                    rows={2}
                    placeholder={t("learn.exercises.questionLadder.placeholder")}
                    className="w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-violet-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:bg-white/10"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setRevealed((prev) => ({ ...prev, [rung.key]: !isRevealed }))
                      }
                      className={`jw-focus-ring group inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        isRevealed
                          ? "bg-violet-50 text-violet-900 hover:bg-violet-50/80"
                          : "text-violet-600 hover:bg-violet-50/60"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5 opacity-80 transition-transform group-hover:scale-110"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 2a6 6 0 00-3.5 10.87V14a1.5 1.5 0 001.5 1.5h4A1.5 1.5 0 0013.5 14v-1.13A6 6 0 0010 2zM8 17a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {isRevealed ? t("learn.exercises.questionLadder.hideHint") : t("learn.exercises.questionLadder.needHint")}
                    </button>
                  </div>
                  {isRevealed && (
                    <p className="mt-2 rounded-md border border-amber-300/40 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100/90">
                      <span className="font-medium text-violet-900 dark:text-amber-200">{t("learn.exercises.questionLadder.hintLabel")}</span>{" "}
                      {t(rung.hintKey)}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-white/55">
          {t("learn.exercises.questionLadder.rungsAnswered", { filled: filledCount, total: payload.rungs.length })}
        </p>
        <button
          type="button"
          disabled={!canComplete}
          onClick={handleComplete}
          className="jw-focus-ring inline-flex cursor-pointer items-center justify-center rounded-md bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitted ? t("learn.exercises.questionLadder.saved") : t("learn.exercises.questionLadder.completeButton")}
        </button>
      </div>

      {submitted && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100">
          {t("learn.exercises.questionLadder.completedMessage")}
        </p>
      )}
    </div>
  );
}
