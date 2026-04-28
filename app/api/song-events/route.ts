import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Anonymous song event endpoint. Writes to public.song_plays via the service
 * role key (RLS-bypassing). This is the only path for client-side analytics
 * since `song_plays` has no client-write RLS policy.
 *
 * Phase 6 — basic implementation. Future polish:
 *  - Upstash Redis rate limit per-IP per-song to suppress bot floods
 *  - Server-side referrer parsing to derive `source` (tiktok/instagram/...)
 *  - Validate `share_platform` against an enum
 */

// Lazy — see app/api/trivia/_auth.ts for the rationale (Vercel preview build
// "Collecting page data" pass evaluates modules without runtime env vars).
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const VALID_EVENTS = new Set(["play", "complete", "share", "jw_org_click", "download"]);

type Body = {
  song_id?: string;
  event_type?: string;
  source?: string | null;
  share_platform?: string | null;
  jw_org_url?: string | null;
};

export async function POST(req: NextRequest) {
  const supabase = getServiceClient();
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { song_id, event_type } = body;
  if (!song_id || typeof song_id !== "string") {
    return NextResponse.json({ error: "song_id required" }, { status: 400 });
  }
  if (!event_type || !VALID_EVENTS.has(event_type)) {
    return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
  }

  // Derive source from referrer if not explicitly provided
  let source = body.source ?? null;
  if (!source) {
    const ref = req.headers.get("referer") ?? "";
    if (/tiktok\.com/i.test(ref)) source = "tiktok";
    else if (/instagram\.com/i.test(ref)) source = "instagram";
    else if (/x\.com|twitter\.com/i.test(ref)) source = "x";
    else if (/youtube\.com|youtu\.be/i.test(ref)) source = "youtube";
    else if (/facebook\.com/i.test(ref)) source = "facebook";
    else if (/whatsapp\.com|wa\.me/i.test(ref)) source = "whatsapp";
    else if (ref) source = "referral";
    else source = "direct";
  }

  const insertRow = {
    song_id,
    event_type,
    source,
    share_platform: event_type === "share" ? body.share_platform ?? null : null,
    jw_org_url: event_type === "jw_org_click" ? body.jw_org_url ?? null : null,
  };

  const { error } = await supabase.from("song_plays").insert(insertRow);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
