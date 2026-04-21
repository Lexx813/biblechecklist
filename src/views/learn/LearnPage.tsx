import { useCallback, useEffect, useMemo, useState } from "react";
import UnitCard from "./_components/UnitCard";
import LessonView from "./_components/LessonView";
import ProgressBar from "./_components/ProgressBar";
import type { ExerciseResult, Unit } from "./content";
import { findLesson, getStrings, getUnits, totalLessonCount } from "./content";
import { readLearnProgress, writeLearnProgress } from "./progressStore";

type ViewMode = { kind: "overview" } | { kind: "lesson"; lessonId: string };

interface LearnPageProps {
  onBack?: () => void;
}

export default function LearnPage({ onBack }: LearnPageProps) {
  const units: Unit[] = useMemo(() => getUnits("en"), []);
  const strings = getStrings("en");
  const total = totalLessonCount();

  const [view, setView] = useState<ViewMode>({ kind: "overview" });
  const [expandedUnit, setExpandedUnit] = useState<string | null>(units[0]?.id ?? null);

  // [SUPABASE HOOK] hydrate from study_course_progress (where user_id = auth.uid()) on mount
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    () => new Set(readLearnProgress().completed),
  );
  const [exerciseResults, setExerciseResults] = useState<Record<string, ExerciseResult>>({});

  useEffect(() => {
    writeLearnProgress({ completed: Array.from(completedLessons) });
  }, [completedLessons]);

  const allLessons = useMemo(() => units.flatMap((u) => u.lessons), [units]);
  const overallProgress = completedLessons.size / Math.max(1, total);

  const openLesson = useCallback((lessonId: string) => {
    setView({ kind: "lesson", lessonId });
  }, []);

  const backToOverview = useCallback(() => {
    setView({ kind: "overview" });
  }, []);

  const markLessonComplete = useCallback((lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
    // [SUPABASE HOOK] upsert study_course_progress: { user_id, lesson_id, completed_at: now() }
  }, []);

  const handleExerciseComplete = useCallback((result: ExerciseResult) => {
    setExerciseResults((prev) => ({ ...prev, [`${result.lessonId}:${result.exerciseId}`]: result }));
    // Completing the exercise also marks the lesson complete.
    setCompletedLessons((prev) => {
      if (prev.has(result.lessonId)) return prev;
      const next = new Set(prev);
      next.add(result.lessonId);
      return next;
    });
    // [SUPABASE HOOK] insert study_course_progress: { user_id, lesson_id, exercise_id, score, response_data, completed_at: now() }
  }, []);

  const goToNextLesson = useCallback(
    (currentLessonId: string) => {
      const idx = allLessons.findIndex((l) => l.id === currentLessonId);
      if (idx >= 0 && idx + 1 < allLessons.length) {
        setView({ kind: "lesson", lessonId: allLessons[idx + 1].id });
        // Expand the parent unit of the next lesson for when user returns to overview
        setExpandedUnit(allLessons[idx + 1].unitId);
      } else {
        setView({ kind: "overview" });
      }
    },
    [allLessons],
  );

  // Keep browser scroll at top when the view switches
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  if (view.kind === "lesson") {
    const lesson = findLesson(view.lessonId);
    if (lesson) {
      const unit = units.find((u) => u.id === lesson.unitId)!;
      const idx = allLessons.findIndex((l) => l.id === lesson.id);
      const hasNext = idx + 1 < allLessons.length;
      return (
        <div className="min-h-full bg-gradient-to-b from-[#f7f3ff] via-[#efe7ff] to-[#e7dcff] px-4 py-8 [html[data-theme=dark]_&]:from-[var(--color-jw-purple-deep)] [html[data-theme=dark]_&]:via-[#1e1237] [html[data-theme=dark]_&]:to-[#120a22] sm:px-6 sm:py-12">
          <LessonView
            unit={unit}
            lesson={lesson}
            isCompleted={completedLessons.has(lesson.id)}
            hasNext={hasNext}
            onBack={backToOverview}
            onMarkComplete={() => markLessonComplete(lesson.id)}
            onContinue={() => (hasNext ? goToNextLesson(lesson.id) : backToOverview())}
            onExerciseComplete={handleExerciseComplete}
          />
        </div>
      );
    }
  }

  return (
    <div className="relative bg-gradient-to-b from-jw-purple-deep via-[#1e1237] to-[#120a22] [html[data-theme=light]_&]:from-[#f7f3ff] [html[data-theme=light]_&]:via-[#efe7ff] [html[data-theme=light]_&]:to-[#e7dcff]">
      {/* Ambient decoration — clipped by hero to avoid long-page bleed */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px] opacity-40 [html[data-theme=dark]_&]:opacity-60"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 10%, rgba(201,169,97,0.18) 0%, transparent 35%), radial-gradient(circle at 85% 25%, rgba(107,74,163,0.35) 0%, transparent 45%)",
        }}
      />

      {/* Hero */}
      <header className="relative px-4 pb-10 pt-10 text-[var(--color-jw-purple-deep)] [html[data-theme=dark]_&]:text-white sm:px-8 sm:pb-14 sm:pt-14">
        <div className="relative mx-auto max-w-4xl">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="jw-focus-ring mb-6 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--color-jw-purple-deep)] ring-1 ring-slate-200 transition hover:bg-white [html[data-theme=dark]_&]:bg-white/[0.06] [html[data-theme=dark]_&]:text-white/75 [html[data-theme=dark]_&]:ring-white/15 [html[data-theme=dark]_&]:hover:bg-white/10 [html[data-theme=dark]_&]:hover:text-white"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                <path fillRule="evenodd" d="M12.7 14.7a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4l4-4a1 1 0 011.4 1.4L9.4 10l3.3 3.3a1 1 0 010 1.4z" clipRule="evenodd" />
              </svg>
              Back home
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="h-px w-8 bg-[var(--color-jw-gold)]/60" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-jw-gold)]">
              {strings.courseKicker}
            </p>
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--color-jw-purple-deep)] font-[var(--font-fraunces)] [html[data-theme=dark]_&]:text-white sm:text-5xl md:text-6xl">
            {strings.courseTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-700 [html[data-theme=dark]_&]:text-white/75 sm:text-lg">
            {strings.courseIntro}
          </p>

          {/* Progress strip */}
          <div className="mt-8 max-w-xl border border-slate-200 bg-white p-4 shadow-sm [html[data-theme=dark]_&]:border-white/10 [html[data-theme=dark]_&]:bg-[#1a1033] [html[data-theme=dark]_&]:shadow-none sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 [html[data-theme=dark]_&]:text-white/60">
                {strings.overallProgress}
              </p>
              <p className="text-xs font-semibold text-[var(--color-jw-gold)]">
                {completedLessons.size} / {total}
              </p>
            </div>
            <div className="mt-3">
              <ProgressBar value={overallProgress} tone="gold" />
            </div>
          </div>
        </div>
      </header>

      {/* Units */}
      <section className="relative mx-auto max-w-4xl px-4 pb-14 pt-4 sm:px-8 sm:pb-20 sm:pt-6">
        <div className="space-y-4">
          {units.map((u) => (
            <UnitCard
              key={u.id}
              unit={u}
              expanded={expandedUnit === u.id}
              onToggle={() => setExpandedUnit((prev) => (prev === u.id ? null : u.id))}
              onOpenLesson={openLesson}
              completedLessonIds={completedLessons}
            />
          ))}
        </div>

        {/* Closing benediction */}
        <div className="relative mt-12 overflow-hidden border border-slate-200 bg-white p-8 text-center shadow-sm [html[data-theme=dark]_&]:border-white/10 [html[data-theme=dark]_&]:bg-[#1a1033] [html[data-theme=dark]_&]:shadow-none sm:mt-16 sm:p-12">
          <div
            className="pointer-events-none absolute -top-12 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-[var(--color-jw-gold)]/20 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-jw-gold)]/15 ring-1 ring-[var(--color-jw-gold)]/40">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-[var(--color-jw-gold)]" aria-hidden>
                <path d="M10 2l1.8 4.6L16.5 8l-4 3.3 1.3 4.7L10 13.6l-3.8 2.4 1.3-4.7L3.5 8l4.7-1.4L10 2z" />
              </svg>
            </div>
            <p className="text-xl font-semibold italic leading-snug text-[var(--color-jw-purple-deep)] font-[var(--font-fraunces)] [html[data-theme=dark]_&]:text-white sm:text-2xl md:text-3xl">
              &ldquo;{strings.closingBenediction}&rdquo;
            </p>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-600 [html[data-theme=dark]_&]:text-white/65">
              Personal study is one of the greatest gifts a Bible student has.
              Don&apos;t let this course end here.
            </p>
            <button
              type="button"
              onClick={() => {
                const first = allLessons.find((l) => !completedLessons.has(l.id)) ?? allLessons[0];
                openLesson(first.id);
              }}
              className="jw-focus-ring mt-7 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--color-jw-gold)] px-7 py-3 text-sm font-semibold text-[var(--color-jw-purple-deep)] shadow-lg shadow-[var(--color-jw-gold)]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[var(--color-jw-gold)]/30"
            >
              {strings.closingCta}
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M7.3 5.3a1 1 0 011.4 0l4 4a1 1 0 010 1.4l-4 4a1 1 0 01-1.4-1.4L10.6 10 7.3 6.7a1 1 0 010-1.4z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
