import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase before importing campaigns
vi.mock("../../lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}));

import { buildSegmentSummary } from "../campaigns";

describe("buildSegmentSummary", () => {
  it("returns 'All users' for empty config", () => {
    expect(buildSegmentSummary({})).toBe("All users");
  });

  it("includes plan label", () => {
    expect(buildSegmentSummary({ plan: "premium" })).toContain("Premium");
    expect(buildSegmentSummary({ plan: "free" })).toContain("Free");
  });

  it("includes language list", () => {
    expect(buildSegmentSummary({ languages: ["en", "es"] })).toContain("en, es");
  });

  it("includes inactive days", () => {
    expect(buildSegmentSummary({ inactive_days: 14 })).toContain("14 days inactive");
  });

  it("includes tags", () => {
    expect(buildSegmentSummary({ tags: ["early_adopter"] })).toContain("early_adopter");
  });

  it("combines multiple filters", () => {
    const summary = buildSegmentSummary({ plan: "free", inactive_days: 7, languages: ["en"] });
    expect(summary).toContain("Free");
    expect(summary).toContain("7 days inactive");
    expect(summary).toContain("en");
  });
});
