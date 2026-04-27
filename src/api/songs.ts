import { supabase } from "../lib/supabase";

/**
 * Lyrics structure stored in songs.lyrics JSONB.
 * Each section corresponds to a Suno-style block (intro, verse, chorus, etc.).
 * Lines are plain text; scripture auto-linking happens at render time only on
 * the primary scripture card and jw_org_links — lyric text is not auto-linked.
 */
export type SongSectionType =
  | "intro"
  | "verse"
  | "pre-chorus"
  | "chorus"
  | "bridge"
  | "toast"
  | "breakdown"
  | "outro"
  | "final-chorus";

export interface SongSection {
  type: SongSectionType;
  /** display label, e.g. "Verse 1", "Chorus", "Pre-Chorus" */
  label?: string;
  /** stage direction shown in italic above the lines, e.g. "rim clicks like knocks" */
  note?: string;
  /** each entry is a line; empty strings render as blank lines */
  lines: string[];
}

export interface SongLyrics {
  sections: SongSection[];
}

export interface JwOrgLink {
  url: string;
  anchor: string;
}

export interface Song {
  id: string;
  slug: string;
  title: string;
  title_es: string | null;
  audio_url: string; // path inside private 'songs' storage bucket
  duration_seconds: number;
  primary_scripture_ref: string;
  primary_scripture_text: string;
  primary_scripture_text_es: string | null;
  theme: string;
  lyrics: SongLyrics;
  lyrics_es: SongLyrics | null;
  description: string;
  description_es: string | null;
  jw_org_links: JwOrgLink[];
  cover_image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  play_count: number;
  download_count: number;
}

const SELECT_COLS =
  "id, slug, title, title_es, audio_url, duration_seconds, " +
  "primary_scripture_ref, primary_scripture_text, primary_scripture_text_es, " +
  "theme, lyrics, lyrics_es, description, description_es, jw_org_links, " +
  "cover_image_url, published, created_at, updated_at, play_count, download_count";

export const songsApi = {
  /**
   * List published songs. When `lang === "es"`, only returns songs with a
   * Spanish translation (lyrics_es + title_es present) so /es/songs never
   * shows untranslated content.
   */
  listPublished: async (lang: "en" | "es" = "en"): Promise<Song[]> => {
    const { data, error } = await supabase
      .from("songs")
      .select(SELECT_COLS)
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as Song[];
    if (lang === "es") {
      return rows.filter(
        (s) => s.title_es && s.lyrics_es && Array.isArray(s.lyrics_es.sections),
      );
    }
    return rows;
  },

  /**
   * Get one published song by slug. When `lang === "es"`, returns null if the
   * Spanish translation is missing — caller should 404.
   */
  getBySlug: async (slug: string, lang: "en" | "es" = "en"): Promise<Song | null> => {
    const { data, error } = await supabase
      .from("songs")
      .select(SELECT_COLS)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const song = data as unknown as Song;
    if (lang === "es" && (!song.title_es || !song.lyrics_es)) {
      return null;
    }
    return song;
  },

  /** Other published songs for the "More songs" footer on a detail page. */
  listOthers: async (
    excludeId: string,
    lang: "en" | "es" = "en",
    limit = 3,
  ): Promise<Song[]> => {
    const all = await songsApi.listPublished(lang);
    return all.filter((s) => s.id !== excludeId).slice(0, limit);
  },

  /** Featured song = newest published (used at top of /songs index). */
  getFeatured: async (lang: "en" | "es" = "en"): Promise<Song | null> => {
    const all = await songsApi.listPublished(lang);
    return all[0] ?? null;
  },
};

/** Localized field accessor — falls back to EN if ES is missing. */
export function localizedTitle(song: Song, lang: "en" | "es"): string {
  return lang === "es" && song.title_es ? song.title_es : song.title;
}
export function localizedDescription(song: Song, lang: "en" | "es"): string {
  return lang === "es" && song.description_es ? song.description_es : song.description;
}
export function localizedScriptureText(song: Song, lang: "en" | "es"): string {
  return lang === "es" && song.primary_scripture_text_es
    ? song.primary_scripture_text_es
    : song.primary_scripture_text;
}
export function localizedLyrics(song: Song, lang: "en" | "es"): SongLyrics {
  return lang === "es" && song.lyrics_es ? song.lyrics_es : song.lyrics;
}
