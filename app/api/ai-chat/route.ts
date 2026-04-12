/**
 * App Router Edge Route — AI Study Companion (multi-turn chat)
 * POST /api/ai-chat
 * Body: { messages: [{role: "user"|"assistant", content: string}] }
 * Auth: Bearer <supabase-access-token>
 * Response: text/event-stream (Anthropic SSE piped through)
 */

export const runtime = "edge";

const SUPABASE_URL  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "").trim();
const SUPABASE_ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";

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

## Prohibited Sources
Do NOT cite, recommend, or draw from: Blue Letter Bible, non-JW commentaries, other denominations, or Wikipedia for doctrinal claims.

## Research Instructions
1. For word/person studies → Use **Insight (it)** first
2. For defending beliefs → Use **Reasoning (rs)** first
3. For historical context → Use **Proclaimers (jv)**
4. For prophetic books → Use the corresponding study publication (dp, jr, re, rr)
5. For organizational questions → Use **Organized (od)**
6. Cite NWT scriptures by book, chapter, and verse — and ALWAYS link them
7. Always direct users to wol.jw.org or jw.org for further study

## Bible Verse Links (REQUIRED)
Every Bible reference you mention MUST be a markdown link using the JW.org NWT Study Bible URL.

URL pattern: https://www.jw.org/en/library/bible/study-bible/books/{book-slug}/{chapter}/

Book slug rules:
- Lowercase, spaces and numbers joined with a hyphen
- Examples: genesis, exodus, psalms, song-of-solomon, matthew, john, acts, romans,
  1-corinthians, 2-corinthians, galatians, ephesians, philippians, colossians,
  1-thessalonians, 2-thessalonians, 1-timothy, 2-timothy, titus, philemon,
  hebrews, james, 1-peter, 2-peter, 1-john, 2-john, 3-john, jude, revelation,
  1-samuel, 2-samuel, 1-kings, 2-kings, 1-chronicles, 2-chronicles

Format every scripture reference as: [Book Chapter:Verse](https://www.jw.org/en/library/bible/study-bible/books/{book-slug}/{chapter}/)

Examples:
- [John 3:16](https://www.jw.org/en/library/bible/study-bible/books/john/3/)
- [Psalm 83:18](https://www.jw.org/en/library/bible/study-bible/books/psalms/83/)
- [Romans 8:38, 39](https://www.jw.org/en/library/bible/study-bible/books/romans/8/)
- [1 Corinthians 15:26](https://www.jw.org/en/library/bible/study-bible/books/1-corinthians/15/)

Never write a bare scripture reference — always hyperlink it.

## Response Style
- Warm, natural tone — not stiff or AI-generated sounding
- Concise (under 400 words unless a deep study is explicitly requested)
- Use Scripture as the primary evidence; let the Bible speak for itself
- Be encouraging and accurate to Watch Tower teachings`;

export async function POST(req: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────
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

  // ── Guard ──────────────────────────────────────────────────────────────
  if (!ANTHROPIC_KEY) {
    return new Response(
      JSON.stringify({ error: "AI service not configured." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Parse body ─────────────────────────────────────────────────────────
  let messages: { role: "user" | "assistant"; content: string }[] = [];
  try {
    const body = await req.json();
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response("Missing messages", { status: 400 });
    }
    messages = (body.messages as unknown[])
      .filter(
        (m): m is { role: string; content: string } =>
          typeof m === "object" &&
          m !== null &&
          (((m as { role: string }).role) === "user" || ((m as { role: string }).role) === "assistant") &&
          typeof (m as { content: string }).content === "string"
      )
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content.slice(0, 2000),
      }))
      .slice(-20); // keep last 20 turns max
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return new Response("Last message must be from user", { status: 400 });
  }

  // ── Call Claude with streaming ─────────────────────────────────────────
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

  // Pipe Anthropic SSE straight back to the client
  return new Response(claudeRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
