/**
 * Vercel Edge Function — AI Bible study companion
 * POST /api/ai-explain
 * Body: { passage: string, question: string }
 * Auth: Bearer <supabase-access-token>
 * Response: text/event-stream (Anthropic SSE piped through)
 */

export const config = { runtime: "edge" };

const SUPABASE_URL  = (process.env.VITE_SUPABASE_URL  ?? "").trim();
const SUPABASE_ANON = (process.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const APP_ORIGIN    = (process.env.VITE_APP_URL ?? "https://nwtprogress.com").replace(/\/$/, "");

const SYSTEM_PROMPT =
  "You are a Bible study companion for Jehovah's Witnesses, aligned with the teachings and " +
  "publications of the Watch Tower Bible and Tract Society. " +
  "When given a scripture passage and a question, provide a clear, concise explanation " +
  "(under 400 words) grounded in the New World Translation of the Holy Scriptures. " +
  "Draw on the original language meanings (Hebrew/Greek), historical and cultural context, " +
  "and practical application consistent with JW beliefs. " +
  "Always direct the user to jw.org (https://www.jw.org) and the Watchtower Online Library " +
  "(https://wol.jw.org/en/wol/h/r1/lp-e) for further study, publications, and to read the " +
  "referenced scripture in context. " +
  "Do not cite or recommend non-JW religious sources, commentaries, or denominations. " +
  "Be warm, encouraging, and accurate to Watch Tower teachings.";

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = auth.slice(7);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!ANTHROPIC_KEY) {
    return new Response(
      JSON.stringify({ error: "AI service not configured — add ANTHROPIC_API_KEY to Vercel env vars." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let passage = "", question = "";
  try {
    const body = await req.json();
    passage  = String(body.passage  ?? "").slice(0, 600);
    question = String(body.question ?? "").slice(0, 300);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }
  if (!passage || !question) {
    return new Response("Missing passage or question", { status: 400 });
  }

  // ── Call Claude with streaming ────────────────────────────────────────────
  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      stream: true,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Scripture passage:\n"${passage}"\n\nQuestion: ${question}`,
        },
      ],
    }),
  });

  if (!claudeRes.ok) {
    const detail = await claudeRes.text().catch(() => "");
    return new Response(`AI service error: ${detail}`, { status: 502 });
  }

  // Pipe Anthropic SSE straight back to the client
  return new Response(claudeRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": APP_ORIGIN,
    },
  });
}
