// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { sanitize, sanitizeRich } from "../sanitize";

describe("sanitize (plain)", () => {
  it("passes through safe HTML", () => {
    const out = sanitize("<p>Hello <strong>world</strong></p>");
    expect(out).toContain("Hello");
    expect(out).toContain("strong");
  });

  it("strips script tags", () => {
    const out = sanitize('<script>alert("xss")</script>Hello');
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("alert");
    expect(out).toContain("Hello");
  });

  it("strips onerror attributes", () => {
    const out = sanitize('<img src="x" onerror="alert(1)">');
    expect(out).not.toContain("onerror");
  });

  it("strips onclick attributes", () => {
    const out = sanitize('<a href="#" onclick="stealCookies()">click</a>');
    expect(out).not.toContain("onclick");
    expect(out).toContain("click");
  });

  it("strips javascript: hrefs", () => {
    const out = sanitize('<a href="javascript:alert(1)">link</a>');
    expect(out).not.toContain("javascript:");
  });

  it("does not allow javascript: in href even with other attrs", () => {
    const out = sanitize('<a href="javascript:void(0)" title="test">click</a>');
    expect(out).not.toContain("javascript:");
  });

  it("returns empty string for empty input", () => {
    expect(sanitize("")).toBe("");
  });

  it("returns empty string for falsy input", () => {
    expect(sanitize(undefined as any)).toBe("");
  });
});

describe("sanitizeRich (with styles)", () => {
  it("passes through safe HTML", () => {
    const out = sanitizeRich("<p>Hello <em>world</em></p>");
    expect(out).toContain("Hello");
    expect(out).toContain("em");
  });

  it("strips script tags", () => {
    const out = sanitizeRich('<script>alert("xss")</script>Safe content');
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("alert");
  });

  it("strips onerror even with style allowed", () => {
    const out = sanitizeRich('<img src="x" onerror="alert(1)">');
    expect(out).not.toContain("onerror");
  });

  it("allows safe color style", () => {
    const out = sanitizeRich('<span style="color:red">text</span>');
    expect(out).toContain("color");
    expect(out).toContain("text");
  });

  it("allows background-color style", () => {
    const out = sanitizeRich('<span style="background-color:yellow">highlight</span>');
    expect(out).toContain("background-color");
  });

  it("allows text-align style", () => {
    const out = sanitizeRich('<p style="text-align:center">centered</p>');
    expect(out).toContain("text-align");
  });

  it("preserves text content after sanitization", () => {
    const out = sanitizeRich('<p style="color:red">important text</p>');
    expect(out).toContain("important text");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeRich("")).toBe("");
  });
});
