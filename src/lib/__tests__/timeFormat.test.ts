import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fmtDiff, timeAgo } from "../timeFormat";

describe("fmtDiff", () => {
  it("returns empty string when diff is null", () => {
    expect(fmtDiff(null)).toBe("");
  });

  it('returns "Active now" for diffs under 1 minute', () => {
    expect(fmtDiff(0)).toBe("Active now");
    expect(fmtDiff(30_000)).toBe("Active now");
    expect(fmtDiff(59_999)).toBe("Active now");
  });

  it("returns minutes for diffs under 1 hour", () => {
    expect(fmtDiff(60_000)).toBe("1m ago");
    expect(fmtDiff(5 * 60_000)).toBe("5m ago");
    expect(fmtDiff(59 * 60_000)).toBe("59m ago");
  });

  it("returns hours for diffs under 1 day", () => {
    expect(fmtDiff(60 * 60_000)).toBe("1h ago");
    expect(fmtDiff(3 * 60 * 60_000)).toBe("3h ago");
    expect(fmtDiff(23 * 60 * 60_000)).toBe("23h ago");
  });

  it("returns days for diffs >= 1 day", () => {
    expect(fmtDiff(24 * 60 * 60_000)).toBe("1d ago");
    expect(fmtDiff(7 * 24 * 60 * 60_000)).toBe("7d ago");
  });
});

describe("timeAgo", () => {
  const NOW = new Date("2026-04-20T12:00:00Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for timestamps under 1 minute old', () => {
    expect(timeAgo(new Date(NOW - 30_000).toISOString())).toBe("just now");
  });

  it("returns minutes for under 1 hour", () => {
    expect(timeAgo(new Date(NOW - 5 * 60_000).toISOString())).toBe("5m ago");
    expect(timeAgo(new Date(NOW - 59 * 60_000).toISOString())).toBe("59m ago");
  });

  it("returns hours for under 1 day", () => {
    expect(timeAgo(new Date(NOW - 2 * 60 * 60_000).toISOString())).toBe("2h ago");
  });

  it("returns days for under 30 days", () => {
    expect(timeAgo(new Date(NOW - 5 * 24 * 60 * 60_000).toISOString())).toBe("5d ago");
    expect(timeAgo(new Date(NOW - 29 * 24 * 60 * 60_000).toISOString())).toBe("29d ago");
  });

  it("returns a localized date for 30+ days old", () => {
    const result = timeAgo(new Date(NOW - 60 * 24 * 60 * 60_000).toISOString());
    expect(result).not.toMatch(/ago$/);
    expect(result.length).toBeGreaterThan(0);
  });
});
