/**
 * The set of first-path-segments that the SPA catch-all (`app/[[...slug]]`)
 * considers valid. Anything not here AND not a separate Next route triggers
 * `notFound()` so unknown URLs return a real 404 instead of soft-200.
 *
 * Kept in this shared module so it can be unit-tested without rendering.
 */
export const KNOWN_SPA_ROUTES: ReadonlySet<string> = new Set([
  "admin",
  "advanced-quiz",
  "blog-dash",
  "bookmarks",
  "checklist",
  "community",
  "family-quiz",
  "feed",
  "friends",
  "groups",
  "history",
  "home",
  "invite",
  "leaderboard",
  "learn",
  "login",
  "main",
  "meeting-prep",
  "messages",
  "notifications",
  "premium",
  "privacy",
  "profile",
  "quiz",
  "reading-plans",
  "referral",
  "search",
  "settings",
  "signup",
  "study-notes",
  "study-topics",
  "terms",
  "trivia",
  "try",
  "upgrade",
  "user",
  "videos",
]);

/**
 * Returns the catch-all classification for a given slug array, mirroring the
 * behavior of `app/[[...slug]]/page.tsx`.
 *
 *   classifySlug([])             // 'root'    — renders the SSR landing page
 *   classifySlug(['quiz'])       // 'spa'     — renders SSR teaser + ClientShell
 *   classifySlug(['nonsense'])   // 'notfound'— must trigger notFound()
 */
export type SlugClass = "root" | "spa" | "notfound";

export function classifySlug(slug: string[] | undefined | null): SlugClass {
  if (!slug || slug.length === 0) return "root";
  return KNOWN_SPA_ROUTES.has(slug[0]) ? "spa" : "notfound";
}
