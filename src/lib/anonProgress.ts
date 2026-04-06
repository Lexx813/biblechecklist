/**
 * Anonymous (logged-out) Bible reading progress.
 *
 * Stored in localStorage under a single key. Shape mirrors the authenticated
 * `reading_progress.progress` blob so migration on signup is a simple merge.
 *
 *   { [bookIndex: number]: { [chapter: number]: boolean } }
 *
 * (No verse-level tracking, no notes, no streaks — those are account features.)
 */

const KEY = "nwt_anon_progress_v1";

export type AnonProgress = Record<number, Record<number, boolean>>;

export function loadAnonProgress(): AnonProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAnonProgress(p: AnonProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* quota / privacy mode — silent fail */
  }
}

export function clearAnonProgress(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch { /* noop */ }
}

/** Total chapters checked across all books. */
export function countAnonChapters(p: AnonProgress): number {
  let n = 0;
  for (const book of Object.values(p)) {
    if (book) for (const v of Object.values(book)) if (v) n++;
  }
  return n;
}

/** True if there is any anon progress worth migrating. */
export function hasAnonProgress(): boolean {
  return countAnonChapters(loadAnonProgress()) > 0;
}
