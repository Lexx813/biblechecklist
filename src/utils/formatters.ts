/**
 * Shared formatting utilities used across pages.
 */

/**
 * Format an ISO date string to a short human-readable date.
 * @param {string} iso
 * @param {"short"|"long"} monthFormat
 */
export function formatDate(iso: string, monthFormat: "short" | "long" = "short") {
  return new Date(iso).toLocaleDateString(undefined, {
    month: monthFormat,
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Resolve a display name from a profile-joined object (blog posts, threads, etc.)
 * Object must have a `profiles` key with `display_name` and optionally `email`.
 */
export function authorName(obj: { profiles?: { display_name?: string; email?: string } } | null | undefined) {
  return obj?.profiles?.display_name || obj?.profiles?.email?.split("@")[0] || "Anonymous";
}

/** Format a number with locale-aware thousands separators. */
export function formatNum(n: number | null | undefined) {
  return (n ?? 0).toLocaleString();
}

/** Strip HTML tags and collapse whitespace, returning plain text. */
export function stripHtml(html = "") {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
