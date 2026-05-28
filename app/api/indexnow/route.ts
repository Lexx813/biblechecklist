import { NextResponse } from "next/server";
import { submitToIndexNow } from "../../../src/lib/indexnow";

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
  if (!secret || secret !== process.env.INDEXNOW_SECRET) {
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
