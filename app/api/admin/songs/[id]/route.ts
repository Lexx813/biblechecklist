/**
 * Admin route — update / delete one song.
 *   PATCH  /api/admin/songs/[id]   body = subset of editable fields
 *   DELETE /api/admin/songs/[id]
 *
 * Auth: bearer token + is_admin = true.
 * On DELETE we also remove the audio object from the private 'songs' bucket.
 * `song_plays` is FK-cascaded by the table definition.
 */

import { authorizeAdmin, jsonResponse, SERVICE_HEADERS, SUPABASE } from "../_authorize";

const EDITABLE_FIELDS = [
  "title",
  "title_es",
  "description",
  "description_es",
  "primary_scripture_ref",
  "primary_scripture_text",
  "primary_scripture_text_es",
  "theme",
  "cover_image_url",
  "duration_seconds",
  "jw_org_links",
  "lyrics",
  "lyrics_es",
  "published",
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

function pickEditable(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of EDITABLE_FIELDS) {
    if (k in input) out[k as EditableField] = input[k];
  }
  return out;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!id) return jsonResponse({ error: "Missing id" }, 400);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const patch = pickEditable(body);
  if (Object.keys(patch).length === 0) {
    return jsonResponse({ error: "No editable fields supplied" }, 400);
  }

  const res = await fetch(
    `${SUPABASE.url}/rest/v1/songs?id=eq.${encodeURIComponent(id)}&select=${ALL_COLS}`,
    {
      method: "PATCH",
      headers: {
        ...SERVICE_HEADERS,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(patch),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    return jsonResponse({ error: err || "Update failed" }, res.status);
  }
  const rows = (await res.json()) as unknown[];
  if (rows.length === 0) return jsonResponse({ error: "Song not found" }, 404);
  return jsonResponse({ song: rows[0] });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!id) return jsonResponse({ error: "Missing id" }, 400);

  // Look up audio_url + slug so we can clean up the storage object
  const lookupRes = await fetch(
    `${SUPABASE.url}/rest/v1/songs?id=eq.${encodeURIComponent(id)}&select=audio_url,slug&limit=1`,
    { headers: SERVICE_HEADERS },
  );
  if (!lookupRes.ok) {
    return jsonResponse({ error: "Lookup failed" }, lookupRes.status);
  }
  const found = (await lookupRes.json()) as Array<{ audio_url: string | null; slug: string }>;
  if (found.length === 0) return jsonResponse({ error: "Song not found" }, 404);
  const { audio_url } = found[0];

  // Delete row first — `song_plays` cascades on the FK.
  const delRes = await fetch(
    `${SUPABASE.url}/rest/v1/songs?id=eq.${encodeURIComponent(id)}`,
    { method: "DELETE", headers: { ...SERVICE_HEADERS, Prefer: "return=minimal" } },
  );
  if (!delRes.ok) {
    const err = await delRes.text();
    return jsonResponse({ error: err || "Delete failed" }, delRes.status);
  }

  // Best-effort storage cleanup. Don't fail the request if this 404s.
  if (audio_url) {
    fetch(`${SUPABASE.url}/storage/v1/object/songs/${encodeURIComponent(audio_url)}`, {
      method: "DELETE",
      headers: SERVICE_HEADERS,
    }).catch(() => {});
  }

  return jsonResponse({ success: true });
}

const ALL_COLS =
  "id,slug,title,title_es,audio_url,duration_seconds," +
  "primary_scripture_ref,primary_scripture_text,primary_scripture_text_es," +
  "theme,lyrics,lyrics_es,description,description_es,jw_org_links," +
  "cover_image_url,published,created_at,updated_at,play_count,download_count";
