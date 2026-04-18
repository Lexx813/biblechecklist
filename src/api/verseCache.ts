import { supabase } from "../lib/supabase";

export interface CachedVerse {
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  text: string;
}

function parseRef(ref: string): { book: string; chapter: number; verseStart: number; verseEnd: number | null } | null {
  const m = ref.trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) return null;
  return {
    book: m[1],
    chapter: parseInt(m[2]),
    verseStart: parseInt(m[3]),
    verseEnd: m[4] ? parseInt(m[4]) : null,
  };
}

export const verseCacheApi = {
  getVerse: async (ref: string): Promise<CachedVerse | null> => {
    const parsed = parseRef(ref);
    if (!parsed) return null;
    const { book, chapter, verseStart, verseEnd } = parsed;
    const q = supabase
      .from("verse_cache")
      .select("book, chapter, verse_start, verse_end, text")
      .eq("book", book)
      .eq("chapter", chapter)
      .eq("verse_start", verseStart);
    const { data } = await (verseEnd ? q.eq("verse_end", verseEnd) : q.is("verse_end", null));
    return (data?.[0] as CachedVerse | undefined) ?? null;
  },

  buildJwLibraryUrl: (ref: string): string => {
    const encoded = encodeURIComponent(ref);
    return `https://wol.jw.org/en/wol/b/r1/lp-e/nwtsty?q=${encoded}`;
  },
};
