import { useEffect, useMemo, useRef, useState } from "react";
import type { ExerciseResult, Lesson, Unit } from "../content";
import { getStrings } from "../content";
import HighlightExercise from "./exercises/HighlightExercise";
import QuestionLadder from "./exercises/QuestionLadder";
import CrossReferenceQuiz from "./exercises/CrossReferenceQuiz";
import SoapNote from "./exercises/SoapNote";
import Meditate from "./exercises/Meditate";

interface Props {
  unit: Unit;
  lesson: Lesson;
  isCompleted: boolean;
  hasNext: boolean;
  onBack: () => void;
  onMarkComplete: () => void;
  onContinue: () => void;
  onExerciseComplete: (result: ExerciseResult) => void;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export default function LessonView({
  unit,
  lesson,
  isCompleted,
  hasNext,
  onBack,
  onMarkComplete,
  onContinue,
  onExerciseComplete,
}: Props) {
  const strings = getStrings();
  const topRef = useRef<HTMLDivElement>(null);
  const exerciseRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const totalParas = lesson.body.length;
  const [revealed, setRevealed] = useState<Set<number>>(
    () => new Set([0]),
  );

  // Reset on lesson change; if reduced motion, reveal all instantly.
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    if (reducedMotion) {
      setRevealed(new Set(Array.from({ length: totalParas }, (_, i) => i)));
    } else {
      setRevealed(new Set([0]));
    }
  }, [lesson.id, reducedMotion, totalParas]);

  useEffect(() => {
    if (reducedMotion) return;
    if (typeof window === "undefined") return;
    if (!("IntersectionObserver" in window)) return;
    const paras = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-lesson-para][data-lesson-id="${lesson.id}"]`),
    );
    if (!paras.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        setRevealed((prev) => {
          const next = new Set(prev);
          for (const e of entries) {
            if (e.isIntersecting) {
              const idx = Number(e.target.getAttribute("data-lesson-para"));
              next.add(idx);
              io.unobserve(e.target);
            }
          }
          return next;
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    paras.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, [lesson.id, reducedMotion]);

  const firstParagraphIndex = useMemo(
    () => lesson.body.findIndex((b) => b.kind === "p"),
    [lesson.body],
  );

  const skipToExercise = () => {
    exerciseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    exerciseRef.current?.focus?.({ preventScroll: true });
  };

  return (
    <article
      ref={topRef}
      className="jw-course-surface mx-auto w-full max-w-3xl rounded-2xl px-5 py-8 sm:px-8 sm:py-10"
    >
      {/* Top bar: back + skip to exercise */}
      <div className="mb-5 flex items-center justify-between gap-2 text-sm">
        <button
          type="button"
          onClick={onBack}
          className="jw-focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-jw-purple-soft)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-jw-purple)] transition-colors hover:border-[var(--color-jw-purple-light)] hover:bg-[var(--color-jw-purple-soft)]/40"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M12.7 14.7a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4l4-4a1 1 0 111.4 1.4L9.4 10l3.3 3.3a1 1 0 010 1.4z"
              clipRule="evenodd"
            />
          </svg>
          {strings.backToCourse}
        </button>
        <SkipToExerciseButton
          progress={totalParas > 0 ? revealed.size / totalParas : 0}
          onClick={skipToExercise}
        />
      </div>

      {/* Breadcrumb */}
      <p className="mb-3 text-xs text-slate-500" aria-label="Breadcrumb">
        {strings.unitLabel} {unit.number} · {unit.title}
      </p>

      {/* Header */}
      <header className="mb-8 border-b border-[var(--color-jw-purple-soft)] pb-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-jw-gold)]">
          {strings.lessonLabel} {lesson.number} · {lesson.readingMinutes} {strings.minRead}
        </p>
        <h1 className="mt-3 text-[clamp(28px,4.5vw,42px)] font-semibold leading-tight text-[var(--color-jw-purple-deep)] font-[var(--font-fraunces)]">
          {lesson.title}
        </h1>
        <p className="mt-3 max-w-[58ch] text-lg italic leading-relaxed text-slate-600 font-[var(--font-fraunces)]">
          {lesson.oneLine}
        </p>
      </header>

      {/* Body */}
      <div className="space-y-5 text-slate-800">
        {lesson.body.map((block, i) => {
          const shown = revealed.has(i);
          const revealClass = `jw-reveal transition-all duration-500 ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`;
          const commonAttrs = {
            "data-lesson-para": i,
            "data-lesson-id": lesson.id,
          } as const;

          if (block.kind === "p") {
            const isFirst = i === firstParagraphIndex;
            return (
              <p
                key={i}
                {...commonAttrs}
                className={`text-[17px] leading-[1.85] text-slate-800 sm:text-lg ${isFirst ? "jw-dropcap" : ""} ${revealClass}`}
              >
                {block.text}
              </p>
            );
          }
          if (block.kind === "h3") {
            return (
              <h3
                key={i}
                {...commonAttrs}
                className={`pt-3 text-xl font-semibold text-[var(--color-jw-purple-deep)] font-[var(--font-fraunces)] ${revealClass}`}
              >
                {block.text}
              </h3>
            );
          }
          if (block.kind === "blockquote") {
            return (
              <blockquote
                key={i}
                {...commonAttrs}
                className={`my-2 rounded-r-lg border-l-4 border-[var(--color-jw-gold)] bg-[var(--color-jw-purple-soft)]/70 py-4 pl-5 pr-3 ${revealClass}`}
              >
                <p className="text-lg italic leading-relaxed text-[var(--color-jw-purple-deep)] font-[var(--font-fraunces)]">
                  &ldquo;{block.text}&rdquo;
                </p>
                {block.cite && (
                  <cite className="mt-2 block text-sm not-italic font-medium text-[var(--color-jw-purple-light)]">
                    — {block.cite}
                  </cite>
                )}
              </blockquote>
            );
          }
          if (block.kind === "list") {
            return (
              <ul key={i} {...commonAttrs} className={`ml-1 space-y-2 ${revealClass}`}>
                {block.items.map((item, j) => (
                  <li key={j} className="relative pl-6 text-[17px] leading-[1.75] text-slate-800">
                    <span
                      className="absolute left-0 top-[0.7em] h-1.5 w-1.5 rounded-full bg-[var(--color-jw-gold)]"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            );
          }
          return null;
        })}
      </div>

      {/* Exercise */}
      <section
        ref={exerciseRef}
        tabIndex={-1}
        className="mt-12 focus:outline-none"
        aria-labelledby="exercise-heading"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--color-jw-purple-soft)]" />
          <p
            id="exercise-heading"
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-jw-gold)]"
          >
            {strings.exerciseHeading}
          </p>
          <span className="h-px flex-1 bg-[var(--color-jw-purple-soft)]" />
        </div>
        <h2 className="mb-5 text-2xl font-semibold text-[var(--color-jw-purple-deep)] font-[var(--font-fraunces)]">
          {lesson.exercise.title}
        </h2>
        <ExerciseRouter
          lessonId={lesson.id}
          exerciseId={lesson.exercise.id}
          payload={lesson.exercise.payload}
          onComplete={onExerciseComplete}
        />
      </section>

      {/* Bottom action bar */}
      <div className="sticky bottom-3 mt-12 flex flex-col gap-3 rounded-2xl border border-[var(--color-jw-purple-soft)] bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <button
          type="button"
          onClick={onMarkComplete}
          aria-pressed={isCompleted}
          className={`jw-focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition-colors ${
            isCompleted
              ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              : "border-[var(--color-jw-purple-light)] bg-white text-[var(--color-jw-purple)] hover:bg-[var(--color-jw-purple-soft)]/60"
          }`}
        >
          {isCompleted ? (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 010 1.4l-7.9 7.9a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4l3.3 3.3 7.2-7.2a1 1 0 011.4 0z"
                  clipRule="evenodd"
                />
              </svg>
              {strings.completed}
            </>
          ) : (
            strings.markComplete
          )}
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="jw-focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--color-jw-purple)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-jw-purple-deep)]"
        >
          {hasNext ? strings.continue : strings.backToCourse}
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M7.3 5.3a1 1 0 011.4 0l4 4a1 1 0 010 1.4l-4 4a1 1 0 01-1.4-1.4L10.6 10 7.3 6.7a1 1 0 010-1.4z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </article>
  );
}

function SkipToExerciseButton({
  progress,
  onClick,
}: {
  progress: number;
  onClick: () => void;
}) {
  const pct = Math.max(0, Math.min(1, progress));
  const isReady = pct >= 0.85;
  const r = 7;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  const pctLabel = Math.round(pct * 100);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Skip to exercise. ${pctLabel}% read.`}
      className={`jw-focus-ring group hidden cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all sm:inline-flex ${
        isReady
          ? "border-jw-gold/40 bg-linear-to-r from-jw-gold/15 to-jw-purple-soft/60 text-jw-purple-deep hover:shadow-md"
          : "border-jw-purple-soft bg-white text-jw-purple hover:border-jw-purple-light hover:bg-jw-purple-soft/40"
      }`}
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <svg viewBox="0 0 20 20" className="h-5 w-5 -rotate-90" aria-hidden>
          <circle
            cx="10"
            cy="10"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeWidth="2"
          />
          <circle
            cx="10"
            cy="10"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-500 ease-out"
          />
        </svg>
        {isReady && (
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="absolute h-3 w-3"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 010 1.4l-7.9 7.9a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4l3.3 3.3 7.2-7.2a1 1 0 011.4 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
      <span>{isReady ? "Ready — go to exercise" : "Skip to exercise"}</span>
      <span className="tabular-nums text-[10px] font-medium opacity-60">
        {pctLabel}%
      </span>
    </button>
  );
}

function ExerciseRouter(props: {
  lessonId: string;
  exerciseId: string;
  payload: Lesson["exercise"]["payload"];
  onComplete: (r: ExerciseResult) => void;
}) {
  const { payload } = props;
  switch (payload.kind) {
    case "highlight":
      return <HighlightExercise {...props} payload={payload} />;
    case "ladder":
      return <QuestionLadder {...props} payload={payload} />;
    case "crossref":
      return <CrossReferenceQuiz {...props} payload={payload} />;
    case "soap":
      return <SoapNote {...props} payload={payload} />;
    case "meditate":
      return <Meditate {...props} payload={payload} />;
    default:
      return null;
  }
}
