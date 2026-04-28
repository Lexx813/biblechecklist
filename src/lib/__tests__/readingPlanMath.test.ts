import { describe, it, expect } from 'vitest';
import {
  daysSince,
  effectiveDay,
  daysBehind,
  catchUpStartDate,
  projectedFinish,
} from '../readingPlanMath';

const T = (s: string) => new Date(s + 'T12:00:00');

describe('readingPlanMath.daysSince', () => {
  it('returns 1 on the start date itself (day 1, inclusive)', () => {
    expect(daysSince('2026-01-01', T('2026-01-01'))).toBe(1);
  });

  it('counts subsequent days correctly', () => {
    expect(daysSince('2026-01-01', T('2026-01-10'))).toBe(10);
  });

  it('handles a plan that started months ago', () => {
    expect(daysSince('2025-12-01', T('2026-03-01'))).toBe(91);
  });
});

describe('readingPlanMath.effectiveDay', () => {
  it('equals daysSince when there are no pauses', () => {
    const plan = { start_date: '2026-01-01' };
    expect(effectiveDay(plan, T('2026-01-08'))).toBe(8);
  });

  it('subtracts past paused_days', () => {
    const plan = { start_date: '2026-01-01', paused_days: 3 };
    expect(effectiveDay(plan, T('2026-01-10'))).toBe(7);
  });

  it('adds in-progress pause window when is_paused', () => {
    // Local-time string (no Z) so the test is deterministic across timezones.
    const plan = {
      start_date: '2026-01-01',
      paused_days: 0,
      is_paused: true,
      paused_at: '2026-01-05T12:00:00',
    };
    // raw=10, paused 5 days (Jan 5 → Jan 10), effective = 10-5 = 5
    expect(effectiveDay(plan, T('2026-01-10'))).toBe(5);
  });

  it('never returns less than 1 (day 1 floor)', () => {
    const plan = { start_date: '2026-01-01', paused_days: 999 };
    expect(effectiveDay(plan, T('2026-01-02'))).toBe(1);
  });
});

describe('readingPlanMath.daysBehind', () => {
  it('returns positive when user is behind schedule', () => {
    const plan = { start_date: '2026-01-01' };
    // Day 10, but completed only 6
    expect(daysBehind(plan, 6, 365, T('2026-01-10'))).toBe(4);
  });

  it('returns negative when user is ahead', () => {
    const plan = { start_date: '2026-01-01' };
    // Day 5, completed 8
    expect(daysBehind(plan, 8, 365, T('2026-01-05'))).toBe(-3);
  });

  it('caps the current-day at totalDays', () => {
    const plan = { start_date: '2026-01-01' };
    // 1000 days "since" start but plan is only 365 days
    expect(daysBehind(plan, 365, 365, T('2028-09-26'))).toBe(0);
  });
});

describe('readingPlanMath.catchUpStartDate', () => {
  it('produces a start_date that leaves the user exactly 2 days behind', () => {
    const today = T('2026-04-28');
    const completed = 100;
    const newStart = catchUpStartDate(completed, today);
    // After catch-up, daysSince(newStart) should be completed + 2.
    expect(daysSince(newStart, today)).toBe(completed + 2);
  });

  it('handles completed=0 (fresh start, 2 days head room)', () => {
    const today = T('2026-04-28');
    const newStart = catchUpStartDate(0, today);
    expect(daysSince(newStart, today)).toBe(2);
  });

  it('returns YYYY-MM-DD format with leading zeros', () => {
    const today = T('2026-04-28');
    const out = catchUpStartDate(10, today);
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('catch-up from very far behind does not produce a future date', () => {
    const today = T('2026-04-28');
    const out = catchUpStartDate(2, today);
    // newStart should be 3 days ago, not in the future
    const outDate = new Date(out + 'T12:00:00');
    expect(outDate.getTime()).toBeLessThan(today.getTime());
  });
});

describe('readingPlanMath.projectedFinish', () => {
  it('returns null when nothing has been completed', () => {
    const plan = { start_date: '2026-01-01' };
    expect(projectedFinish(plan, 0, 365, T('2026-01-10'))).toBeNull();
  });

  it('projects on-pace finish near the planned end', () => {
    const plan = { start_date: '2026-01-01' };
    // 100 days elapsed, 100 done — exactly on pace for 365 days.
    // remaining 265 days at 1/day = 265 more days.
    const out = projectedFinish(plan, 100, 365, T('2026-04-10'));
    expect(out).not.toBeNull();
    // Roughly 265 days from 2026-04-10 ≈ 2026-12-31 ± a day
    const days = Math.round(((out as Date).getTime() - T('2026-04-10').getTime()) / 86400000);
    expect(days).toBeGreaterThan(260);
    expect(days).toBeLessThan(270);
  });

  it('projects a much later date when user is behind pace', () => {
    const plan = { start_date: '2026-01-01' };
    // 100 days elapsed, only 10 done — pace is 1/10 per day.
    const out = projectedFinish(plan, 10, 365, T('2026-04-10'));
    expect(out).not.toBeNull();
    // remaining = 355, rate = 0.1 → 3550 more days. Far future.
    const days = Math.round(((out as Date).getTime() - T('2026-04-10').getTime()) / 86400000);
    expect(days).toBeGreaterThan(3000);
  });
});
