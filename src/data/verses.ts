// @ts-nocheck
// Daily verse pool — text and refs now live in locales/*/translation.json
// under the "verses" array key, enabling full per-language translation.
export const VERSE_COUNT = 66;

// Returns today's verse index deterministically (rotates daily)
export function getDailyVerseIndex() {
  const start = new Date(2024, 0, 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today - start) / 86400000) % VERSE_COUNT;
}
