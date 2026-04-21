import { useEffect, useRef, useState } from "react";
import type { MeditatePayload, ExerciseResult } from "../../content";

interface Props {
  lessonId: string;
  exerciseId: string;
  payload: MeditatePayload;
  onComplete: (result: ExerciseResult) => void;
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Meditate({ lessonId, exerciseId, payload, onComplete }: Props) {
  const [responses, setResponses] = useState<string[]>(() => payload.prompts.map(() => ""));
  const [finished, setFinished] = useState(false);

  const [timerRunning, setTimerRunning] = useState(false);
  const [remaining, setRemaining] = useState<number>(payload.timerSeconds ?? 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!timerRunning) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimerRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning]);

  const filled = responses.filter((r) => r.trim().length > 0).length;
  const canFinish = filled >= Math.max(1, Math.ceil(payload.prompts.length / 2));

  function handleFinish() {
    // [SUPABASE HOOK] insert study_course_progress row: lesson_id, exercise_id, response_data=responses
    setFinished(true);
    onComplete({
      lessonId,
      exerciseId,
      completedAt: new Date().toISOString(),
      score: filled,
      responseData: responses,
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-jw-purple-soft)] bg-white p-5 sm:p-7 shadow-sm">
      {payload.introVerse && (
        <div className="mb-6 rounded-xl bg-[var(--color-jw-purple-soft)] p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-jw-purple-light)]">
            {payload.introVerse.citation}
          </p>
          <p className="text-lg italic leading-relaxed text-[var(--color-jw-purple-deep)] font-[var(--font-fraunces)]">
            {payload.introVerse.text}
          </p>
        </div>
      )}

      {payload.timerSeconds ? (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-[var(--color-jw-gold)]/40 bg-[var(--color-jw-gold)]/10 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-jw-purple-light)]">
              Optional meditation pause
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-[var(--color-jw-purple-deep)]">
              {fmt(remaining)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTimerRunning((v) => !v)}
              className="jw-focus-ring cursor-pointer rounded-full border border-[var(--color-jw-purple)] px-4 py-1.5 text-sm font-medium text-[var(--color-jw-purple)] transition-colors hover:bg-[var(--color-jw-purple)] hover:text-white"
            >
              {timerRunning ? "Pause" : remaining === 0 ? "Restart" : "Begin"}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setRemaining(payload.timerSeconds ?? 0);
              }}
              className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Reset
            </button>
          </div>
        </div>
      ) : null}

      <ol className="space-y-5">
        {payload.prompts.map((prompt, i) => (
          <li key={i}>
            <label
              htmlFor={`prompt-${i}`}
              className="mb-2 block text-sm font-medium text-slate-900 leading-relaxed"
            >
              <span className="mr-2 text-[var(--color-jw-purple-light)]">{i + 1}.</span>
              {prompt}
            </label>
            <textarea
              id={`prompt-${i}`}
              value={responses[i]}
              onChange={(e) => {
                const next = [...responses];
                next[i] = e.target.value;
                setResponses(next);
              }}
              rows={3}
              placeholder="Take your time…"
              className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-[var(--color-jw-purple-light)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-jw-purple-light)]/30"
            />
          </li>
        ))}
      </ol>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={!canFinish}
          onClick={handleFinish}
          className="jw-focus-ring inline-flex cursor-pointer items-center justify-center rounded-full bg-[var(--color-jw-purple)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-jw-purple-deep)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {finished ? "Saved" : "I've sat with it"}
        </button>
      </div>

      {finished && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          There's no grade here. What you just did — slowing down, asking honest questions —
          is the practice. Keep it up.
        </p>
      )}
    </div>
  );
}
