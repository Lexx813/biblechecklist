import { describe, it, expect } from "vitest";
import { parseEmbedUrl, validateVideoFile, generateVideoSlug, formatScriptureTag } from "../videoEmbed.js";

describe("parseEmbedUrl", () => {
  it("parses youtube.com/watch URL", () => {
    expect(parseEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });
  it("parses youtu.be short URL", () => {
    expect(parseEmbedUrl("https://youtu.be/dQw4w9WgXcQ"))
      .toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });
  it("parses rumble.com/v URL", () => {
    expect(parseEmbedUrl("https://rumble.com/v4abc123-some-title.html"))
      .toBe("https://rumble.com/embed/v4abc123");
  });
  it("parses tiktok.com video URL", () => {
    expect(parseEmbedUrl("https://www.tiktok.com/@user/video/1234567890"))
      .toBe("https://www.tiktok.com/embed/v2/1234567890");
  });
  it("returns null for unsupported domain", () => {
    expect(parseEmbedUrl("https://vimeo.com/12345")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseEmbedUrl("")).toBeNull();
  });
});

describe("validateVideoFile", () => {
  it("accepts MP4 under 50 MB", () => {
    const f = new File(["x"], "test.mp4", { type: "video/mp4" });
    expect(validateVideoFile(f)).toBeNull();
  });
  it("rejects unsupported type", () => {
    const f = new File(["x"], "test.avi", { type: "video/avi" });
    expect(validateVideoFile(f)).toMatch(/MP4, MOV, WebM/);
  });
  it("rejects file over 50 MB", () => {
    const f = new File(["x"], "big.mp4", { type: "video/mp4" });
    Object.defineProperty(f, "size", { value: 60 * 1024 * 1024 });
    expect(validateVideoFile(f)).toMatch(/50 MB/);
  });
});

describe("generateVideoSlug", () => {
  it("converts title to kebab-case with suffix", () => {
    const slug = generateVideoSlug("Is the Angel of Jehovah God?");
    expect(slug).toMatch(/^is-the-angel-of-jehovah-god-[a-z0-9]+$/);
  });
  it("strips special characters", () => {
    const slug = generateVideoSlug("Hello, World!");
    expect(slug).toMatch(/^hello-world-[a-z0-9]+$/);
  });
});

describe("formatScriptureTag", () => {
  it("returns null when both inputs are empty", () => {
    expect(formatScriptureTag("", "")).toBeNull();
  });
  it("returns null when only chapter is provided (no book)", () => {
    expect(formatScriptureTag("", "3")).toBeNull();
  });
  it("returns book name alone when chapter is empty", () => {
    expect(formatScriptureTag("John", "")).toBe("John");
  });
  it("combines book and chapter with a space", () => {
    expect(formatScriptureTag("John", "3")).toBe("John 3");
  });
  it("trims whitespace from both inputs", () => {
    expect(formatScriptureTag("  John  ", "  3  ")).toBe("John 3");
  });
  it("handles multi-word book names", () => {
    expect(formatScriptureTag("1 John", "4")).toBe("1 John 4");
  });
});
