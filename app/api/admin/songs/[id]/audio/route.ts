/**
 * Admin route — replace a song's audio file.
 *   POST /api/admin/songs/[id]/audio  (multipart/form-data, field "file")
 *
 * Uploads to the private 'songs' bucket at <slug>/audio.mp3, upserting.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

import { authorizeAdmin, jsonResponse, SERVICE_HEADERS, SUPABASE } from "../../_authorize";

const ALLOWED_MIME = new Set(["audio/mpeg", "audio/mp3"]);
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!id) return jsonResponse({ error: "Missing id" }, 400);

  // Look up the slug so we can name the storage object consistently.
  const lookupRes = await fetch(
    `${SUPABASE.url}/rest/v1/songs?id=eq.${encodeURIComponent(id)}&select=slug&limit=1`,
    { headers: SERVICE_HEADERS },
  );
  if (!lookupRes.ok) return jsonResponse({ error: "Lookup failed" }, lookupRes.status);
  const found = (await lookupRes.json()) as Array<{ slug: string }>;
  if (found.length === 0) return jsonResponse({ error: "Song not found" }, 404);
  const { slug } = found[0];

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonResponse({ error: "Expected multipart/form-data" }, 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return jsonResponse({ error: "Missing 'file' field" }, 400);
  if (!ALLOWED_MIME.has(file.type)) {
    return jsonResponse({ error: `Unsupported audio type: ${file.type}. Use audio/mpeg.` }, 400);
  }
  if (file.size > MAX_BYTES) {
    return jsonResponse({ error: `File exceeds 25 MB limit (${file.size} bytes).` }, 413);
  }

  const path = `${slug}/audio.mp3`;
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
    return jsonResponse({ error: err || "Upload failed" }, uploadRes.status);
  }

  // Mirror the audio_url field on the row so older rows that had a different
  // path get re-pointed.
  const patchRes = await fetch(
    `${SUPABASE.url}/rest/v1/songs?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { ...SERVICE_HEADERS, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ audio_url: path }),
    },
  );
  if (!patchRes.ok) {
    const err = await patchRes.text();
    return jsonResponse({ error: err || "Failed to update audio_url" }, patchRes.status);
  }

  return jsonResponse({ audio_url: path });
}
