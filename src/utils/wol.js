// Watchtower Online Library (WOL) URL helpers
// Base: https://wol.jw.org/en/wol/b/r1/lp-e/nwtsty/{bookNum}/{chapter}
// bookNum is 1-based (Genesis=1 … Revelation=66), matching bookIndex+1

const WOL_BASE = "https://wol.jw.org/en/wol/b/r1/lp-e/nwtsty";

/**
 * Returns a WOL URL for a specific Bible chapter.
 * @param {number} bookIndex  0-based index into BOOKS array
 * @param {number} chapter    1-based chapter number
 */
export function wolChapterUrl(bookIndex, chapter) {
  return `${WOL_BASE}/${bookIndex + 1}/${chapter}`;
}

/**
 * Returns a WOL URL for the first chapter of a book (book overview).
 * @param {number} bookIndex  0-based index into BOOKS array
 */
export function wolBookUrl(bookIndex) {
  return `${WOL_BASE}/${bookIndex + 1}/1`;
}
