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
      className={`jw-learn-card group/unit relative overflow-hidden transition-all ${
        expanded
          ? "jw-learn-card-border border shadow-sm"
          : "jw-learn-card-border border shadow-sm hover:shadow-md"
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
        <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center bg-[#7c3aed] text-lg font-bold text-white shadow-md shadow-black/20 font-[var(--font-fraunces)] sm:h-14 sm:w-14 sm:text-xl">
          {unit.number}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7c3aed]">
            Unit {unit.number}
          </p>
          <h2
            id={`unit-${unit.id}-heading`}
            className="mt-1 text-xl leading-tight font-[var(--font-fraunces)] sm:text-2xl"
          >
            {unit.title}
          </h2>
          <p className="jw-learn-card-muted mt-1.5 text-sm leading-relaxed">{unit.oneLine}</p>
          <div className="mt-3.5 flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar value={progress} size="sm" tone="gold" />
            </div>
            <p className="jw-learn-card-faint shrink-0 text-[11px] font-medium">
              {completed}/{unit.lessons.length} · {Math.round(progress * 100)}%
            </p>
          </div>
        </div>
        <svg
          className={`jw-learn-card-faint mt-1 h-5 w-5 flex-shrink-0 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
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
          <ol className="jw-learn-card-border border-t">
            {unit.lessons.map((lesson) => {
              const done = completedLessonIds.has(lesson.id);
              return (
                <li key={lesson.id} className="jw-learn-divider border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onOpenLesson(lesson.id)}
                    className="jw-learn-row-hover group/row jw-focus-ring-rect relative flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors sm:px-6"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                        done
                          ? "bg-emerald-500/90 text-white"
                          : "bg-[#7c3aed]/15 text-[#7c3aed] ring-1 ring-[#7c3aed]/30 group-hover/row:bg-[#7c3aed] group-hover/row:text-white group-hover/row:ring-[#7c3aed] dark:bg-[#a78bfa]/15 dark:text-[#d8b4fe] dark:ring-[#a78bfa]/40 dark:group-hover/row:bg-[#a78bfa] dark:group-hover/row:text-[#1a1033] dark:group-hover/row:ring-[#a78bfa]"
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
                      <p className="truncate text-sm font-semibold transition-colors group-hover/row:text-[#7c3aed] dark:group-hover/row:text-[#a78bfa]">
                        {lesson.title}
                      </p>
                      <p className="jw-learn-card-faint mt-0.5 line-clamp-1 text-xs">
                        {lesson.oneLine}
                      </p>
                    </div>
                    <div className="jw-learn-card-faint hidden shrink-0 items-center gap-1 text-[11px] font-medium sm:flex">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.3.7l2.5 2.5a1 1 0 001.4-1.4L11 9.6V6z" clipRule="evenodd" />
                      </svg>
                      {lesson.readingMinutes} min
                    </div>
                    <svg
                      className="jw-learn-card-faint h-4 w-4 flex-shrink-0 transition-all group-hover/row:translate-x-0.5 group-hover/row:text-[#7c3aed] dark:group-hover/row:text-[#a78bfa]"
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
