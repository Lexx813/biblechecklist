// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("../../lib/supabase", () => ({ supabase: {} }));

import { getMondayOfWeek, formatWeekLabel } from "../useMeetingPrep";

afterEach(() => vi.useRealTimers());

describe("getMondayOfWeek", () => {
  it("returns the local Monday for a Wednesday input", () => {
    const result = getMondayOfWeek(new Date("2026-04-15T10:00:00"));
    expect(result).toBe("2026-04-13");
  });

  it("returns the same Monday when input is Monday", () => {
    const result = getMondayOfWeek(new Date("2026-04-13T08:00:00"));
    expect(result).toBe("2026-04-13");
  });

  it("returns previous Monday when input is Sunday", () => {
    const result = getMondayOfWeek(new Date("2026-04-19T12:00:00"));
    expect(result).toBe("2026-04-13");
  });

  it("builds date string from local date parts (not toISOString)", () => {
    // Verify the result matches the local year/month/date components
    const monday = new Date("2026-04-13T00:00:00");
    const result = getMondayOfWeek(monday);
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, "0");
    const d = String(monday.getDate()).padStart(2, "0");
    expect(result).toBe(`${y}-${m}-${d}`);
  });
});

describe("formatWeekLabel", () => {
  it("formats a week range from Monday to Sunday", () => {
    const label = formatWeekLabel("2026-04-13");
    expect(label).toMatch(/Apr/);
    expect(label).toContain("–");
  });
});
