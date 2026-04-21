import { useState } from "react";
import type { CrossReferenceQuizPayload, ExerciseResult } from "../../content";

interface Props {
  lessonId: string;
  exerciseId: string;
  payload: CrossReferenceQuizPayload;
  onComplete: (result: ExerciseResult) => void;
}

interface Answer {
  questionId: string;
  optionId: string;
  correct: boolean;
}

export default function CrossReferenceQuiz({ lessonId, exerciseId, payload, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finished, setFinished] = useState(false);

  const total = payload.questions.length;
  const q = payload.questions[index];
  const answered = selected !== null;
  const isCorrect = answered && selected === q.correctOptionId;

  function handleSelect(optionId: string) {
    if (selected) return;
    setSelected(optionId);
    setAnswers((prev) => [
      ...prev,
      { questionId: q.id, optionId, correct: optionId === q.correctOptionId },
    ]);
  }

  function handleNext() {
    if (index + 1 < total) {
      setIndex(index + 1);
      setSelected(null);
    } else {
      const score = answers.filter((a) => a.correct).length;
      setFinished(true);
      // [SUPABASE HOOK] insert study_course_progress row: lesson_id, exercise_id, score, response_data=answers
      onComplete({
        lessonId,
        exerciseId,
        completedAt: new Date().toISOString(),
        score,
        responseData: answers,
      });
    }
  }

  const correctCount = answers.filter((a) => a.correct).length;

  if (finished) {
    const verdict =
      correctCount === total
        ? "A clean sweep. You know your library."
        : correctCount >= Math.ceil(total * 0.6)
        ? "Well done. You've got the instincts."
        : "A fair start. Revisit the lesson once more — the instincts will come.";
    return (
      <div className="rounded-2xl border border-[var(--color-jw-purple-soft)] bg-white p-6 sm:p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-jw-purple-light)]">
          Result
        </p>
        <p className="mt-2 text-4xl font-semibold text-[var(--color-jw-purple-deep)] font-[var(--font-fraunces)]">
          {correctCount} / {total}
        </p>
        <p className="mt-3 text-slate-700">{verdict}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-jw-purple-soft)] bg-white p-5 sm:p-7 shadow-sm">
      <div className="mb-5 flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium uppercase tracking-wider text-[var(--color-jw-purple-light)]">
          Question {index + 1} / {total}
        </span>
        <span>
          Score: {correctCount} / {answers.length}
        </span>
      </div>

      <p className="mb-5 text-xs text-slate-500">{payload.intro}</p>

      <p className="mb-6 text-lg leading-relaxed text-[var(--color-jw-purple-deep)] font-[var(--font-fraunces)]">
        {q.scenario}
      </p>

      <div className="space-y-2.5">
        {q.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isRight = opt.id === q.correctOptionId;
          let stateClass = "border-slate-200 hover:border-[var(--color-jw-purple-light)] hover:bg-[var(--color-jw-purple-soft)]/40";
          if (answered) {
            if (isSelected && isRight)
              stateClass = "border-emerald-400 bg-emerald-50 text-emerald-900";
            else if (isSelected && !isRight)
              stateClass = "border-rose-300 bg-rose-50 text-rose-900";
            else if (isRight)
              stateClass = "border-emerald-300 bg-emerald-50/50 text-emerald-800";
            else stateClass = "border-slate-200 opacity-60";
          }
          return (
            <button
              key={opt.id}
              type="button"
              disabled={answered}
              onClick={() => handleSelect(opt.id)}
              className={`jw-focus-ring-rect w-full cursor-pointer rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed ${stateClass}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className={`mt-5 rounded-lg px-4 py-3 text-sm leading-relaxed ${
            isCorrect ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-semibold">
            {isCorrect ? "Right." : "Not quite."}
          </p>
          <p className="mt-1">{q.explanation}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={!answered}
          onClick={handleNext}
          className="jw-focus-ring inline-flex cursor-pointer items-center justify-center rounded-full bg-[var(--color-jw-purple)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-jw-purple-deep)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {index + 1 < total ? "Next question" : "See result"}
        </button>
      </div>
    </div>
  );
}
