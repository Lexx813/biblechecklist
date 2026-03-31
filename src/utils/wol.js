// Watchtower Online Library (WOL) URL helpers
// Base: https://wol.jw.org/{locale}/wol/b/{r}/{lp}/nwtsty/{bookNum}/{chapter}
// bookNum is 1-based (Genesis=1 … Revelation=66), matching bookIndex+1

// Maps app i18n language codes → WOL locale segment (locale, r-code, lp-code)
const WOL_LANG = {
  en: { locale: "en",       r: "r1",  lp: "lp-e"   },
  es: { locale: "es",       r: "r4",  lp: "lp-s"   },
  pt: { locale: "pt",       r: "r5",  lp: "lp-t"   },
  fr: { locale: "fr",       r: "r30", lp: "lp-f"   },
  tl: { locale: "tl",       r: "r9",  lp: "lp-tl"  },
  zh: { locale: "cmn-Hans", r: "r23", lp: "lp-chs" },
};

function wolBase(lang) {
  const { locale, r, lp } = WOL_LANG[lang] ?? WOL_LANG.en;
  return `https://wol.jw.org/${locale}/wol/b/${r}/${lp}/nwtsty`;
}

/**
 * Returns a WOL URL for a specific Bible chapter.
 * @param {number} bookIndex  0-based index into BOOKS array
 * @param {number} chapter    1-based chapter number
 * @param {string} [lang]     i18n language code (e.g. "en", "es"); defaults to "en"
 */
export function wolChapterUrl(bookIndex, chapter, lang = "en") {
  return `${wolBase(lang)}/${bookIndex + 1}/${chapter}`;
}

/**
 * Returns a WOL URL for the first chapter of a book (book overview).
 * @param {number} bookIndex  0-based index into BOOKS array
 * @param {string} [lang]     i18n language code; defaults to "en"
 */
export function wolBookUrl(bookIndex, lang = "en") {
  return `${wolBase(lang)}/${bookIndex + 1}/1`;
}
