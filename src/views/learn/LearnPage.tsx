import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import UnitCard from "./_components/UnitCard";
import LessonView from "./_components/LessonView";
import ProgressBar from "./_components/ProgressBar";
import type { ExerciseResult, Unit } from "./content";
import { findLesson, getUnits, totalLessonCount } from "./content";
import { readLearnProgress, writeLearnProgress } from "./progressStore";
import {
  useMyLearnProgress,
  useUpsertLearnLesson,
  useDeleteLearnLesson,
} from "../../hooks/useLearn";

type ViewMode = { kind: "overview" } | { kind: "lesson"; lessonId: string };

interface LearnPageProps {
  onBack?: () => void;
  userId?: string | null;
}

export default function LearnPage({ onBack, userId }: LearnPageProps) {
  const { t } = useTranslation();
  const units: Unit[] = useMemo(() => getUnits(), []);
  const total = totalLessonCount();

  const [view, setView] = useState<ViewMode>({ kind: "overview" });
  const [expandedUnit, setExpandedUnit] = useState<string | null>(units[0]?.id ?? null);

  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    () => new Set(readLearnProgress().completed),
  );
  const [exerciseResults, setExerciseResults] = useState<Record<string, ExerciseResult>>({});

  const { data: serverRows } = useMyLearnProgress(userId);
  const upsertLesson = useUpsertLearnLesson(userId);
  const deleteLesson = useDeleteLearnLesson(userId);

  // Lesson-id → unit-id lookup so we can persist the unit alongside the lesson.
  const lessonToUnit = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of units) for (const l of u.lessons) m.set(l.id, u.id);
    return m;
  }, [units]);

  // Hydrate from server when authed; backfill any localStorage-only rows so
  // pre-launch progress isn't lost the first time someone opens the page.
  useEffect(() => {
    if (!userId || !serverRows) return;
    const serverIds = new Set(serverRows.map((r) => r.lesson_id));
    const localIds = new Set(readLearnProgress().completed);
    const merged = new Set<string>([...serverIds, ...localIds]);
    setCompletedLessons(merged);
    for (const lessonId of localIds) {
      if (!serverIds.has(lessonId)) {
        const unitId = lessonToUnit.get(lessonId) ?? "";
        if (unitId) upsertLesson.mutate({ lessonId, unitId });
      }
    }
    // run once per server-rows change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, serverRows]);

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

  const markLessonComplete = useCallback(
    (lessonId: string) => {
      setCompletedLessons((prev) => {
        const next = new Set(prev);
        const willComplete = !next.has(lessonId);
        if (willComplete) next.add(lessonId);
        else next.delete(lessonId);
        if (userId) {
          if (willComplete) {
            upsertLesson.mutate({
              lessonId,
              unitId: lessonToUnit.get(lessonId) ?? "",
            });
          } else {
            deleteLesson.mutate(lessonId);
          }
        }
        return next;
      });
    },
    [userId, upsertLesson, deleteLesson, lessonToUnit],
  );

  const handleExerciseComplete = useCallback(
    (result: ExerciseResult) => {
      setExerciseResults((prev) => ({
        ...prev,
        [`${result.lessonId}:${result.exerciseId}`]: result,
      }));
      setCompletedLessons((prev) => {
        if (prev.has(result.lessonId)) return prev;
        const next = new Set(prev);
        next.add(result.lessonId);
        return next;
      });
      if (userId) {
        upsertLesson.mutate({
          lessonId: result.lessonId,
          unitId: lessonToUnit.get(result.lessonId) ?? "",
          exerciseId: result.exerciseId,
          score: result.score ?? null,
          responseData: result.responseData ?? null,
        });
      }
    },
    [userId, upsertLesson, lessonToUnit],
  );

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
        <div className="min-h-full bg-[var(--bg)] px-4 py-8 sm:px-6 lg:px-8 sm:py-12">
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
    <div className="relative bg-[var(--bg)]">
      {/* Hero */}
      <header className="relative px-4 pb-10 pt-10 text-[var(--text-primary)] sm:px-6 lg:px-8 sm:pb-14 sm:pt-14">
        <div className="relative">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="jw-focus-ring mb-6 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] ring-1 ring-slate-200 transition hover:bg-white dark:bg-white/[0.06] dark:text-white/75 dark:ring-white/15 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                <path fillRule="evenodd" d="M12.7 14.7a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4l4-4a1 1 0 011.4 1.4L9.4 10l3.3 3.3a1 1 0 010 1.4z" clipRule="evenodd" />
              </svg>
              {t("learn.course.backHome")}
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="h-px w-8 bg-violet-600/60 dark:bg-white/60" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-600 dark:text-white">
              {t("learn.course.kicker")}
            </p>
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-[var(--text-primary)] dark:text-white sm:text-5xl md:text-6xl">
            {t("learn.course.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-white/75 sm:text-lg">
            {t("learn.course.intro")}
          </p>

          {/* Progress strip */}
          <div className="jw-learn-card jw-learn-card-border mt-8 max-w-xl border p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="jw-learn-card-faint text-xs font-medium uppercase tracking-[0.18em]">
                {t("learn.course.overallProgress")}
              </p>
              <p className="text-xs font-semibold text-violet-600 dark:text-white">
                {completedLessons.size} / {total}
              </p>
            </div>
            <div className="mt-3">
              <ProgressBar value={overallProgress} />
            </div>
          </div>
        </div>
      </header>

      {/* Units */}
      <section className="relative px-4 pb-14 pt-4 sm:px-6 lg:px-8 sm:pb-20 sm:pt-6">
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
          <div className="relative">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-violet-600/10 ring-1 ring-violet-600/30">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-violet-600" aria-hidden>
                <path d="M10 2l1.8 4.6L16.5 8l-4 3.3 1.3 4.7L10 13.6l-3.8 2.4 1.3-4.7L3.5 8l4.7-1.4L10 2z" />
              </svg>
            </div>
            <p className="text-xl font-semibold leading-snug sm:text-2xl md:text-3xl">
              &ldquo;{t("learn.course.closingBenediction")}&rdquo;
            </p>
            <p className="jw-learn-card-muted mx-auto mt-4 max-w-lg text-sm leading-relaxed">
              {t("learn.course.closingBlurb")}
            </p>
            <button
              type="button"
              onClick={() => {
                const first = allLessons.find((l) => !completedLessons.has(l.id)) ?? allLessons[0];
                openLesson(first.id);
              }}
              className="jw-focus-ring mt-7 inline-flex cursor-pointer items-center gap-2 rounded-md bg-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-600/30"
            >
              {t("learn.course.closingCta")}
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
