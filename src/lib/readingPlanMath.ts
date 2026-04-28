/**
 * Pure helpers for reading-plan progress math.
 *
 * Extracted from src/views/readingplans/ReadingPlansPage.tsx so they can be
 * unit-tested without rendering. All inputs are intentionally pure so the
 * test suite can pin a `today` reference; in production the page calls
 * these without `today` and gets `new Date()` at module-call time.
 */

export interface PlanLike {
  start_date: string; // YYYY-MM-DD
  paused_days?: number | null;
  paused_at?: string | null; // ISO timestamp
  is_paused?: boolean | null;
}

function midnight(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Calendar-day count from start_date (inclusive). Day 1 = the start date.
 */
export function daysSince(dateStr: string, today: Date = new Date()): number {
  const start = new Date(dateStr + "T00:00:00");
  const now = midnight(today);
  return Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
}

/**
 * The day number the plan thinks the user is "on" today, factoring in
 * past pauses (`paused_days`) and any in-progress pause window (the
 * difference between `paused_at` and `today`).
 */
export function effectiveDay(plan: PlanLike, today: Date = new Date()): number {
  const raw = daysSince(plan.start_date, today);
  let pausedDays = plan.paused_days ?? 0;
  if (plan.is_paused && plan.paused_at) {
    const pausedDate = midnight(new Date(plan.paused_at));
    const now = midnight(today);
    pausedDays += Math.max(0, Math.floor((now.getTime() - pausedDate.getTime()) / 86400000));
  }
  return Math.max(1, raw - pausedDays);
}

/**
 * How many days behind/ahead the user is. Negative = ahead, positive = behind.
 * Capped to plan length on the high end.
 */
export function daysBehind(
  plan: PlanLike,
  completedCount: number,
  totalDays: number,
  today: Date = new Date(),
): number {
  const currentDay = Math.min(effectiveDay(plan, today), totalDays);
  return currentDay - completedCount;
}

/**
 * Catch-up adjustment: returns the new `start_date` (YYYY-MM-DD) that puts
 * the user exactly 2 days behind based on how many days they've completed.
 *
 * Why "2 days behind" not "0": leaving zero buffer means a single missed day
 * shows as "behind" again, which is demoralizing. 2 days = forgiving floor.
 */
export function catchUpStartDate(
  completedCount: number,
  today: Date = new Date(),
): string {
  const newStart = midnight(today);
  newStart.setDate(newStart.getDate() - (completedCount + 1));
  // YYYY-MM-DD without timezone shift.
  const y = newStart.getFullYear();
  const m = String(newStart.getMonth() + 1).padStart(2, "0");
  const d = String(newStart.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Projected completion date based on current pace. Returns null when the
 * user has completed nothing or the elapsed window is 0 days.
 */
export function projectedFinish(
  plan: PlanLike,
  completedCount: number,
  totalDays: number,
  today: Date = new Date(),
): Date | null {
  if (completedCount === 0) return null;
  const elapsed = daysSince(plan.start_date, today) - (plan.paused_days ?? 0);
  if (elapsed <= 0) return null;
  const rate = completedCount / elapsed;
  const remaining = totalDays - completedCount;
  if (rate <= 0) return null;
  const daysToFinish = Math.ceil(remaining / rate);
  const out = midnight(today);
  out.setDate(out.getDate() + daysToFinish);
  return out;
}
