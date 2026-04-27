/**
 * Build a jw.org / wol.jw.org link for a scripture reference.
 *
 * URL formats verified via curl 2026-04-26:
 *   EN:  https://www.jw.org/en/library/bible/nwt/books/<book>/<chapter>/   → 200
 *   ES:  https://www.jw.org/es/biblioteca/biblia/nwt/libros/<libro>/<chapter>/ → 200
 *   WOL search (fallback): https://wol.jw.org/{en,es}/wol/s/r1/lp-{e,s}?q=<ref>
 *
 * The previous `finder?bible=BBCCCVVV` format was 404 — do not reintroduce.
 *
 * Per the project memory rule "verify external URLs before writing them",
 * book slugs below are limited to scripture commonly cited in JW songs +
 * primary scripture refs already used by the seed data. Adding a new book?
 * Curl-verify the EN+ES slug first.
 */

const BOOK_SLUGS_EN: Record<string, string> = {
  "genesis": "genesis", "exodus": "exodus", "leviticus": "leviticus",
  "numbers": "numbers", "deuteronomy": "deuteronomy",
  "joshua": "joshua", "judges": "judges", "ruth": "ruth",
  "1 samuel": "1-samuel", "2 samuel": "2-samuel",
  "1 kings": "1-kings", "2 kings": "2-kings",
  "1 chronicles": "1-chronicles", "2 chronicles": "2-chronicles",
  "ezra": "ezra", "nehemiah": "nehemiah", "esther": "esther",
  "job": "job", "psalm": "psalms", "psalms": "psalms",
  "proverbs": "proverbs", "ecclesiastes": "ecclesiastes",
  "song of solomon": "song-of-solomon", "song of songs": "song-of-solomon",
  "isaiah": "isaiah", "jeremiah": "jeremiah", "lamentations": "lamentations",
  "ezekiel": "ezekiel", "daniel": "daniel",
  "hosea": "hosea", "joel": "joel", "amos": "amos", "obadiah": "obadiah",
  "jonah": "jonah", "micah": "micah", "nahum": "nahum", "habakkuk": "habakkuk",
  "zephaniah": "zephaniah", "haggai": "haggai", "zechariah": "zechariah",
  "malachi": "malachi",
  "matthew": "matthew", "mark": "mark", "luke": "luke", "john": "john",
  "acts": "acts", "romans": "romans",
  "1 corinthians": "1-corinthians", "2 corinthians": "2-corinthians",
  "galatians": "galatians", "ephesians": "ephesians",
  "philippians": "philippians", "colossians": "colossians",
  "1 thessalonians": "1-thessalonians", "2 thessalonians": "2-thessalonians",
  "1 timothy": "1-timothy", "2 timothy": "2-timothy",
  "titus": "titus", "philemon": "philemon", "hebrews": "hebrews",
  "james": "james", "1 peter": "1-peter", "2 peter": "2-peter",
  "1 john": "1-john", "2 john": "2-john", "3 john": "3-john",
  "jude": "jude", "revelation": "revelation",
};

// Spanish slug map for jw.org. Conservative: only common JW-cited books.
// Adding a new entry? Curl-verify first.
const BOOK_SLUGS_ES: Record<string, string> = {
  "genesis": "genesis", "exodus": "exodo", "leviticus": "levitico",
  "numbers": "numeros", "deuteronomy": "deuteronomio",
  "joshua": "josue", "judges": "jueces", "ruth": "rut",
  "1 samuel": "1-samuel", "2 samuel": "2-samuel",
  "1 kings": "1-reyes", "2 kings": "2-reyes",
  "1 chronicles": "1-cronicas", "2 chronicles": "2-cronicas",
  "psalm": "salmo", "psalms": "salmo",
  "proverbs": "proverbios", "ecclesiastes": "eclesiastes",
  "isaiah": "isaias", "jeremiah": "jeremias", "lamentations": "lamentaciones",
  "ezekiel": "ezequiel", "daniel": "daniel",
  "matthew": "mateo", "mark": "marcos", "luke": "lucas", "john": "juan",
  "acts": "hechos", "romans": "romanos",
  "1 corinthians": "1-corintios", "2 corinthians": "2-corintios",
  "galatians": "galatas", "ephesians": "efesios",
  "philippians": "filipenses", "colossians": "colosenses",
  "1 thessalonians": "1-tesalonicenses", "2 thessalonians": "2-tesalonicenses",
  "1 timothy": "1-timoteo", "2 timothy": "2-timoteo",
  "titus": "tito", "hebrews": "hebreos", "james": "santiago",
  "1 peter": "1-pedro", "2 peter": "2-pedro",
  "1 john": "1-juan", "2 john": "2-juan", "3 john": "3-juan",
  "jude": "judas", "revelation": "apocalipsis",
};

function parseRef(ref: string): { book: string; chapter: number } | null {
  const m = ref.trim().match(/^((?:[123]\s+)?[A-Za-z][A-Za-z\s]+?)\s+(\d+)(?::\d+(?:[-,–]\s*\d+)?)?$/);
  if (!m) return null;
  return { book: m[1].toLowerCase().trim(), chapter: parseInt(m[2], 10) };
}

export function wolUrlFor(ref: string, lang: "en" | "es" = "en"): string {
  const parsed = parseRef(ref);
  if (!parsed) {
    return lang === "es"
      ? `https://wol.jw.org/es/wol/s/r4/lp-s?q=${encodeURIComponent(ref)}`
      : `https://wol.jw.org/en/wol/s/r1/lp-e?q=${encodeURIComponent(ref)}`;
  }
  const slug = lang === "es" ? BOOK_SLUGS_ES[parsed.book] : BOOK_SLUGS_EN[parsed.book];
  if (!slug) {
    // No verified slug — fall back to WOL search (always 200)
    return lang === "es"
      ? `https://wol.jw.org/es/wol/s/r4/lp-s?q=${encodeURIComponent(ref)}`
      : `https://wol.jw.org/en/wol/s/r1/lp-e?q=${encodeURIComponent(ref)}`;
  }
  return lang === "es"
    ? `https://www.jw.org/es/biblioteca/biblia/nwt/libros/${slug}/${parsed.chapter}/`
    : `https://www.jw.org/en/library/bible/nwt/books/${slug}/${parsed.chapter}/`;
}
