const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

// YouTube video IDs: 11 chars of [A-Za-z0-9_-]
const YT_ID_RE = /^[a-zA-Z0-9_-]{1,20}$/;

/** Returns the iframe embed src for supported platforms, or null. */
export function parseEmbedUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;
  let url: URL;
  try { url = new URL(rawUrl); } catch { return null; }
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" && url.pathname === "/watch") {
    const v = url.searchParams.get("v");
    return v && YT_ID_RE.test(v) ? `https://www.youtube.com/embed/${v}` : null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("?")[0];
    return id && YT_ID_RE.test(id) ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "rumble.com") {
    const match = url.pathname.match(/^\/(v[a-z0-9]+)/i);
    return match ? `https://rumble.com/embed/${match[1]}` : null;
  }
  if (host === "tiktok.com" || host === "vm.tiktok.com") {
    // Full URL: tiktok.com/@user/video/1234567890
    const match = url.pathname.match(/\/video\/(\d+)/);
    if (match) return `https://www.tiktok.com/embed/v2/${match[1]}`;
    // Short/mobile URL (vm.tiktok.com/ZMxxx or tiktok.com/t/ZMxxx) — can't embed redirect
    return null;
  }
  return null;
}

/** Returns an error message, or null if the file is valid. */
export function validateVideoFile(file: File): string | null {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return "Only MP4, MOV, WebM files are supported.";
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return "File too large. Maximum size is 50 MB.";
  }
  return null;
}

/**
 * Formats a Bible book + chapter into a scripture tag string.
 * Returns null if no book is provided (chapter alone is meaningless).
 * Examples: ("John", "3") → "John 3"  |  ("John", "") → "John"  |  ("", "3") → null
 */
export function formatScriptureTag(book: string, chapter: string): string | null {
  const b = book.trim();
  const c = chapter.trim();
  if (!b) return null;
  return c ? `${b} ${c}` : b;
}

/** URL-safe kebab-case slug with a short timestamp suffix to prevent collisions. */
export function generateVideoSlug(title: string): string {
  return (
    title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-") +
    "-" +
    Date.now().toString(36)
  );
}
