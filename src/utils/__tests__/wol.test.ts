import { describe, it, expect } from "vitest";
import {
  jwLibraryChapterUrl,
  jwOrgBibleUrl,
  wolChapterUrl,
  wolVerseUrl,
  wolRefUrl,
  wolBookUrl,
  parseScriptureRef,
} from "../wol.js";

// ── jwLibraryChapterUrl ───────────────────────────────────────────────────────

describe("jwLibraryChapterUrl", () => {
  it("builds the correct deep link for Genesis 1", () => {
    expect(jwLibraryChapterUrl(0, 1)).toBe("jwlibrary:///finder?bible=01001001");
  });

  it("builds the correct deep link for Revelation 22", () => {
    // Revelation = bookIndex 65
    expect(jwLibraryChapterUrl(65, 22)).toBe("jwlibrary:///finder?bible=66022001");
  });

  it("pads book number to 2 digits", () => {
    // Matthew = bookIndex 39 → book 40
    expect(jwLibraryChapterUrl(39, 1)).toBe("jwlibrary:///finder?bible=40001001");
  });

  it("pads chapter to 3 digits", () => {
    expect(jwLibraryChapterUrl(18, 119)).toBe("jwlibrary:///finder?bible=19119001"); // Psalms 119
  });
});

// ── jwOrgBibleUrl ─────────────────────────────────────────────────────────────

describe("jwOrgBibleUrl", () => {
  it("builds english URL for John 3:16", () => {
    const url = jwOrgBibleUrl(42, 3, "en", 16);
    expect(url).toBe("https://www.jw.org/finder?wtlocale=E&pub=nwtsty&bible=43003016");
  });

  it("defaults verse to 1 when not provided", () => {
    const url = jwOrgBibleUrl(0, 1, "en");
    expect(url).toBe("https://www.jw.org/finder?wtlocale=E&pub=nwtsty&bible=01001001");
  });

  it("uses Spanish wtlocale for lang=es", () => {
    const url = jwOrgBibleUrl(0, 1, "es");
    expect(url).toContain("wtlocale=S");
  });

  it("uses Japanese wtlocale for lang=ja", () => {
    const url = jwOrgBibleUrl(0, 1, "ja");
    expect(url).toContain("wtlocale=J");
  });

  it("uses Korean wtlocale for lang=ko", () => {
    const url = jwOrgBibleUrl(0, 1, "ko");
    expect(url).toContain("wtlocale=KO");
  });

  it("falls back to English for unknown lang", () => {
    const url = jwOrgBibleUrl(0, 1, "xx");
    expect(url).toContain("wtlocale=E");
  });
});

// ── wolChapterUrl ─────────────────────────────────────────────────────────────

describe("wolChapterUrl", () => {
  it("builds Genesis 1 URL in English", () => {
    expect(wolChapterUrl(0, 1)).toBe(
      "https://wol.jw.org/en/wol/b/r1/lp-e/nwtsty/1/1"
    );
  });

  it("builds Revelation 22 URL in Spanish", () => {
    expect(wolChapterUrl(65, 22, "es")).toBe(
      "https://wol.jw.org/es/wol/b/r4/lp-s/nwtsty/66/22"
    );
  });

  it("builds Genesis 1 URL in Japanese", () => {
    expect(wolChapterUrl(0, 1, "ja")).toBe(
      "https://wol.jw.org/ja/wol/b/r7/lp-j/nwtsty/1/1"
    );
  });

  it("builds Genesis 1 URL in Korean", () => {
    expect(wolChapterUrl(0, 1, "ko")).toBe(
      "https://wol.jw.org/ko/wol/b/r8/lp-ko/nwtsty/1/1"
    );
  });
});

// ── wolVerseUrl ───────────────────────────────────────────────────────────────

describe("wolVerseUrl", () => {
  it("includes verse anchor when verse is provided", () => {
    const url = wolVerseUrl(42, 3, 16); // John 3:16
    expect(url).toBe(
      "https://wol.jw.org/en/wol/b/r1/lp-e/nwtsty/43/3#v=43_3_16"
    );
  });

  it("omits verse anchor when verse is null", () => {
    const url = wolVerseUrl(42, 3, null);
    expect(url).not.toContain("#v=");
  });
});

// ── parseScriptureRef ─────────────────────────────────────────────────────────

describe("parseScriptureRef", () => {
  it("parses a standard reference", () => {
    expect(parseScriptureRef("John 14:28")).toEqual({
      bookIndex: 42,
      chapter: 14,
      verse: 28,
    });
  });

  it("parses a numbered book", () => {
    expect(parseScriptureRef("1 Corinthians 8:6")).toEqual({
      bookIndex: 45,
      chapter: 8,
      verse: 6,
    });
  });

  it("handles single-chapter book (Jude 9 → chapter 1, verse 9)", () => {
    expect(parseScriptureRef("Jude 9")).toEqual({
      bookIndex: 64,
      chapter: 1,
      verse: 9,
    });
  });

  it("handles range notation (takes first verse only)", () => {
    const result = parseScriptureRef("John 5:28–29");
    expect(result).toMatchObject({ bookIndex: 42, chapter: 5, verse: 28 });
  });

  it("returns null for unrecognised book", () => {
    expect(parseScriptureRef("Hezekiah 1:1")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseScriptureRef("")).toBeNull();
  });

  it("parses Genesis 1:1", () => {
    expect(parseScriptureRef("Gen 1:1")).toEqual({
      bookIndex: 0,
      chapter: 1,
      verse: 1,
    });
  });
});

// ── wolRefUrl ─────────────────────────────────────────────────────────────────

describe("wolRefUrl", () => {
  it("returns a WOL URL for a valid reference", () => {
    const url = wolRefUrl("John 14:28");
    expect(url).toContain("nwtsty/43/14");
    expect(url).toContain("#v=43_14_28");
  });

  it("returns null for an invalid reference", () => {
    expect(wolRefUrl("not a reference")).toBeNull();
  });
});

// ── wolBookUrl ────────────────────────────────────────────────────────────────

describe("wolBookUrl", () => {
  it("always uses chapter 1", () => {
    expect(wolBookUrl(0)).toMatch(/\/1\/1$/);
  });
});
