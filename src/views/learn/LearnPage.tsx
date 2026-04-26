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
        <div className="min-h-full bg-gradient-to-b from-[#f7f3ff] via-[#efe7ff] to-[#e7dcff] px-4 py-8 dark:from-[var(--color-jw-purple-deep)] dark:via-[#1e1237] dark:to-[#120a22] sm:px-6 sm:py-12">
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
    <div className="relative bg-gradient-to-b from-[#f7f3ff] via-[#efe7ff] to-[#e7dcff] dark:from-jw-purple-deep dark:via-[#1e1237] dark:to-[#120a22]">
      {/* Ambient decoration, clipped by hero to avoid long-page bleed */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px] opacity-40 dark:opacity-60"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 10%, rgba(201,169,97,0.18) 0%, transparent 35%), radial-gradient(circle at 85% 25%, rgba(107,74,163,0.35) 0%, transparent 45%)",
        }}
      />

      {/* Hero */}
      <header className="relative px-4 pb-10 pt-10 text-[var(--color-jw-purple-deep)] dark:text-white sm:px-8 sm:pb-14 sm:pt-14">
        <div className="relative mx-auto max-w-4xl">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="jw-focus-ring mb-6 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--color-jw-purple-deep)] ring-1 ring-slate-200 transition hover:bg-white dark:bg-white/[0.06] dark:text-white/75 dark:ring-white/15 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                <path fillRule="evenodd" d="M12.7 14.7a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4l4-4a1 1 0 011.4 1.4L9.4 10l3.3 3.3a1 1 0 010 1.4z" clipRule="evenodd" />
              </svg>
              Back home
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="h-px w-8 bg-[#7c3aed]/60 dark:bg-white/60" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7c3aed] dark:text-white">
              {strings.courseKicker}
            </p>
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--color-jw-purple-deep)] font-[var(--font-fraunces)] dark:text-white sm:text-5xl md:text-6xl">
            {strings.courseTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-white/75 sm:text-lg">
            {strings.courseIntro}
          </p>

          {/* Progress strip */}
          <div className="jw-learn-card jw-learn-card-border mt-8 max-w-xl border p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="jw-learn-card-faint text-xs font-medium uppercase tracking-[0.18em]">
                {strings.overallProgress}
              </p>
              <p className="text-xs font-semibold text-[#7c3aed] dark:text-white">
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
        <div className="jw-learn-card jw-learn-card-border relative mt-12 overflow-hidden border p-8 text-center shadow-sm sm:mt-16 sm:p-12">
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
            <p className="text-xl font-semibold italic leading-snug font-[var(--font-fraunces)] sm:text-2xl md:text-3xl">
              &ldquo;{strings.closingBenediction}&rdquo;
            </p>
            <p className="jw-learn-card-muted mx-auto mt-4 max-w-lg text-sm leading-relaxed">
              Personal study is one of the greatest gifts a Bible student has.
              Don&apos;t let this course end here.
            </p>
            <button
              type="button"
              onClick={() => {
                const first = allLessons.find((l) => !completedLessons.has(l.id)) ?? allLessons[0];
                openLesson(first.id);
              }}
              className="jw-focus-ring mt-7 inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#7c3aed] px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7c3aed]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#7c3aed]/30"
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
