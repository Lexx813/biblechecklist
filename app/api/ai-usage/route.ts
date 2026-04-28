/**
 * App Router Route — AI Usage
 * GET /api/ai-usage
 * Auth: Bearer <supabase-access-token>
 * Response: { input_used, input_cap, output_used, output_cap, requests_minute, requests_minute_cap, percent_used }
 *
 * Returns the current 24h-rolling-window usage for the authed user, so the
 * AIStudyBubble can display a transparent "X% of today's AI used" pill.
 *
 * Caps mirror the constants in /api/ai-chat/route.ts — keep in sync.
 */

import { withApiHandler } from "../../../src/lib/apiError";

const SUPABASE_URL  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "").trim();
const SUPABASE_ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const SUPABASE_SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

// Mirror /api/ai-chat caps. If those change, change here.
const PER_MINUTE_REQUEST_CAP = 6;
const DAILY_INPUT_TOKEN_CAP  = 100_000;
const DAILY_OUTPUT_TOKEN_CAP = 30_000;

function supabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE,
    Authorization: `Bearer ${SUPABASE_SERVICE}`,
  };
}

export const GET = withApiHandler(async (req: Request) => {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
  const token = auth.slice(7);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) return new Response("Unauthorized", { status: 401 });
  const { id: userId } = (await userRes.json()) as { id: string };

  const now = Date.now();
  const oneMinAgo = new Date(now - 60_000).toISOString();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const [minRes, dayRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/ai_usage_logs?user_id=eq.${userId}&created_at=gte.${oneMinAgo}&select=id`,
      { headers: { ...supabaseHeaders(), Prefer: "count=exact" } },
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/ai_usage_logs?user_id=eq.${userId}&created_at=gte.${oneDayAgo}&select=input_tokens,output_tokens`,
      { headers: supabaseHeaders() },
    ),
  ]);

  let requestsMinute = 0;
  if (minRes.ok) {
    const range = minRes.headers.get("content-range") ?? "0-0/0";
    requestsMinute = parseInt(range.split("/")[1] ?? "0", 10);
  }

  let inputUsed = 0;
  let outputUsed = 0;
  if (dayRes.ok) {
    const rows = (await dayRes.json()) as Array<{ input_tokens: number; output_tokens: number }>;
    for (const r of rows) {
      inputUsed  += r.input_tokens  ?? 0;
      outputUsed += r.output_tokens ?? 0;
    }
  }

  const inputPct  = (inputUsed  / DAILY_INPUT_TOKEN_CAP)  * 100;
  const outputPct = (outputUsed / DAILY_OUTPUT_TOKEN_CAP) * 100;
  const percentUsed = Math.min(100, Math.round(Math.max(inputPct, outputPct)));

  return Response.json(
    {
      input_used:           inputUsed,
      input_cap:            DAILY_INPUT_TOKEN_CAP,
      output_used:          outputUsed,
      output_cap:           DAILY_OUTPUT_TOKEN_CAP,
      requests_minute:      requestsMinute,
      requests_minute_cap:  PER_MINUTE_REQUEST_CAP,
      percent_used:         percentUsed,
    },
    {
      headers: {
        // Short-cache so the UI feels live but we don't hammer the DB
        "Cache-Control": "private, max-age=15",
      },
    },
  );
}, { route: "ai-usage.GET" });
