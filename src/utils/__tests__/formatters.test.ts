import { describe, it, expect } from "vitest";
import { authorName, formatNum, stripHtml } from "../formatters.js";

// ── authorName ────────────────────────────────────────────────────────────────

describe("authorName", () => {
  it("returns display_name when present", () => {
    expect(authorName({ profiles: { display_name: "Alexi", email: "a@b.com" } })).toBe("Alexi");
  });

  it("falls back to email username when no display_name", () => {
    expect(authorName({ profiles: { email: "user@example.com" } })).toBe("user");
  });

  it("returns Anonymous when profiles is null", () => {
    expect(authorName({})).toBe("Anonymous");
    expect(authorName(null)).toBe("Anonymous");
  });
});

// ── formatNum ─────────────────────────────────────────────────────────────────

describe("formatNum", () => {
  it("formats zero", () => {
    expect(formatNum(0)).toBe("0");
  });

  it("handles null/undefined as 0", () => {
    expect(formatNum(null)).toBe("0");
    expect(formatNum(undefined)).toBe("0");
  });
});

// ── stripHtml ─────────────────────────────────────────────────────────────────

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("collapses extra whitespace", () => {
    expect(stripHtml("<p>  too   many   spaces  </p>")).toBe("too many spaces");
  });

  it("returns empty string for empty input", () => {
    expect(stripHtml("")).toBe("");
    expect(stripHtml()).toBe("");
  });

  it("preserves plain text", () => {
    expect(stripHtml("no tags here")).toBe("no tags here");
  });
});
