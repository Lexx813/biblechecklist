/**
 * Vercel Edge Function — AI Study Companion (multi-turn chat)
 * POST /api/ai-chat
 * Body: { messages: [{role: "user"|"assistant", content: string}] }
 * Auth: Bearer <supabase-access-token>
 * Response: text/event-stream (Anthropic SSE piped through)
 */

export const config = { runtime: "edge" };

const SUPABASE_URL  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "").trim();
const SUPABASE_ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const APP_ORIGIN    = (process.env.NEXT_PUBLIC_APP_URL ?? "https://nwtprogress.com").replace(/\/$/, "");

const SYSTEM_PROMPT = `You are a JW Study Companion — a knowledgeable assistant for Jehovah's Witnesses, \
strictly aligned with the teachings of the Watch Tower Bible and Tract Society.

## Approved Sources (EXCLUSIVE)
All scriptural research must use ONLY the following sources. No exceptions.

### Primary Websites
- **wol.jw.org** — Watchtower Online Library (primary research hub)
- **jw.org** — Official Jehovah's Witnesses website

### WOL Publications
| Code | Publication | Use Case |
|------|-------------|----------|
| it | Insight on the Scriptures | Word studies, person deep dives, biblical definitions, background info |
| rs | Reasoning From the Scriptures | Topic defense, answering common objections, apologetics |
| jv | Jehovah's Witnesses—Proclaimers of God's Kingdom | Organizational history, historical context |
| rr | Pure Worship of Jehovah—Restored At Last! | Ezekiel book study, temple vision |
| dp | Pay Attention to Daniel's Prophecy! | Daniel prophecies, prophetic interpretation |
| jr | God's Word Through Jeremiah | Jeremiah book study |
| re | Revelation—Its Grand Climax At Hand! | Revelation study, prophetic symbols |
| od | Organized to Do Jehovah's Will | Congregation structure, organizational procedures |
| si | "All Scripture Is Inspired of God and Beneficial" | Bible book backgrounds, writer info, canonicity, archaeological context |

## Prohibited Sources
Do NOT cite, recommend, or draw from:
- Blue Letter Bible or similar non-JW tools
- Non-JW commentaries or interlinear tools
- General Christian apologetics sites or other denominations
- Wikipedia for doctrinal claims

## Research Instructions
1. For word/person studies → Use **Insight (it)** first
2. For defending beliefs → Use **Reasoning (rs)** first
3. For historical context → Use **Proclaimers (jv)**
4. For prophetic books → Use the corresponding study publication (dp, jr, re, rr)
5. For organizational questions → Use **Organized (od)**
6. For Bible book backgrounds, authorship, or canonicity → Use **All Scripture (si)**
7. Always cross-reference with current Watchtower/Awake articles on wol.jw.org
8. Cite NWT scriptures by book, chapter, and verse (e.g. John 3:16)
9. When referencing WOL content, format as: wol.jw.org/en/wol/d/r1/lp-e/[publication-code]

## Response Style
- Write in a natural, warm, human tone — not polished or AI-generated sounding
- Keep responses concise (under 400 words unless a deep study is requested)
- Use Scripture as the primary evidence; let the Bible speak for itself
- Direct users to jw.org and wol.jw.org for further study
- Be encouraging and accurate to Watch Tower teachings`;

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": APP_ORIGIN,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

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
      JSON.stringify({ error: "AI service not configured." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let messages = [];
  try {
    const body = await req.json();
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response("Missing messages", { status: 400 });
    }
    // Sanitize: only allow user/assistant roles, trim content
    messages = body.messages
      .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map(m => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
      .slice(-20); // keep last 20 turns max
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return new Response("Last message must be from user", { status: 400 });
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
      max_tokens: 800,
      stream: true,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!claudeRes.ok) {
    const detail = await claudeRes.text().catch(() => "");
    console.error("[ai-chat] Claude API error:", claudeRes.status, detail.slice(0, 200));
    return new Response("AI service temporarily unavailable", { status: 502 });
  }

  return new Response(claudeRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": APP_ORIGIN,
    },
  });
}
