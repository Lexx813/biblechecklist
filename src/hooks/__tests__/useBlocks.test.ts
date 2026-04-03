import { describe, it, expect } from "vitest";
import { buildBlockedSet } from "../../utils/blocks";

describe("buildBlockedSet", () => {
  it("adds blocked_id when current user is the blocker", () => {
    const rows = [{ blocker_id: "me", blocked_id: "them" }];
    const set = buildBlockedSet(rows, "me");
    expect(set.has("them")).toBe(true);
    expect(set.has("me")).toBe(false);
  });

  it("adds blocker_id when current user is the one blocked", () => {
    const rows = [{ blocker_id: "them", blocked_id: "me" }];
    const set = buildBlockedSet(rows, "me");
    expect(set.has("them")).toBe(true);
    expect(set.has("me")).toBe(false);
  });

  it("handles multiple rows in both directions", () => {
    const rows = [
      { blocker_id: "me", blocked_id: "a" },
      { blocker_id: "b", blocked_id: "me" },
    ];
    const set = buildBlockedSet(rows, "me");
    expect(set.size).toBe(2);
    expect(set.has("a")).toBe(true);
    expect(set.has("b")).toBe(true);
  });

  it("returns an empty set when rows is empty", () => {
    expect(buildBlockedSet([], "me").size).toBe(0);
  });
});
