// Watchtower Online Library (WOL) URL helpers
// Base: https://wol.jw.org/{locale}/wol/b/{r}/{lp}/nwtsty/{bookNum}/{chapter}
// bookNum is 1-based (Genesis=1 … Revelation=66), matching bookIndex+1

// ── JW Library deep link ──────────────────────────────────────────────────────
// Format: jwlibrary:///finder?bible=BBCCCVVV
// BB = book number (2-digit, 1-based), CCC = chapter (3-digit), VVV = verse (3-digit)
// e.g. Matthew 24:14 → jwlibrary:///finder?bible=40024014

/**
 * Returns a jwlibrary:///finder deep link that opens the exact chapter
 * (verse 1) in the JW Library app. Works on iOS and Android if installed.
 */
export function jwLibraryChapterUrl(bookIndex: number, chapter: number) {
  const bb  = String(bookIndex + 1).padStart(2, "0");
  const ccc = String(chapter).padStart(3, "0");
  return `jwlibrary:///finder?bible=${bb}${ccc}001`;
}

// ── Language map ──────────────────────────────────────────────────────────────

type WolLang = "en" | "es" | "pt" | "fr" | "tl" | "zh" | "ja" | "ko";

const WOL_LANG: Record<WolLang, { locale: string; r: string; lp: string; wtlocale: string }> = {
  en: { locale: "en",       r: "r1",  lp: "lp-e",   wtlocale: "E"   },
  es: { locale: "es",       r: "r4",  lp: "lp-s",   wtlocale: "S"   },
  pt: { locale: "pt",       r: "r5",  lp: "lp-t",   wtlocale: "T"   },
  fr: { locale: "fr",       r: "r30", lp: "lp-f",   wtlocale: "F"   },
  tl: { locale: "tl",       r: "r9",  lp: "lp-tl",  wtlocale: "TGL" },
  zh: { locale: "cmn-Hans", r: "r23", lp: "lp-chs", wtlocale: "CHS" },
  ja: { locale: "ja",       r: "r7",  lp: "lp-j",   wtlocale: "J"   },
  ko: { locale: "ko",       r: "r8",  lp: "lp-ko",  wtlocale: "KO"  },
};

function wolBase(lang: string) {
  const { locale, r, lp } = WOL_LANG[lang as WolLang] ?? WOL_LANG.en;
  return `https://wol.jw.org/${locale}/wol/b/${r}/${lp}/nwtsty`;
}

/**
 * Returns a jw.org /finder URL for an exact book/chapter/verse in any language.
 * Uses the same BBCCCVVV bible parameter as the jwlibrary deep link — no
 * localized slugs, works for all supported languages.
 */
export function jwOrgBibleUrl(bookIndex: number, chapter: number, lang: string = "en", verse: number | null = null) {
  const { wtlocale } = WOL_LANG[lang as WolLang] ?? WOL_LANG.en;
  const bb  = String(bookIndex + 1).padStart(2, "0");
  const ccc = String(chapter).padStart(3, "0");
  const vvv = String(verse ?? 1).padStart(3, "0");
  return `https://www.jw.org/finder?wtlocale=${wtlocale}&pub=nwtsty&bible=${bb}${ccc}${vvv}`;
}

// ── Book name → 0-based index map ─────────────────────────────────────────────
// Covers full names, common abbreviations, and variants found in the app.

const BOOK_NAME_MAP: Record<string, number> = {
  genesis:0, gen:0,
  exodus:1, ex:1, exod:1,
  leviticus:2, lev:2,
  numbers:3, num:3,
  deuteronomy:4, deut:4, deu:4,
  joshua:5, josh:5,
  judges:6, judg:6, jdg:6,
  ruth:7,
  "1 samuel":8, "1samuel":8, "1sam":8,
  "2 samuel":9, "2samuel":9, "2sam":9,
  "1 kings":10, "1kings":10, "1ki":10, "1kgs":10,
  "2 kings":11, "2kings":11, "2ki":11, "2kgs":11,
  "1 chronicles":12, "1chronicles":12, "1ch":12, "1chr":12,
  "2 chronicles":13, "2chronicles":13, "2ch":13, "2chr":13,
  ezra:14,
  nehemiah:15, neh:15,
  esther:16, esth:16, est:16,
  job:17,
  psalms:18, psalm:18, ps:18, psa:18,
  proverbs:19, prov:19, pro:19,
  ecclesiastes:20, eccl:20, ecc:20,
  "song of solomon":21, "song of sol.":21, "song of sol":21, song:21, sos:21,
  isaiah:22, isa:22,
  jeremiah:23, jer:23,
  lamentations:24, lam:24,
  ezekiel:25, ezek:25, eze:25,
  daniel:26, dan:26,
  hosea:27, hos:27,
  joel:28,
  amos:29,
  obadiah:30, obad:30, oba:30,
  jonah:31, jon:31,
  micah:32, mic:32,
  nahum:33, nah:33,
  habakkuk:34, hab:34,
  zephaniah:35, zeph:35, zep:35,
  haggai:36, hag:36,
  zechariah:37, zech:37, zec:37,
  malachi:38, mal:38,
  matthew:39, matt:39, mat:39,
  mark:40,
  luke:41,
  john:42,
  acts:43,
  romans:44, rom:44,
  "1 corinthians":45, "1corinthians":45, "1cor":45,
  "2 corinthians":46, "2corinthians":46, "2cor":46,
  galatians:47, gal:47,
  ephesians:48, eph:48,
  philippians:49, phil:49,
  colossians:50, col:50,
  "1 thessalonians":51, "1thessalonians":51, "1thess":51, "1thes":51,
  "2 thessalonians":52, "2thessalonians":52, "2thess":52, "2thes":52,
  "1 timothy":53, "1timothy":53, "1tim":53,
  "2 timothy":54, "2timothy":54, "2tim":54,
  titus:55, tit:55,
  philemon:56, philem:56, phm:56,
  hebrews:57, heb:57,
  james:58, jas:58,
  "1 peter":59, "1peter":59, "1pet":59,
  "2 peter":60, "2peter":60, "2pet":60,
  "1 john":61, "1john":61, "1jn":61,
  "2 john":62, "2john":62, "2jn":62,
  "3 john":63, "3john":63, "3jn":63,
  jude:64,
  revelation:65, rev:65,
};

// Books with only one chapter — "Jude 9" means chapter 1, verse 9
const SINGLE_CHAPTER_BOOKS = new Set([30, 56, 62, 63, 64]); // Obadiah, Philemon, 2John, 3John, Jude

/**
 * Parses a scripture reference string into its components.
 * Handles "John 14:28", "1 Cor 8:6", "Gen 1:1–3", "Jude 9", etc.
 * Returns { bookIndex, chapter, verse } or null if unrecognised.
 */
export function parseScriptureRef(ref: string | null | undefined) {
  if (!ref) return null;
  // Normalise: collapse whitespace, strip trailing punctuation
  const s = ref.trim().replace(/[.;,]+$/, "");

  // Match: optional-number + space + bookname + space + digits + optional(:digits + optional range)
  // e.g. "1 Corinthians 8:6", "John 5:28–29", "Gen 1:1", "Jude 9"
  const m = s.match(/^(\d\s)?([A-Za-z][\w\s.]*?)\s+(\d+)(?::(\d+)(?:[–\-]\d+)?)?$/);
  if (!m) return null;

  const prefix = m[1] ? m[1].trim() : "";
  const rawName = (prefix ? prefix + " " : "") + m[2].trim();
  const bookKey = rawName.toLowerCase().replace(/\s+/g, " ");
  const bookIndex = BOOK_NAME_MAP[bookKey];
  if (bookIndex === undefined) return null;

  let chapter = parseInt(m[3], 10);
  let verse = m[4] ? parseInt(m[4], 10) : null;

  // Single-chapter books: the number before the colon is actually the verse
  if (!m[4] && SINGLE_CHAPTER_BOOKS.has(bookIndex)) {
    verse = chapter;
    chapter = 1;
  }

  return { bookIndex, chapter, verse };
}

// ── URL builders ──────────────────────────────────────────────────────────────

/**
 * Returns a WOL URL for a specific Bible chapter.
 */
export function wolChapterUrl(bookIndex: number, chapter: number, lang: string = "en") {
  return `${wolBase(lang)}/${bookIndex + 1}/${chapter}`;
}

/**
 * Returns a WOL URL for a specific verse (with #v= anchor).
 */
export function wolVerseUrl(bookIndex: number, chapter: number, verse: number | null, lang: string = "en") {
  const bookNum = bookIndex + 1;
  const base = `${wolBase(lang)}/${bookNum}/${chapter}`;
  return verse ? `${base}#v=${bookNum}_${chapter}_${verse}` : base;
}

/**
 * Parses a scripture reference string and returns its WOL URL, or null.
 */
export function wolRefUrl(ref: string | null | undefined, lang: string = "en") {
  const parsed = parseScriptureRef(ref);
  if (!parsed) return null;
  return wolVerseUrl(parsed.bookIndex, parsed.chapter, parsed.verse, lang);
}

/**
 * Returns a WOL URL for the first chapter of a book (book overview).
 */
export function wolBookUrl(bookIndex: number, lang: string = "en") {
  return `${wolBase(lang)}/${bookIndex + 1}/1`;
}
