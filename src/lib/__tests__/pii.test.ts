import { describe, it, expect } from "vitest";
import { detectPII, assertNoPII, upgradeInsecureLinks } from "../pii";

describe("detectPII", () => {
  it("returns null for clean text", () => {
    expect(detectPII("Hello, how are you?")).toBeNull();
    expect(detectPII("")).toBeNull();
    expect(detectPII()).toBeNull();
  });

  describe("email", () => {
    it("detects a plain email address", () => {
      expect(detectPII("contact me at user@example.com please")).toBe("email address");
    });
    it("detects email with subdomain", () => {
      expect(detectPII("john.doe@mail.company.org")).toBe("email address");
    });
    it("does not flag @username handles as email", () => {
      // social handle check comes after email, so @user has no domain — shouldn't match email
      expect(detectPII("follow me @johndoe")).not.toBe("email address");
    });
  });

  describe("phone number", () => {
    it("detects US format with dashes", () => {
      expect(detectPII("call me at 555-555-5555")).toBe("phone number");
    });
    it("detects international format", () => {
      expect(detectPII("+1 (555) 555-5555")).toBe("phone number");
    });
    it("detects digits-only phone", () => {
      expect(detectPII("my number is 5555555555")).toBe("phone number");
    });
    it("detects dot-separated phone", () => {
      expect(detectPII("555.555.5555")).toBe("phone number");
    });
  });

  describe("physical address", () => {
    it("detects street address with St", () => {
      expect(detectPII("I live at 123 Main St")).toBe("physical address");
    });
    it("detects street address with Avenue", () => {
      expect(detectPII("meet at 456 Oak Avenue tomorrow")).toBe("physical address");
    });
    it("detects street address with Blvd", () => {
      expect(detectPII("789 Sunset Blvd")).toBe("physical address");
    });
    it("does not flag a plain number", () => {
      expect(detectPII("read chapter 10")).toBeNull();
    });
  });

  describe("social media URLs", () => {
    it("detects facebook.com", () => {
      expect(detectPII("find me at facebook.com/johndoe")).toBe("social media link");
    });
    it("detects instagram.com", () => {
      expect(detectPII("https://instagram.com/user")).toBe("social media link");
    });
    it("detects twitter/x", () => {
      expect(detectPII("follow me on x.com/user")).toBe("social media link");
    });
    it("detects discord invite", () => {
      expect(detectPII("join discord.gg/abc123")).toBe("social media link");
    });
    it("detects WhatsApp", () => {
      expect(detectPII("message me on wa.me/mychat")).toBe("social media link");
    });
    it("allows jw.org links", () => {
      expect(detectPII("check https://www.jw.org/en/library")).toBeNull();
    });
  });

  describe("social media handles", () => {
    it("detects @handle", () => {
      expect(detectPII("follow me @johnsmith")).toBe("social media handle");
    });
    it("does not flag single-char handles", () => {
      // min 2 chars after @
      expect(detectPII("price is $5")).toBeNull();
    });
    it("does not flag @username inside a URL path", () => {
      expect(detectPII("check out https://suno.com/@lexxsolutionz")).toBeNull();
      expect(detectPII("my youtube https://youtube.com/@creator")).toBeNull();
      expect(detectPII("<p>link: https://example.com/@user</p>")).toBeNull();
    });
    it("still flags standalone handles when URL is stripped", () => {
      expect(detectPII("check out @lexxsolutionz https://suno.com")).toBe("social media handle");
    });
  });

  describe("insecure links", () => {
    it("no longer flags http:// links (auto-upgraded instead)", () => {
      expect(detectPII("visit http://example.com")).toBeNull();
    });
    it("allows https:// links", () => {
      expect(detectPII("visit https://example.com")).toBeNull();
    });
  });

  describe("HTML content", () => {
    it("strips HTML tags before scanning", () => {
      expect(detectPII("<p>Hello there</p>")).toBeNull();
    });
    it("detects email hidden in HTML", () => {
      expect(detectPII("<p>email me at <b>user@example.com</b></p>")).toBe("email address");
    });
    it("strips HTML entities before scanning", () => {
      // &amp; should not prevent detection of clean content
      expect(detectPII("<p>Hello &amp; welcome</p>")).toBeNull();
    });
  });
});

describe("assertNoPII", () => {
  it("does not throw for clean fields", () => {
    expect(() => assertNoPII("Hello world", "Great post", "")).not.toThrow();
  });

  it("throws with a friendly message for email", () => {
    expect(() => assertNoPII("contact user@example.com")).toThrow(/email address/);
  });

  it("does not throw for http:// links (auto-upgraded by upgradeInsecureLinks)", () => {
    expect(() => assertNoPII("see http://example.com")).not.toThrow();
  });

  it("checks all fields, not just the first", () => {
    expect(() => assertNoPII("clean text", "also clean", "bad@email.com")).toThrow(/email address/);
  });

  it("accepts undefined/empty fields without throwing", () => {
    expect(() => assertNoPII("", "good text")).not.toThrow();
  });
});

describe("upgradeInsecureLinks", () => {
  it("upgrades http:// to https://", () => {
    expect(upgradeInsecureLinks("visit http://example.com")).toBe("visit https://example.com");
  });
  it("leaves https:// untouched", () => {
    expect(upgradeInsecureLinks("visit https://example.com")).toBe("visit https://example.com");
  });
  it("upgrades multiple http links", () => {
    expect(upgradeInsecureLinks("http://a.com and http://b.com")).toBe("https://a.com and https://b.com");
  });
  it("handles HTML href attributes", () => {
    expect(upgradeInsecureLinks('<a href="http://jwstudy.org">link</a>')).toBe('<a href="https://jwstudy.org">link</a>');
  });
});
