import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, rateLimitResponse } from "../../../src/lib/ratelimit";
import { withApiHandler } from "../../../src/lib/apiError";

/**
 * Anonymous song event endpoint. Writes to public.song_plays via the service
 * role key (RLS-bypassing). This is the only path for client-side analytics
 * since `song_plays` has no client-write RLS policy.
 *
 * Hardening (2026-05-07):
 *  - Per-IP-per-song rate limit (30/min) — blocks bot floods, lets real
 *    TikTok-driven landing bursts through.
 *  - Enum validation on share_platform.
 *  - Length cap on jw_org_url (defends against table bloat from junk).
 *  - UUID validation on song_id (rejects non-UUID strings before DB hit).
 *  - Server-side referrer parsing for `source`.
 */

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const VALID_EVENTS = new Set(["play", "complete", "share", "jw_org_click", "download"]);
const VALID_SHARE_PLATFORMS = new Set([
  "tiktok",
  "instagram",
  "x",
  "twitter",
  "youtube",
  "facebook",
  "whatsapp",
  "telegram",
  "messenger",
  "email",
  "sms",
  "copy",
  "other",
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_URL_LEN = 500;

type Body = {
  song_id?: unknown;
  event_type?: unknown;
  source?: unknown;
  share_platform?: unknown;
  jw_org_url?: unknown;
};

function deriveSourceFromReferer(ref: string): string {
  if (/tiktok\.com/i.test(ref)) return "tiktok";
  if (/instagram\.com/i.test(ref)) return "instagram";
  if (/x\.com|twitter\.com/i.test(ref)) return "x";
  if (/youtube\.com|youtu\.be/i.test(ref)) return "youtube";
  if (/facebook\.com/i.test(ref)) return "facebook";
  if (/whatsapp\.com|wa\.me/i.test(ref)) return "whatsapp";
  if (ref) return "referral";
  return "direct";
}

export const POST = withApiHandler(async (req: NextRequest) => {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.song_id !== "string" || !UUID_RE.test(body.song_id)) {
    return NextResponse.json({ error: "song_id must be a UUID" }, { status: 400 });
  }
  if (typeof body.event_type !== "string" || !VALID_EVENTS.has(body.event_type)) {
    return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
  }

  const songId = body.song_id;
  const eventType = body.event_type;

  const ip =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (ip !== "unknown") {
    const rl = await rateLimit("songEvents", `${ip}:${songId}`);
    if (!rl.ok) return rateLimitResponse(rl);
  }

  let source: string | null =
    typeof body.source === "string" && body.source.length <= 50 ? body.source : null;
  if (!source) {
    source = deriveSourceFromReferer(req.headers.get("referer") ?? "");
  }

  let sharePlatform: string | null = null;
  if (eventType === "share") {
    if (typeof body.share_platform === "string" && VALID_SHARE_PLATFORMS.has(body.share_platform)) {
      sharePlatform = body.share_platform;
    } else if (body.share_platform != null) {
      return NextResponse.json({ error: "Invalid share_platform" }, { status: 400 });
    }
  }

  let jwOrgUrl: string | null = null;
  if (eventType === "jw_org_click") {
    if (typeof body.jw_org_url === "string") {
      if (body.jw_org_url.length > MAX_URL_LEN) {
        return NextResponse.json({ error: "jw_org_url too long" }, { status: 400 });
      }
      // Basic shape check — must look like an http(s) URL. Don't fetch / parse
      // beyond that; we just store it for analytics.
      if (!/^https?:\/\//i.test(body.jw_org_url)) {
        return NextResponse.json({ error: "jw_org_url must be http(s)" }, { status: 400 });
      }
      jwOrgUrl = body.jw_org_url;
    }
  }

  const insertRow = {
    song_id: songId,
    event_type: eventType,
    source,
    share_platform: sharePlatform,
    jw_org_url: jwOrgUrl,
  };

  const supabase = getServiceClient();
  const { error } = await supabase.from("song_plays").insert(insertRow);
  if (error) {
    // FK violation on song_id → 404 (event for a deleted/non-existent song).
    if ((error as { code?: string }).code === "23503") {
      return NextResponse.json({ error: "song not found" }, { status: 404 });
    }
    throw new Error(`song_plays insert failed: ${error.message}`);
  }

  return NextResponse.json({ ok: true });
}, { route: "song-events.POST", publicMessage: "Could not record event." });
