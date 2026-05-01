/**
 * Admin route — replace a song's cover image.
 *   POST /api/admin/songs/[id]/cover  (multipart/form-data, field "file")
 *
 * Uploads to the public 'song-covers' bucket at <slug>/cover.<ext>, upserts
 * the row's cover_image_url to the public URL.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

import { authorizeAdmin, jsonResponse, SERVICE_HEADERS, SUPABASE } from "../../_authorize";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdmin(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!id) return jsonResponse({ error: "Missing id" }, 400);

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
  const ext = ALLOWED[file.type];
  if (!ext) {
    return jsonResponse({ error: `Unsupported image type: ${file.type}.` }, 400);
  }
  if (file.size > MAX_BYTES) {
    return jsonResponse({ error: `File exceeds 5 MB limit (${file.size} bytes).` }, 413);
  }

  const path = `${slug}/cover.${ext}`;
  const buffer = await file.arrayBuffer();

  const uploadRes = await fetch(`${SUPABASE.url}/storage/v1/object/song-covers/${path}`, {
    method: "POST",
    headers: {
      ...SERVICE_HEADERS,
      "Content-Type": file.type,
      "Cache-Control": "3600",
      "x-upsert": "true",
    },
    body: buffer,
  });
  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    return jsonResponse({ error: err || "Upload failed" }, uploadRes.status);
  }

  const publicUrl = `${SUPABASE.url}/storage/v1/object/public/song-covers/${path}`;

  const patchRes = await fetch(
    `${SUPABASE.url}/rest/v1/songs?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { ...SERVICE_HEADERS, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ cover_image_url: publicUrl }),
    },
  );
  if (!patchRes.ok) {
    const err = await patchRes.text();
    return jsonResponse({ error: err || "Failed to update cover_image_url" }, patchRes.status);
  }

  return jsonResponse({ cover_image_url: publicUrl });
}
