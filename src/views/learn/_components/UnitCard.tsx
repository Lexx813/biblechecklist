import type { Unit } from "../content";
import ProgressBar from "./ProgressBar";

interface Props {
  unit: Unit;
  expanded: boolean;
  onToggle: () => void;
  onOpenLesson: (lessonId: string) => void;
  completedLessonIds: Set<string>;
}

export default function UnitCard({ unit, expanded, onToggle, onOpenLesson, completedLessonIds }: Props) {
  const completed = unit.lessons.filter((l) => completedLessonIds.has(l.id)).length;
  const progress = completed / unit.lessons.length;

  return (
    <section
      className={`group/unit relative overflow-hidden rounded-xl bg-[#1a1033] transition-all [html[data-theme=light]_&]:bg-white ${
        expanded
          ? "border border-jw-gold/40 shadow-md shadow-black/30 [html[data-theme=light]_&]:border-jw-gold/60 [html[data-theme=light]_&]:shadow-(--color-jw-gold)/10"
          : "border border-white/10 hover:border-white/20 [html[data-theme=light]_&]:border-slate-200 [html[data-theme=light]_&]:shadow-sm [html[data-theme=light]_&]:hover:border-slate-300 [html[data-theme=light]_&]:hover:shadow-md"
      }`}
      aria-labelledby={`unit-${unit.id}-heading`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="jw-focus-ring-rect relative flex w-full cursor-pointer items-start gap-4 p-5 text-left sm:gap-5 sm:p-6"
        aria-expanded={expanded}
        aria-controls={`unit-${unit.id}-lessons`}
      >
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-jw-gold)] to-[#b08d45] text-lg font-bold text-[var(--color-jw-purple-deep)] shadow-md shadow-black/30 font-[var(--font-fraunces)] sm:h-14 sm:w-14 sm:text-xl">
          {unit.number}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-jw-gold)]/90">
            Unit {unit.number}
          </p>
          <h2
            id={`unit-${unit.id}-heading`}
            className="mt-1 text-xl leading-tight text-[var(--color-jw-purple-deep)] font-[var(--font-fraunces)] [html[data-theme=dark]_&]:text-white sm:text-2xl"
          >
            {unit.title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600 [html[data-theme=dark]_&]:text-white/65">{unit.oneLine}</p>
          <div className="mt-3.5 flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar value={progress} size="sm" tone="gold" />
            </div>
            <p className="shrink-0 text-[11px] font-medium text-slate-500 [html[data-theme=dark]_&]:text-white/55">
              {completed}/{unit.lessons.length} · {Math.round(progress * 100)}%
            </p>
          </div>
        </div>
        <svg
          className={`mt-1 h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-300 group-hover/unit:text-slate-600 [html[data-theme=dark]_&]:text-white/50 [html[data-theme=dark]_&]:group-hover/unit:text-white/80 ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        id={`unit-${unit.id}-lessons`}
        className={`grid transition-all duration-300 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <ol className="border-t border-slate-100 [html[data-theme=dark]_&]:border-white/5">
            {unit.lessons.map((lesson) => {
              const done = completedLessonIds.has(lesson.id);
              return (
                <li key={lesson.id} className="border-b border-slate-50 last:border-b-0 [html[data-theme=dark]_&]:border-white/5">
                  <button
                    type="button"
                    onClick={() => onOpenLesson(lesson.id)}
                    className="group/row jw-focus-ring-rect relative flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50 [html[data-theme=dark]_&]:hover:bg-white/[0.04] sm:px-6"
                  >
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                        done
                          ? "bg-emerald-500/90 text-white ring-1 ring-emerald-300/40"
                          : "bg-slate-100 text-slate-700 ring-1 ring-slate-200 [html[data-theme=dark]_&]:bg-white/[0.06] [html[data-theme=dark]_&]:text-white/80 [html[data-theme=dark]_&]:ring-white/15 group-hover/row:bg-[var(--color-jw-gold)]/15 group-hover/row:text-[var(--color-jw-gold)] group-hover/row:ring-[var(--color-jw-gold)]/30"
                      }`}
                      aria-hidden
                    >
                      {done ? (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path
                            fillRule="evenodd"
                            d="M16.7 5.3a1 1 0 010 1.4l-7.9 7.9a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4l3.3 3.3 7.2-7.2a1 1 0 011.4 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        lesson.number
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--color-jw-purple-deep)] transition-colors [html[data-theme=dark]_&]:text-white group-hover/row:text-[var(--color-jw-gold)] [html[data-theme=dark]_&]:group-hover/row:text-[var(--color-jw-gold)]">
                        {lesson.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 [html[data-theme=dark]_&]:text-white/55">
                        {lesson.oneLine}
                      </p>
                    </div>
                    <div className="hidden shrink-0 items-center gap-1 text-[11px] font-medium text-slate-400 [html[data-theme=dark]_&]:text-white/45 sm:flex">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.3.7l2.5 2.5a1 1 0 001.4-1.4L11 9.6V6z" clipRule="evenodd" />
                      </svg>
                      {lesson.readingMinutes} min
                    </div>
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-slate-300 transition-all [html[data-theme=dark]_&]:text-white/30 group-hover/row:translate-x-0.5 group-hover/row:text-[var(--color-jw-gold)] [html[data-theme=dark]_&]:group-hover/row:text-[var(--color-jw-gold)]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.3 5.3a1 1 0 011.4 0l4 4a1 1 0 010 1.4l-4 4a1 1 0 01-1.4-1.4L10.6 10 7.3 6.7a1 1 0 010-1.4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
