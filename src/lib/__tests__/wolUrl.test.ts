import { describe, expect, it } from "vitest";
import { bookSlugFromRef, wolUrlFor } from "../songs/wolUrl";

describe("bookSlugFromRef", () => {
  it("returns the /books slug for single-word books", () => {
    expect(bookSlugFromRef("Matthew 7:7")).toBe("matthew");
    expect(bookSlugFromRef("Revelation 18")).toBe("revelation");
    expect(bookSlugFromRef("Daniel 10:12-13")).toBe("daniel");
  });

  it("returns the hyphenated slug for numbered books", () => {
    expect(bookSlugFromRef("1 Samuel 17:45")).toBe("1-samuel");
    expect(bookSlugFromRef("2 Corinthians 5:17")).toBe("2-corinthians");
  });

  it("normalises Psalm vs Psalms to the same slug", () => {
    expect(bookSlugFromRef("Psalm 23")).toBe("psalms");
    expect(bookSlugFromRef("Psalms 23")).toBe("psalms");
  });

  it("returns null for refs we can't parse or don't recognise", () => {
    expect(bookSlugFromRef("")).toBeNull();
    expect(bookSlugFromRef(null)).toBeNull();
    expect(bookSlugFromRef(undefined)).toBeNull();
    expect(bookSlugFromRef("Not A Real Book 1:1")).toBeNull();
    expect(bookSlugFromRef("just some text")).toBeNull();
  });
});

// Existing function — quick regression so the refactor that added
// bookSlugFromRef didn't disturb wolUrlFor's behaviour.
describe("wolUrlFor (regression)", () => {
  it("builds a jw.org URL for a known book", () => {
    expect(wolUrlFor("Matthew 7:7")).toBe(
      "https://www.jw.org/en/library/bible/nwt/books/matthew/7/",
    );
  });
  it("falls back to WOL search for an unknown ref", () => {
    expect(wolUrlFor("Unknown Book 1:1")).toMatch(/wol\.jw\.org\/.*\/s\//);
  });
});
