// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderMentions, extractMentions } from "../mentions";

describe("renderMentions", () => {
  it("wraps @username in a mention-highlight span", () => {
    const result = renderMentions("Hello @alice how are you");
    expect(result).toContain('<span class="mention-highlight">@alice</span>');
  });

  it("wraps multiple mentions", () => {
    const result = renderMentions("@alice and @bob");
    expect(result).toContain('<span class="mention-highlight">@alice</span>');
    expect(result).toContain('<span class="mention-highlight">@bob</span>');
  });

  it("returns empty string for empty input", () => {
    expect(renderMentions("")).toBe("");
  });

  it("leaves text without mentions unchanged", () => {
    const result = renderMentions("no mentions here");
    expect(result).toBe("no mentions here");
  });

  it("passes input through DOMPurify (strips script tags)", () => {
    const result = renderMentions('<script>alert("xss")</script>@alice');
    expect(result).not.toContain("<script>");
    expect(result).toContain('<span class="mention-highlight">@alice</span>');
  });
});

describe("extractMentions", () => {
  it("returns empty array for empty string", () => {
    expect(extractMentions("")).toEqual([]);
  });

  it("returns empty array when no mentions present", () => {
    expect(extractMentions("no mentions here")).toEqual([]);
  });

  it("extracts a single mention", () => {
    expect(extractMentions("hello @alice")).toEqual(["alice"]);
  });

  it("extracts multiple unique mentions", () => {
    const result = extractMentions("@alice and @bob and @charlie");
    expect(result).toEqual(expect.arrayContaining(["alice", "bob", "charlie"]));
    expect(result).toHaveLength(3);
  });

  it("returns unique usernames (deduplicates)", () => {
    const result = extractMentions("@alice @bob @alice");
    expect(result).toEqual(expect.arrayContaining(["alice", "bob"]));
    expect(result).toHaveLength(2);
  });

  it("handles mentions with dots and hyphens", () => {
    expect(extractMentions("hello @john.doe")).toEqual(["john.doe"]);
  });
});
