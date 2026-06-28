/**
 * Pure, framework-free helpers for measuring whether a blog post was actually
 * READ (scroll depth + active dwell time) versus merely opened. The thresholds
 * here are the client mirror of record_blog_read() in
 * supabase/migrations/20260624_blog_reads.sql — keep them in sync.
 *
 * Everything in this file is deterministic and clock-injected so it can be unit
 * tested without real timers or a DOM (see readTracking.test.ts).
 */

/** A read "counts" once the reader has scrolled this far AND spent this long. */
export const QUALIFIED_SCROLL_PCT = 70;
export const QUALIFIED_ACTIVE_SECONDS = 30;

/** Scroll checkpoints we fire one analytics event for, the first time crossed. */
export const SCROLL_MILESTONES = [25, 50, 75, 100] as const;

export function isQualifiedRead(maxScrollPct: number, activeSeconds: number): boolean {
  return maxScrollPct >= QUALIFIED_SCROLL_PCT && activeSeconds >= QUALIFIED_ACTIVE_SECONDS;
}

/**
 * Given the milestones already fired and the current scroll percentage, return
 * the milestones newly crossed — so each checkpoint emits exactly one event.
 */
export function newMilestones(fired: ReadonlySet<number>, scrollPct: number): number[] {
  return SCROLL_MILESTONES.filter((m) => scrollPct >= m && !fired.has(m));
}

/**
 * Accumulates "active" time — wall-clock spent while the tab is visible/focused
 * — by pausing on hide and resuming on show. The caller drives it with a clock
 * (Date.now() in the browser) so idle background tabs never inflate read time.
 */
export interface ActiveTimer {
  /** Tab became visible. No-op if already running. */
  resume(nowMs: number): void;
  /** Tab hidden/blurred. Banks the elapsed run. No-op if already paused. */
  pause(nowMs: number): void;
  /** Total active seconds as of `nowMs` (floored). */
  seconds(nowMs: number): number;
}

export function createActiveTimer(startVisible: boolean, startNowMs: number): ActiveTimer {
  let bankedMs = 0;
  let runningSince: number | null = startVisible ? startNowMs : null;

  return {
    resume(nowMs: number): void {
      if (runningSince === null) runningSince = nowMs;
    },
    pause(nowMs: number): void {
      if (runningSince !== null) {
        bankedMs += Math.max(0, nowMs - runningSince);
        runningSince = null;
      }
    },
    seconds(nowMs: number): number {
      const live = runningSince !== null ? Math.max(0, nowMs - runningSince) : 0;
      return Math.floor((bankedMs + live) / 1000);
    },
  };
}
