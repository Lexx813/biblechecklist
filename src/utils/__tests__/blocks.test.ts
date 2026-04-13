import { describe, it, expect } from "vitest";
import { buildBlockedSet } from "../blocks";

describe("buildBlockedSet", () => {
  const ME = "user-a";

  it("returns empty set when no rows", () => {
    expect(buildBlockedSet([], ME)).toEqual(new Set());
  });

  it("includes users I blocked", () => {
    const rows = [{ blocker_id: ME, blocked_id: "user-b" }];
    expect(buildBlockedSet(rows, ME).has("user-b")).toBe(true);
  });

  it("includes users who blocked me", () => {
    const rows = [{ blocker_id: "user-c", blocked_id: ME }];
    expect(buildBlockedSet(rows, ME).has("user-c")).toBe(true);
  });

  it("does not include unrelated users", () => {
    const rows = [{ blocker_id: "user-d", blocked_id: "user-e" }];
    expect(buildBlockedSet(rows, ME)).toEqual(new Set());
  });

  it("handles both directions in same dataset", () => {
    const rows = [
      { blocker_id: ME, blocked_id: "user-b" },
      { blocker_id: "user-c", blocked_id: ME },
      { blocker_id: "user-d", blocked_id: "user-e" }, // unrelated
    ];
    const set = buildBlockedSet(rows, ME);
    expect(set.has("user-b")).toBe(true);
    expect(set.has("user-c")).toBe(true);
    expect(set.has("user-d")).toBe(false);
    expect(set.has("user-e")).toBe(false);
    expect(set.size).toBe(2);
  });
});
