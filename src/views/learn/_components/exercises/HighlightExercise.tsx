import { useMemo, useReducer } from "react";
import type {
  HighlightCategory,
  HighlightExercisePayload,
  ExerciseResult,
} from "../../content";
import { highlightCategoryColors, getStrings } from "../../content";

interface Props {
  lessonId: string;
  exerciseId: string;
  payload: HighlightExercisePayload;
  onComplete: (result: ExerciseResult) => void;
}

type TokenState = Record<number, HighlightCategory | null>;

type Action =
  | { type: "setActive"; category: HighlightCategory | null }
  | { type: "tag"; index: number }
  | { type: "clear" };

interface State {
  active: HighlightCategory | null;
  tokens: TokenState;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setActive":
      return { ...state, active: action.category };
    case "tag": {
      if (!state.active) return state;
      const current = state.tokens[action.index];
      const next: TokenState = { ...state.tokens };
      next[action.index] = current === state.active ? null : state.active;
      return { ...state, tokens: next };
    }
    case "clear":
      return { active: null, tokens: {} };
    default:
      return state;
  }
}

const CATEGORIES: HighlightCategory[] = [
  "promise",
  "command",
  "warning",
  "quality",
  "reference",
];

export default function HighlightExercise({ lessonId, exerciseId, payload, onComplete }: Props) {
  const strings = getStrings();
  const [state, dispatch] = useReducer(reducer, { active: null, tokens: {} });

  const tally = useMemo(() => {
    const t: Record<HighlightCategory, number> = {
      promise: 0,
      command: 0,
      warning: 0,
      quality: 0,
      reference: 0,
    };
    for (const v of Object.values(state.tokens)) {
      if (v) t[v] += 1;
    }
    return t;
  }, [state.tokens]);

  const totalTagged = Object.values(tally).reduce((a, b) => a + b, 0);
  const canFinish = totalTagged >= 5;

  function handleComplete() {
    // [SUPABASE HOOK] insert study_course_progress row: lesson_id, exercise_id, score=totalTagged, response_data=state.tokens
    onComplete({
      lessonId,
      exerciseId,
      completedAt: new Date().toISOString(),
      score: totalTagged,
      responseData: state.tokens,
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-jw-purple-soft)] bg-white p-5 sm:p-7 shadow-sm">
      <p className="text-sm text-[var(--color-jw-purple-light)] font-medium mb-2">
        {payload.passageCitation}
      </p>
      <p className="text-xs text-slate-500 italic mb-5">{payload.passageSource}</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const c = highlightCategoryColors[cat];
          const isActive = state.active === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => dispatch({ type: "setActive", category: isActive ? null : cat })}
              className={`jw-focus-ring group inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? `${c.bg} ${c.text} ring-2 ${c.ring} border-transparent`
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
              aria-pressed={isActive}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
              {strings.categories[cat]}
              <span className="text-xs text-slate-500">{tally[cat]}</span>
            </button>
          );
        })}
      </div>

      <p className="mb-3 text-xs text-slate-500">
        {state.active
          ? `Tap a word or phrase to tag it as "${strings.categories[state.active]}". Tap again to remove.`
          : "Pick a highlighter above, then tap words in the passage."}
      </p>

      <div className="rounded-xl bg-[var(--color-jw-purple-soft)] p-5 leading-9 text-lg text-slate-900 select-none font-[var(--font-fraunces)]">
        {payload.tokens.map((tok, i) => {
          const cat = state.tokens[i];
          const c = cat ? highlightCategoryColors[cat] : null;
          return (
            <span
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => dispatch({ type: "tag", index: i })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  dispatch({ type: "tag", index: i });
                }
              }}
              className={`inline cursor-pointer rounded-md px-1 py-0.5 transition ${
                c ? `${c.bg} ${c.text}` : "hover:bg-white/60"
              }`}
            >
              {tok}
              {i < payload.tokens.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => dispatch({ type: "clear" })}
          className="jw-focus-ring group inline-flex cursor-pointer items-center gap-1.5 self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 transition-transform group-hover:rotate-12"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M8.75 2.75A.75.75 0 019.5 2h1a.75.75 0 01.75.75V3h3.25a.75.75 0 010 1.5h-.44l-.78 11.13A2 2 0 0111.29 17.5H8.71a2 2 0 01-1.99-1.87L5.94 4.5H5.5a.75.75 0 010-1.5h3.25v-.25zM7.45 4.5l.77 11.03a.5.5 0 00.5.47h2.56a.5.5 0 00.5-.47L12.55 4.5h-5.1zM9 7a.5.5 0 01.5.5v6a.5.5 0 01-1 0v-6A.5.5 0 019 7zm2.5.5a.5.5 0 00-1 0v6a.5.5 0 001 0v-6z"
              clipRule="evenodd"
            />
          </svg>
          Clear all
        </button>
        <button
          type="button"
          disabled={!canFinish}
          onClick={handleComplete}
          className="jw-focus-ring inline-flex cursor-pointer items-center justify-center rounded-full bg-[var(--color-jw-purple)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-jw-purple-deep)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {canFinish ? "I've marked the paragraph" : `Tag at least 5 (currently ${totalTagged})`}
        </button>
      </div>

      <details className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-700">Show a guide for this paragraph</summary>
        <ul className="mt-3 space-y-1.5">
          {payload.guide.map((g, i) => {
            const c = highlightCategoryColors[g.category];
            return (
              <li key={i} className="flex items-start gap-2">
                <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${c.dot}`} />
                <span>{g.hint}</span>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
