import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveAuthedUserId } from "../../../trivia/_auth";
import { getSignedDownloadUrl } from "../../../../../src/lib/songs/signedAudio";

/**
 * Auth-gated download endpoint. Returns a signed Storage URL only when the
 * caller presents a valid Bearer token in the Authorization header.
 *
 * Anonymous callers get 401 so the client can prompt for sign-in. We track
 * the download event server-side after auth passes so it can't be spoofed
 * client-side and so we don't double-count when the client-side trackEvent
 * helper runs.
 */

// Lazy — never call createClient at module load. Next.js's "Collecting page
// data" step evaluates each route's module without preview env vars, which
// makes the non-null assertions blow up the entire build. Defer to the handler.
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function safeFilename(title: string, slug: string): string {
  const cleaned = title.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "-");
  return `${cleaned || slug}.mp3`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const userId = await resolveAuthedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  }

  const { slug } = await params;

  const supabaseAdmin = getSupabaseAdmin();

  const { data: song, error: songErr } = await supabaseAdmin
    .from("songs")
    .select("id, slug, title, audio_url, published")
    .eq("slug", slug)
    .maybeSingle();

  if (songErr || !song || !song.published) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const filename = safeFilename(song.title, song.slug);
  const url = await getSignedDownloadUrl(song.audio_url, filename, 3600);

  if (!url) {
    return NextResponse.json({ error: "signing_failed" }, { status: 500 });
  }

  // Track the download event server-side (post-auth) — never trust a client claim
  await supabaseAdmin.from("song_plays").insert({
    song_id: song.id,
    event_type: "download",
    source: req.headers.get("referer") ? "site" : "direct",
  });

  return NextResponse.json({ url, filename });
}
