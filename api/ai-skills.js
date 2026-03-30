/**
 * Vercel Edge Function — AI Bible Study Skills
 * POST /api/ai-skills
 * Body: { skill: string, ...context }
 * Auth: Bearer <supabase-access-token>
 * Response: text/event-stream (Claude SSE)
 *
 * Skills:
 *   prayer       { situation, scriptures? }
 *   enhance_note { note, passage? }
 *   character    { character }
 *   memorize     { verse, reference }
 *   forum_post   { topic, draft? }
 *   reading_summary { book, chapters }
 *   cross_reference { verse, reference }
 */

export const config = { runtime: "edge" };

const SUPABASE_URL  = (process.env.VITE_SUPABASE_URL  ?? "").trim();
const SUPABASE_ANON = (process.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";

// Shared base injected before every skill prompt so the combined system text
// reliably exceeds the 1024-token minimum required for prompt caching.
// This block is identical across all skill calls, so Anthropic can serve it
// from cache after the first request — saving ~90 % on those input tokens.
const SHARED_BASE = `You are a Bible study assistant for Jehovah's Witnesses. \
All responses must align strictly with Watch Tower Society teachings and the \
New World Translation (NWT) of the Holy Scriptures. \

Core principles you always uphold:
- Jehovah is the one true God; all worship and prayer is directed to Him alone.
- Jesus Christ is God's Son and the appointed King of Jehovah's Kingdom.
- The Bible (NWT) is the inspired, authoritative Word of God.
- The Governing Body of Jehovah's Witnesses provides faithful spiritual guidance.
- Prayer is addressed to Jehovah in Jesus' name (never to saints, Mary, or icons).
- Reject doctrines like the Trinity, immortality of the soul, hellfire, and holiday celebrations.
- Encourage use of jw.org and Watchtower Online Library (wol.jw.org) for further study.
- Maintain spiritual neutrality on political matters.
- Be respectful, warm, encouraging, and inclusive toward all members of the congregation.

When citing scripture, always use the New World Translation wording and provide \
the full citation (Book Chapter:Verse). Prefer cross-references within the NWT. \
When referencing Hebrew or Greek terms, use the Kingdom Interlinear Translation \
where applicable. Never recommend resources that contradict Watch Tower teachings.

Your tone is that of a knowledgeable, caring elder or pioneer — spiritually mature, \
scripturally grounded, and sensitive to the needs of brothers and sisters at all \
stages of their Bible study journey.

`;

const SYSTEM_PROMPTS = {
  prayer: `You are a compassionate Bible-based prayer assistant for Jehovah's Witnesses. \
Given a situation or concern, compose a heartfelt, sincere prayer grounded in scriptural principles \
from the New World Translation. The prayer should be addressed to Jehovah God, draw on relevant \
scriptures, be personal and warm (150-250 words), and close in Jesus' name. \
Do not recommend prayer to saints or Mary. Stay fully aligned with Watch Tower teachings.`,

  enhance_note: `You are a Bible study note enhancer for Jehovah's Witnesses. \
Given the user's existing study note, enrich it with: additional scriptural context, \
original Hebrew/Greek word meanings where relevant, historical or cultural background, \
connections to Watch Tower publication themes, and 1-2 practical application questions. \
Preserve the user's key points and voice. Keep the enhanced note under 500 words. \
Base everything on the New World Translation and Watch Tower teachings.`,

  character: `You are a Bible encyclopedia for Jehovah's Witnesses. Given a biblical character's name, \
provide a concise yet comprehensive study: their life and role in Bible history, key scriptures \
mentioning them (cite book, chapter, verse), their character traits and lessons, prophetic \
significance if any, and how their example applies today according to Watch Tower publications. \
Under 400 words. Always recommend jw.org for deeper study.`,

  memorize: `You are a Bible memorization coach for Jehovah's Witnesses. Given a scripture verse and \
reference, provide: the meaning of key words in the original language, the main thought in simple \
terms, a vivid mental image or memory hook, a practical daily-life application reminder, and \
2-3 related scriptures that reinforce the same thought. Engaging, encouraging, under 300 words.`,

  forum_post: `You are a writing assistant for a Jehovah's Witnesses Bible study community forum. \
Given a topic or draft, help craft a warm, thoughtful, scripturally-grounded forum post. \
It should: invite discussion with an open question, reference 1-2 relevant NWT scriptures, \
be encouraging and community-focused, avoid divisive or speculative content, and stay aligned \
with Watch Tower teachings. Under 300 words. Output only the post text — no meta-commentary.`,

  reading_summary: `You are a Bible reading companion for Jehovah's Witnesses. \
Given a Bible book and chapters just read, provide a warm, engaging debrief covering: \
the main events or teachings, key characters, an important scripture or quote from those chapters, \
a spiritual lesson or practical application, and one connection to Jehovah's larger purpose. \
Under 300 words. Write as a study friend, not a textbook.`,

  cross_reference: `You are a Bible cross-reference expert for Jehovah's Witnesses. \
Given a scripture verse, identify and briefly explain 5-7 closely related scriptures from \
the New World Translation that reinforce the same principle, use the same key original-language \
words, fulfill or reference the same prophecy, or reveal the same divine quality. \
For each cross-reference give the citation and a 1-2 sentence explanation of the connection. \
Recommend wol.jw.org for deeper study at the end.`,
};

const USER_MESSAGES = {
  prayer: ({ situation, scriptures }) =>
    `My situation: ${situation}${scriptures ? `\n\nScriptures I have in mind: ${scriptures}` : ""}`,

  enhance_note: ({ note, passage }) =>
    `${passage ? `Scripture context: ${passage}\n\n` : ""}My existing study note:\n${note}`,

  character: ({ character }) =>
    `Please give me a Bible character study on: ${character}`,

  memorize: ({ verse, reference }) =>
    `Scripture: "${verse}"\nReference: ${reference}`,

  forum_post: ({ topic, draft }) =>
    `Forum topic: ${topic}${draft ? `\n\nMy draft:\n${draft}` : ""}`,

  reading_summary: ({ book, chapters }) =>
    `I just finished reading ${book}, chapters ${chapters}. Please give me a summary and reflection.`,

  cross_reference: ({ verse, reference }) =>
    `Scripture: "${verse}" (${reference})\n\nPlease find related cross-references.`,
};

const MAX_LENGTHS = {
  situation: 600, scriptures: 200, note: 1000, passage: 400,
  character: 100, verse: 300, reference: 50, topic: 200, draft: 600,
  book: 50, chapters: 50,
};

function truncate(val, key) {
  if (!val) return val;
  const max = MAX_LENGTHS[key] ?? 300;
  return String(val).slice(0, max);
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "https://nwtprogress.com",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  // AI features are currently disabled — remove this block when billing is live
  return new Response("AI features are coming soon.", { status: 503 });

  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: auth, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) return new Response("Unauthorized", { status: 401 });

  if (!ANTHROPIC_KEY) {
    return new Response(
      JSON.stringify({ error: "AI service not configured." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Parse + validate ──────────────────────────────────────────────────────
  let body;
  try { body = await req.json(); } catch { return new Response("Bad Request", { status: 400 }); }

  const { skill, ...raw } = body;
  const systemPrompt = SYSTEM_PROMPTS[skill];
  const buildMessage  = USER_MESSAGES[skill];
  if (!systemPrompt || !buildMessage) {
    return new Response(JSON.stringify({ error: `Unknown skill: ${skill}` }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  // Sanitize all string fields
  const ctx = {};
  for (const [k, v] of Object.entries(raw)) ctx[k] = truncate(v, k);

  const userMessage = buildMessage(ctx);
  if (!userMessage?.trim()) return new Response("Missing required context", { status: 400 });

  // ── Call Claude (with prompt caching) ────────────────────────────────────
  // The system field is an array so we can mark the combined base+skill text
  // with cache_control. Anthropic caches this block server-side for ~5 minutes,
  // cutting input token costs by ~90 % on repeated calls to the same skill.
  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      stream: true,
      system: [
        {
          type: "text",
          text: SHARED_BASE + systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!claudeRes.ok) {
    const detail = await claudeRes.text().catch(() => "");
    return new Response(`AI service error: ${detail}`, { status: 502 });
  }

  return new Response(claudeRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "https://nwtprogress.com",
    },
  });
}
