/**
 * POST /api/translate
 * Body: { title: string, excerpt: string, content: string, targetLang: string }
 * Auth: Bearer <supabase-access-token>
 * Response: text/event-stream (Anthropic SSE piped through)
 *
 * Claude outputs translations in a delimited format:
 *   ---TITLE---
 *   ---EXCERPT---
 *   ---CONTENT---
 */

// Switched off the Edge runtime so we can share the Node `@upstash/ratelimit`
// helper at src/lib/ratelimit.ts. Streaming still works on Node functions.
export const runtime = "nodejs";

import { rateLimit, rateLimitResponse } from "../../../src/lib/ratelimit";
import { withApiHandler } from "../../../src/lib/apiError";

const SUPABASE_URL  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "").trim();
const SUPABASE_ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";

const LANG_LABELS: Record<string, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  tl: "Tagalog",
  fr: "French",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
};

export const POST = withApiHandler(async (req: Request) => {
  // ── Auth ─────────────────────────────────────────────────────────────────────
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
  const { id: userId } = (await userRes.json()) as { id: string };

  // ── Rate limit ────────────────────────────────────────────────────────────────
  const rl = await rateLimit("translate", userId);
  if (!rl.ok) return rateLimitResponse(rl);

  // ── Guard ─────────────────────────────────────────────────────────────────────
  if (!ANTHROPIC_KEY) {
    return new Response(
      JSON.stringify({ error: "AI service not configured." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────────
  let title: string, excerpt: string, content: string, targetLang: string;
  try {
    const body = await req.json();
    title      = String(body.title      ?? "").slice(0, 300);
    excerpt    = String(body.excerpt    ?? "").slice(0, 600);
    content    = String(body.content    ?? "").slice(0, 20000);
    targetLang = String(body.targetLang ?? "").slice(0, 10);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  if (!targetLang || !title) {
    return new Response("Missing title or targetLang", { status: 400 });
  }

  const langLabel = LANG_LABELS[targetLang] ?? targetLang;

  // ── Call Claude with streaming ────────────────────────────────────────────────
  const userPrompt = [
    `Translate the following blog post into ${langLabel}.`,
    `Output ONLY the translation in this exact format — no preamble, no explanation:`,
    ``,
    `---TITLE---`,
    `[translated title]`,
    `---EXCERPT---`,
    `[translated excerpt]`,
    `---CONTENT---`,
    `[translated HTML content — preserve ALL HTML tags exactly]`,
    ``,
    `Title:`,
    title,
    ``,
    `Excerpt:`,
    excerpt,
    ``,
    `Content:`,
    content,
  ].join("\n");

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      stream: true,
      system: "You are a translation assistant. Translate blog posts accurately and naturally, preserving all HTML tags and structure. Output only the requested format.",
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!claudeRes.ok) {
    const detail = await claudeRes.text().catch(() => "");
    console.error("[translate] Claude API error:", claudeRes.status, detail.slice(0, 200));
    return new Response("AI service temporarily unavailable", { status: 502 });
  }

  return new Response(claudeRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}, { route: "translate.POST", publicMessage: "Translation failed. Please try again." });
