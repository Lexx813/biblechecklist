import { describe, it, expect } from "vitest";
import { buildGroupInviteEmail, isValidEmail } from "../groupInviteEmail";

describe("isValidEmail", () => {
  it.each(["a@b.co", "first.last+tag@example.org"])("accepts %s", (e) => {
    expect(isValidEmail(e)).toBe(true);
  });
  it.each(["", "nope", "a@b", "a b@c.com", `${"x".repeat(250)}@b.com`])("rejects %s", (e) => {
    expect(isValidEmail(e)).toBe(false);
  });
});

describe("buildGroupInviteEmail", () => {
  const joinUrl = "https://jwstudy.org/groups/g1?join=abc";

  it("names the inviter and group and links to the join URL", () => {
    const { subject, html, text } = buildGroupInviteEmail({ inviterName: "Ana", groupName: "Family Study", joinUrl });
    expect(subject).toBe('Ana invited you to "Family Study" on JW Study');
    expect(html).toContain(`href="${joinUrl}"`);
    expect(text).toContain(joinUrl);
  });

  it("falls back when the inviter has no display name", () => {
    expect(buildGroupInviteEmail({ inviterName: null, groupName: "G", joinUrl }).subject).toMatch(/^A friend invited you/);
  });

  it("escapes user-controlled names in the HTML", () => {
    const { html } = buildGroupInviteEmail({ inviterName: "<b>x</b>", groupName: `"><script>`, joinUrl });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>x</b>");
    expect(html).toContain("&lt;script&gt;");
  });
});
