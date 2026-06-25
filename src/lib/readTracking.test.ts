import { describe, it, expect } from "vitest";
import {
  isQualifiedRead,
  newMilestones,
  createActiveTimer,
  SCROLL_MILESTONES,
} from "./readTracking";

describe("isQualifiedRead", () => {
  it("requires both scroll and time thresholds", () => {
    expect(isQualifiedRead(70, 30)).toBe(true);   // exactly on both boundaries
    expect(isQualifiedRead(100, 600)).toBe(true);
    expect(isQualifiedRead(69, 60)).toBe(false);   // not scrolled far enough
    expect(isQualifiedRead(95, 29)).toBe(false);   // not long enough
    expect(isQualifiedRead(0, 0)).toBe(false);
  });
});

describe("newMilestones", () => {
  it("returns only crossed-and-unfired milestones", () => {
    expect(newMilestones(new Set(), 0)).toEqual([]);
    expect(newMilestones(new Set(), 60)).toEqual([25, 50]);
    expect(newMilestones(new Set(), 100)).toEqual([...SCROLL_MILESTONES]);
  });

  it("never re-fires an already-fired milestone", () => {
    const fired = new Set([25, 50]);
    expect(newMilestones(fired, 80)).toEqual([75]);
    expect(newMilestones(new Set(SCROLL_MILESTONES), 100)).toEqual([]);
  });
});

describe("createActiveTimer", () => {
  it("counts visible wall-clock time", () => {
    const t = createActiveTimer(true, 1_000);
    expect(t.seconds(36_000)).toBe(35); // 35s elapsed while visible
  });

  it("excludes time spent hidden", () => {
    const t = createActiveTimer(true, 0);
    t.pause(10_000);        // 10s visible banked
    t.resume(60_000);       // hidden for 50s (not counted)
    expect(t.seconds(75_000)).toBe(25); // 10s + 15s live
  });

  it("starts paused when the tab opens hidden", () => {
    const t = createActiveTimer(false, 0);
    expect(t.seconds(20_000)).toBe(0);
    t.resume(20_000);
    expect(t.seconds(50_000)).toBe(30);
  });

  it("is idempotent on repeated resume/pause", () => {
    const t = createActiveTimer(true, 0);
    t.resume(5_000);        // already running — ignored
    t.pause(10_000);
    t.pause(20_000);        // already paused — ignored
    expect(t.seconds(30_000)).toBe(10);
  });
});
