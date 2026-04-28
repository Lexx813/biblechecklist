/**
 * Admin route — create a new song.
 *   POST /api/admin/songs   (multipart/form-data)
 *
 * Required fields:
 *   - file: audio/mpeg
 *   - meta: JSON string with { slug, title, primary_scripture_ref, ... }
 *   - lyrics_md: raw lyric markdown body (parsed server-side)
 *
 * Optional fields:
 *   - lyrics_es_md: Spanish lyrics markdown
 *
 * Behaviour:
 *   1. Upload audio to private 'songs' bucket at <slug>/audio.mp3
 *   2. Parse lyrics markdown into the JSONB structure
 *   3. Insert row in songs (published=false by default — admin must publish)
 */

export const runtime = "nodejs";
export const maxDuration = 60;

import { authorizeAdmin, jsonResponse, SERVICE_HEADERS, SUPABASE } from "./_authorize";
import { parseSongLyrics } from "../../../../src/lib/parseSongLyrics";

const ALLOWED_MIME = new Set(["audio/mpeg", "audio/mp3"]);
const MAX_BYTES = 25 * 1024 * 1024;

interface CreateMeta {
  slug: string;
  title: string;
  title_es?: string | null;
  primary_scripture_ref: string;
  primary_scripture_text: string;
  primary_scripture_text_es?: string | null;
  theme: string;
  description: string;
  description_es?: string | null;
  cover_image_url?: string | null;
  duration_seconds?: number;
  jw_org_links?: Array<{ url: string; anchor: string }>;
  published?: boolean;
}

function isValidSlug(s: unknown): s is string {
  return typeof s === "string" && /^[a-z0-9-]+$/.test(s) && s.length > 0 && s.length <= 80;
}

export async function POST(req: Request) {
  const auth = await authorizeAdmin(req);
  if (auth instanceof Response) return auth;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonResponse({ error: "Expected multipart/form-data" }, 400);
  }

  // Metadata
  const metaRaw = form.get("meta");
  if (typeof metaRaw !== "string") return jsonResponse({ error: "Missing 'meta' JSON field" }, 400);
  let meta: CreateMeta;
  try {
    meta = JSON.parse(metaRaw) as CreateMeta;
  } catch {
    return jsonResponse({ error: "Invalid meta JSON" }, 400);
  }
  if (!isValidSlug(meta.slug)) {
    return jsonResponse({ error: "slug must be lowercase letters/numbers/hyphens" }, 400);
  }
  for (const field of ["title", "primary_scripture_ref", "primary_scripture_text", "theme", "description"] as const) {
    if (!meta[field] || typeof meta[field] !== "string") {
      return jsonResponse({ error: `meta.${field} is required` }, 400);
    }
  }

  // Lyrics
  const lyricsMd = form.get("lyrics_md");
  if (typeof lyricsMd !== "string" || !lyricsMd.trim()) {
    return jsonResponse({ error: "Missing 'lyrics_md' field" }, 400);
  }
  const lyrics = parseSongLyrics(lyricsMd);
  if (lyrics.sections.length === 0) {
    return jsonResponse({ error: "lyrics_md parsed to zero sections — check ### [Section] headings" }, 400);
  }

  let lyrics_es: ReturnType<typeof parseSongLyrics> | null = null;
  const lyricsEsMd = form.get("lyrics_es_md");
  if (typeof lyricsEsMd === "string" && lyricsEsMd.trim()) {
    const parsed = parseSongLyrics(lyricsEsMd);
    if (parsed.sections.length > 0) lyrics_es = parsed;
  }

  // Audio
  const file = form.get("file");
  if (!(file instanceof File)) return jsonResponse({ error: "Missing 'file' field" }, 400);
  if (!ALLOWED_MIME.has(file.type)) {
    return jsonResponse({ error: `Unsupported audio type: ${file.type}` }, 400);
  }
  if (file.size > MAX_BYTES) {
    return jsonResponse({ error: `File exceeds 25 MB (${file.size} bytes)` }, 413);
  }

  // Reject duplicate slug up front (better UX than a 409 from the DB)
  const dupRes = await fetch(
    `${SUPABASE.url}/rest/v1/songs?slug=eq.${encodeURIComponent(meta.slug)}&select=id&limit=1`,
    { headers: SERVICE_HEADERS },
  );
  if (dupRes.ok) {
    const dup = (await dupRes.json()) as unknown[];
    if (dup.length > 0) return jsonResponse({ error: "A song with that slug already exists" }, 409);
  }

  // Upload audio
  const path = `${meta.slug}/audio.mp3`;
  const buffer = await file.arrayBuffer();
  const uploadRes = await fetch(`${SUPABASE.url}/storage/v1/object/songs/${path}`, {
    method: "POST",
    headers: {
      ...SERVICE_HEADERS,
      "Content-Type": "audio/mpeg",
      "Cache-Control": "3600",
      "x-upsert": "true",
    },
    body: buffer,
  });
  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    return jsonResponse({ error: err || "Audio upload failed" }, uploadRes.status);
  }

  // Insert row
  const row = {
    slug: meta.slug,
    title: meta.title,
    title_es: meta.title_es ?? null,
    audio_url: path,
    duration_seconds: meta.duration_seconds ?? 240,
    primary_scripture_ref: meta.primary_scripture_ref,
    primary_scripture_text: meta.primary_scripture_text,
    primary_scripture_text_es: meta.primary_scripture_text_es ?? null,
    theme: meta.theme,
    lyrics,
    lyrics_es,
    description: meta.description,
    description_es: meta.description_es ?? null,
    jw_org_links: meta.jw_org_links ?? [],
    cover_image_url: meta.cover_image_url ?? null,
    published: meta.published ?? false,
  };

  const insertRes = await fetch(`${SUPABASE.url}/rest/v1/songs?select=id`, {
    method: "POST",
    headers: { ...SERVICE_HEADERS, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(row),
  });
  if (!insertRes.ok) {
    const err = await insertRes.text();
    // Best-effort cleanup of the orphan audio object
    fetch(`${SUPABASE.url}/storage/v1/object/songs/${path}`, {
      method: "DELETE",
      headers: SERVICE_HEADERS,
    }).catch(() => {});
    return jsonResponse({ error: err || "Insert failed" }, insertRes.status);
  }
  const inserted = (await insertRes.json()) as Array<{ id: string }>;
  return jsonResponse({ id: inserted[0]?.id ?? null });
}
