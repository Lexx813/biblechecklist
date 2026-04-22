import { useState } from "react";
import type { QuestionLadderPayload, ExerciseResult } from "../../content";

interface Props {
  lessonId: string;
  exerciseId: string;
  payload: QuestionLadderPayload;
  onComplete: (result: ExerciseResult) => void;
}

const rungLabels: Record<string, string> = {
  who: "Who",
  what: "What",
  when_where: "When / Where",
  why: "Why",
  how: "How it applies",
};

export default function QuestionLadder({ lessonId, exerciseId, payload, onComplete }: Props) {
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
    <div className="rounded-2xl border border-[var(--color-jw-purple-soft)] bg-white p-5 sm:p-7 shadow-sm dark:border-white/10 dark:bg-[#1a1033]">
      <div className="mb-6 rounded-xl bg-[var(--color-jw-purple-soft)] p-4 dark:bg-white/5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-jw-purple-light)] dark:text-[#c4b5fd]">
          {payload.verseCitation}
        </p>
        <p className="text-lg italic leading-relaxed text-[var(--color-jw-purple-deep)] font-[var(--font-fraunces)] dark:text-white">
          {payload.verseText}
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
                      ? "bg-[var(--color-jw-purple)] text-white"
                      : "bg-[var(--color-jw-purple-soft)] text-[var(--color-jw-purple)]"
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
                    <span className="text-[var(--color-jw-purple)] dark:text-[#c4b5fd]">{rungLabels[rung.key]}</span>{" "}
                    — {rung.prompt}
                  </label>
                  <textarea
                    id={`rung-${rung.key}`}
                    value={value}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [rung.key]: e.target.value }))
                    }
                    rows={2}
                    placeholder="Type your answer…"
                    className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-[var(--color-jw-purple-light)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-jw-purple-light)]/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:bg-white/10"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setRevealed((prev) => ({ ...prev, [rung.key]: !isRevealed }))
                      }
                      className={`jw-focus-ring group inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        isRevealed
                          ? "bg-jw-purple-soft text-jw-purple-deep hover:bg-jw-purple-soft/80"
                          : "text-jw-purple hover:bg-jw-purple-soft/60"
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
                      {isRevealed ? "Hide hint" : "Need a hint?"}
                    </button>
                  </div>
                  {isRevealed && (
                    <p className="mt-2 rounded-md border border-amber-300/40 bg-amber-50 px-3 py-2 text-sm text-slate-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100/90">
                      <span className="font-medium text-[var(--color-jw-purple-deep)] dark:text-amber-200">Hint:</span>{" "}
                      {rung.hint}
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
          {filledCount} of {payload.rungs.length} rungs answered
        </p>
        <button
          type="button"
          disabled={!canComplete}
          onClick={handleComplete}
          className="jw-focus-ring inline-flex cursor-pointer items-center justify-center rounded-full bg-[var(--color-jw-purple)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-jw-purple-deep)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitted ? "Saved" : "I've climbed the ladder"}
        </button>
      </div>

      {submitted && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100">
          Good work. Take a breath. The questions you just asked are the questions a careful
          student keeps asking for the rest of their life.
        </p>
      )}
    </div>
  );
}
