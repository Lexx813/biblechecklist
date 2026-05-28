import { describe, expect, it } from "vitest";
import { sanitizeServerRichHtml } from "../serverSanitize";

describe("sanitizeServerRichHtml", () => {
  it("keeps ordinary rich text tags", () => {
    expect(sanitizeServerRichHtml("<p>Hello <strong>world</strong></p>")).toBe("<p>Hello <strong>world</strong></p>");
  });

  it("removes script blocks and inline handlers", () => {
    const out = sanitizeServerRichHtml('<p onclick="steal()">Hi</p><script>alert(1)</script>');
    expect(out).toBe("<p>Hi</p>");
  });

  it("removes unsafe URL protocols, including encoded javascript", () => {
    expect(sanitizeServerRichHtml('<a href="javascript:alert(1)">bad</a>')).toBe("<a>bad</a>");
    expect(sanitizeServerRichHtml('<a href="java&#x73;cript:alert(1)">bad</a>')).toBe("<a>bad</a>");
  });

  it("keeps safe links and curated inline styles", () => {
    const out = sanitizeServerRichHtml(
      '<a href="https://example.com" target="_blank" rel="noopener" style="color: red; width: 999px">ok</a>',
    );
    expect(out).toBe('<a href="https://example.com" target="_blank" rel="noopener" style="color:red">ok</a>');
  });
});
