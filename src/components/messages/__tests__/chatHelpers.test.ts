import { describe, it, expect } from "vitest";
import { computePosition } from "../chatHelpers";

const msg = (id: string, sender_id: string, created_at: string) => ({
  id, sender_id, created_at,
  content: "hi", message_type: "text",
  starred_by: [] as string[], metadata: null, reply_to_id: null, edited_at: null,
  sender: null,
});

describe("computePosition", () => {
  it("returns solo for a single message", () => {
    const msgs = [msg("1", "a", "2026-01-01T00:00:00Z")];
    expect(computePosition(msgs, 0)).toBe("solo");
  });

  it("returns first for the start of a group", () => {
    const t = "2026-01-01T00:0";
    const msgs = [msg("1", "a", `${t}0:00Z`), msg("2", "a", `${t}1:00Z`)];
    expect(computePosition(msgs, 0)).toBe("first");
  });

  it("returns last for the end of a group", () => {
    const t = "2026-01-01T00:0";
    const msgs = [msg("1", "a", `${t}0:00Z`), msg("2", "a", `${t}1:00Z`)];
    expect(computePosition(msgs, 1)).toBe("last");
  });

  it("returns middle for a middle message in a group", () => {
    const t = "2026-01-01T00:0";
    const msgs = [
      msg("1", "a", `${t}0:00Z`),
      msg("2", "a", `${t}1:00Z`),
      msg("3", "a", `${t}2:00Z`),
    ];
    expect(computePosition(msgs, 1)).toBe("middle");
  });

  it("breaks group when sender changes", () => {
    const t = "2026-01-01T00:0";
    const msgs = [msg("1", "a", `${t}0:00Z`), msg("2", "b", `${t}1:00Z`)];
    expect(computePosition(msgs, 0)).toBe("solo");
    expect(computePosition(msgs, 1)).toBe("solo");
  });

  it("breaks group when gap exceeds 5 minutes", () => {
    const msgs = [
      msg("1", "a", "2026-01-01T00:00:00Z"),
      msg("2", "a", "2026-01-01T00:06:00Z"),
    ];
    expect(computePosition(msgs, 0)).toBe("solo");
    expect(computePosition(msgs, 1)).toBe("solo");
  });
});
