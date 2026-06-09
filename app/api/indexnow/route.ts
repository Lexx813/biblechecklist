import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { submitToIndexNow } from "../../../src/lib/indexnow";

/**
 * Constant-time secret check. Returns false (fail closed) when the env secret
 * is unset, the provided secret is missing, or the lengths differ — guarding
 * the length mismatch first so timingSafeEqual never throws.
 */
function secretMatches(provided: string | null): boolean {
  const expected = process.env.INDEXNOW_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Internal endpoint for triggering IndexNow submissions after publish events.
 *
 * Authentication: caller must include `x-indexnow-secret` matching the
 * `INDEXNOW_SECRET` env var. Same simple shared-secret pattern as the cron
 * endpoints in this project. Without the secret, the route 401s — anyone
 * could otherwise spam Bing/Yandex with arbitrary URLs in our name.
 *
 * Body: { urls: string[] }
 *
 * Wire up by POSTing from blog publish / song publish flows. Edge functions
 * (supabase/functions/*) can call this directly with `fetch`. Client-side
 * publish flows should also hit this so newly published posts get crawled
 * within hours instead of days by Bing/Yandex/Naver.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-indexnow-secret");
  if (!secretMatches(secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { urls?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const urls = Array.isArray(body.urls)
    ? body.urls.filter((u): u is string => typeof u === "string")
    : [];

  if (!urls.length) {
    return NextResponse.json({ error: "no urls" }, { status: 400 });
  }

  // Cap at 10,000 per IndexNow's published limit.
  await submitToIndexNow(urls.slice(0, 10000));

  return NextResponse.json({ submitted: urls.length });
}
