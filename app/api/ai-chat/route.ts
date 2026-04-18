/**
 * App Router Route — AI Study Companion (multi-turn chat with tools)
 * POST /api/ai-chat
 * Body: { messages, context? }
 * Auth: Bearer <supabase-access-token>
 * Response: text/event-stream
 */

const SUPABASE_URL     = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "").trim();
const SUPABASE_ANON    = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const SUPABASE_SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const ANTHROPIC_KEY    = process.env.ANTHROPIC_API_KEY ?? "";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;
const TOOL_LOOP_LIMIT = 3;

// ── Types ──────────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

interface ContentBlock {
  type: string;
  [key: string]: unknown;
}

interface AppContext {
  page?: string;
  bookIndex?: number;
  bookName?: string;
  chapter?: number;
}

// ── System prompt ──────────────────────────────────────────────────────────────
function buildSystemPrompt(ctx: AppContext): string {
  const PAGE_LABELS: Record<string, string> = {
    blogNew:    "New Blog Post editor",
    blogEdit:   "Edit Blog Post editor",
    main:       "Bible Reading Checklist",
    bookDetail: "Book Detail page",
    blog:       "Blog listing",
    forum:      "Forum",
    studyNotes: "Study Notes",
    home:       "Home",
  };

  const pageLabel = (ctx.page && PAGE_LABELS[ctx.page]) ?? ctx.page ?? "unknown";

  let contextSection = "";
  if (ctx.page) {
    const bookLine   = ctx.bookName ? `\nBook: ${ctx.bookName} (index ${ctx.bookIndex})` : "";
    const chapterLine = ctx.chapter ? `\nChapter: ${ctx.chapter}` : "";

    let pageGuidance = `TOOL USE RULES (MANDATORY):
- If the user says "save a note", "add a note", or similar → call save_note immediately${ctx.bookIndex !== undefined ? ` with book_index=${ctx.bookIndex}` : ""}${ctx.chapter ? ` and chapter=${ctx.chapter}` : ""}. Do NOT describe what you are going to do — just call the tool.
- If the user asks to "write a blog", "draft a post", "create an article", or any similar phrasing → call create_blog_draft immediately with a complete, well-written article (400+ words). Do NOT say "I will do it" or "On it" — call the tool right away. After the tool call, respond with only 1 short sentence confirming the draft is ready (do not repeat the content).`;

    if (ctx.page === "blogNew" || ctx.page === "blogEdit") {
      pageGuidance = `The user is in the blog editor. TOOL USE RULES (MANDATORY):
- If they ask you to "write", "draft", "create", or "generate" a blog post or article → call create_blog_draft IMMEDIATELY with a full, well-written article (400+ words). Do NOT say "I will" or "On it" — call the tool instantly.
- For brainstorming, outlines, or suggestions → respond with text only (no tool needed).
Keep all content aligned with Watch Tower teachings.`;
    }

    contextSection = `\n\n## Current User Context\nPage: ${pageLabel}${bookLine}${chapterLine}\n\n${pageGuidance}`;
  }

  return `You are a JW Study Companion — a knowledgeable assistant for Jehovah's Witnesses, \
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
- Be encouraging and accurate to Watch Tower teachings

## Blog Post Formatting (REQUIRED for create_blog_draft)
Every blog post MUST be richly formatted using the full range of markdown. Never write plain paragraphs only.

**Structure every article with:**
- A compelling opening paragraph (no heading — draw the reader in immediately)
- At least 3 ## section headings that break the article into clear parts
- At least 2 blockquotes using > — use these for powerful scriptures or key thoughts, e.g.:
  > "Draw close to God, and he will draw close to you." — [James 4:8](https://www.jw.org/en/library/bible/study-bible/books/james/4/)
- **Bold** key phrases, names, and important concepts throughout
- At least one bullet list or numbered list to break down points
- A warm closing paragraph with a call to reflection or action
- All scripture references must be hyperlinked as defined above

**Formatting rules:**
- DO NOT start the content with the article title as an H1 — the title is set separately
- DO NOT write walls of plain text — every section should use a mix of prose, bold, lists, and blockquotes
- Minimum 500 words for a full article
- Tone: like a thoughtful elder sharing at a meeting — warm, scripturally grounded, personal${contextSection}`;
}

// ── Tool definitions ───────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: "save_note",
    description: "Save a study note to the user's notebook. Use when the user asks to save, add, or write a note.",
    input_schema: {
      type: "object",
      properties: {
        content:    { type: "string",  description: "The note text to save" },
        book_index: { type: "integer", description: "Bible book index (0=Genesis, 65=Revelation)" },
        chapter:    { type: "integer", description: "Chapter number" },
        verse:      { type: "string",  description: "Verse or verse range (optional, e.g. '16' or '3-5')" },
      },
      required: ["content", "book_index", "chapter"],
    },
  },
  {
    name: "get_my_notes",
    description: "Retrieve the user's saved study notes for a specific book and optional chapter.",
    input_schema: {
      type: "object",
      properties: {
        book_index: { type: "integer", description: "Bible book index (0=Genesis, 65=Revelation)" },
        chapter:    { type: "integer", description: "Chapter number (optional — omit to get all notes for the book)" },
      },
      required: ["book_index"],
    },
  },
  {
    name: "navigate_to",
    description: "Navigate the user to a page in the app. Use when the user asks to go somewhere, open a section, or take them to a feature.",
    input_schema: {
      type: "object",
      properties: {
        page: {
          type: "string",
          description: "The page to navigate to",
          enum: ["home", "main", "blog", "blogNew", "myPosts", "studyNotes", "studyTopics", "forum", "quiz", "readingPlans", "meetingPrep", "bookmarks", "history", "leaderboard", "videos", "profile", "settings"],
        },
      },
      required: ["page"],
    },
  },
  {
    name: "create_blog_draft",
    description: "Create a blog post draft for the user. Use when the user asks to write a blog, article, or post.",
    input_schema: {
      type: "object",
      properties: {
        title:   { type: "string", description: "Blog post title" },
        content: { type: "string", description: "Full blog post content in markdown" },
        excerpt: { type: "string", description: "Short summary (1-2 sentences, max 200 chars)" },
      },
      required: ["title", "content", "excerpt"],
    },
  },
];

// ── Supabase helpers ───────────────────────────────────────────────────────────
function supabaseHeaders() {
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_SERVICE,
    "Authorization": `Bearer ${SUPABASE_SERVICE}`,
    "Prefer": "return=representation",
  };
}

async function executeTool(name: string, input: Record<string, unknown>, userId: string): Promise<string> {
  if (name === "save_note") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/notes`, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({
        user_id:    userId,
        book_index: input.book_index,
        chapter:    input.chapter,
        verse:      input.verse ?? null,
        content:    input.content,
      }),
    });
    if (!res.ok) return `Error saving note: ${await res.text()}`;
    return "Note saved successfully.";
  }

  if (name === "get_my_notes") {
    let url = `${SUPABASE_URL}/rest/v1/notes?user_id=eq.${userId}&book_index=eq.${input.book_index}&select=content,chapter,verse&order=created_at.desc&limit=15`;
    if (input.chapter) url += `&chapter=eq.${input.chapter}`;
    const res = await fetch(url, { headers: supabaseHeaders() });
    if (!res.ok) return `Error fetching notes: ${await res.text()}`;
    const notes = await res.json() as Array<{ chapter: number; verse: string | null; content: string }>;
    if (!notes.length) return "No notes found for this book/chapter.";
    return notes.map(n => `Ch.${n.chapter}${n.verse ? `:${n.verse}` : ""} — ${n.content}`).join("\n");
  }

  if (name === "navigate_to") {
    return `NAVIGATE_TO:${input.page}`;
  }

  if (name === "create_blog_draft") {
    // Return the draft payload — the client populates the editor, WriterPage auto-saves to DB
    return `DRAFT_CREATED:${JSON.stringify({ title: input.title, content: input.content, excerpt: input.excerpt })}`;
  }

  return `Unknown tool: ${name}`;
}

// ── Anthropic call (non-streaming) ─────────────────────────────────────────────
async function callClaude(
  messages: ChatMessage[],
  systemPrompt: string,
  withTools: boolean,
): Promise<Response> {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      stream: false,
      system: systemPrompt,
      messages,
      ...(withTools ? { tools: TOOLS } : {}),
    }),
  });
}

// ── Usage logging (fire-and-forget) ───────────────────────────────────────────
interface Usage { input_tokens: number; output_tokens: number }

// Sonnet 4.6 pricing (per token, USD)
const COST_PER_INPUT  = 3   / 1_000_000;
const COST_PER_OUTPUT = 15  / 1_000_000;

function logUsage(userId: string, usage: Usage, toolUsed: string | null, page: string | undefined): void {
  const cost = usage.input_tokens * COST_PER_INPUT + usage.output_tokens * COST_PER_OUTPUT;
  fetch(`${SUPABASE_URL}/rest/v1/ai_usage_logs`, {
    method: "POST",
    headers: { ...supabaseHeaders(), "Prefer": "return=minimal" },
    body: JSON.stringify({
      user_id:       userId,
      model:         MODEL,
      input_tokens:  usage.input_tokens,
      output_tokens: usage.output_tokens,
      tool_used:     toolUsed,
      page:          page ?? null,
      cost_usd:      cost,
    }),
  }).catch(() => {}); // never block the response
}

// ── Text → SSE stream ──────────────────────────────────────────────────────────
async function textToStream(
  text: string,
  draft?: { title: string; content: string; excerpt: string } | null,
  nav?: string | null,
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const CHUNK = 6;
  const DELAY_MS = 18;
  const chunks: Uint8Array[] = [];

  if (nav) {
    chunks.push(encoder.encode(`data: ${JSON.stringify({ type: "navigate", page: nav })}\n\n`));
  }

  if (draft) {
    // Stream blog content into chatbot character-by-character so user sees it typing,
    // then send the full draft event so the editor auto-opens and reveals content.
    const header = `**${draft.title}**\n\n`;
    for (let i = 0; i < header.length; i += CHUNK) {
      chunks.push(encoder.encode(`data: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: header.slice(i, i + CHUNK) } })}\n\n`));
    }
    for (let i = 0; i < draft.content.length; i += CHUNK) {
      chunks.push(encoder.encode(`data: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: draft.content.slice(i, i + CHUNK) } })}\n\n`));
    }
    // Full draft event — triggers editor auto-open with progressive reveal
    chunks.push(encoder.encode(`data: ${JSON.stringify({ type: "blog_draft", draft })}\n\n`));
    // Separator before confirmation text
    const sep = "\n\n---\n";
    for (let i = 0; i < sep.length; i += CHUNK) {
      chunks.push(encoder.encode(`data: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: sep.slice(i, i + CHUNK) } })}\n\n`));
    }
  }

  for (let i = 0; i < text.length; i += CHUNK) {
    const evt = JSON.stringify({
      type: "content_block_delta",
      delta: { type: "text_delta", text: text.slice(i, i + CHUNK) },
    });
    chunks.push(encoder.encode(`data: ${evt}\n\n`));
  }
  chunks.push(encoder.encode("data: [DONE]\n\n"));

  return new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
      controller.close();
    },
  });
}

function extractText(content: ContentBlock[]): string {
  return content
    .filter((b) => b.type === "text")
    .map((b) => b.text as string)
    .join("");
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  // Auth
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
  const token = auth.slice(7);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) return new Response("Unauthorized", { status: 401 });
  const { id: userId } = await userRes.json() as { id: string };

  if (!ANTHROPIC_KEY) {
    return new Response(JSON.stringify({ error: "AI service not configured." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse body
  let messages: ChatMessage[] = [];
  let context: AppContext = {};
  try {
    const body = await req.json();
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response("Missing messages", { status: 400 });
    }
    messages = (body.messages as unknown[])
      .filter(
        (m): m is { role: string; content: string } =>
          typeof m === "object" && m !== null &&
          (((m as { role: string }).role) === "user" || ((m as { role: string }).role) === "assistant") &&
          typeof (m as { content: string }).content === "string",
      )
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, 2000) }))
      .slice(-20);
    if (body.context && typeof body.context === "object") context = body.context as AppContext;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return new Response("Last message must be from user", { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(context);
  const sseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
  };

  // Tool loop
  let loopMessages: ChatMessage[] = [...messages];
  let loopCount = 0;
  let lastToolUsed: string | null = null;
  let pendingDraft: { title: string; content: string; excerpt: string } | null = null;
  let pendingNav: string | null = null;

  while (loopCount < TOOL_LOOP_LIMIT) {
    const res = await callClaude(loopMessages, systemPrompt, true);
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[ai-chat] Claude API error:", res.status, detail.slice(0, 200));
      return new Response("AI service temporarily unavailable", { status: 502 });
    }

    const data = await res.json() as {
      stop_reason: string;
      content: ContentBlock[];
      usage: Usage;
    };

    if (data.stop_reason !== "tool_use") {
      logUsage(userId, data.usage, lastToolUsed, context.page);
      const text = extractText(data.content);
      return new Response(await textToStream(text, pendingDraft, null), { headers: sseHeaders });
    }

    // Execute all tool_use blocks
    const toolResults: ContentBlock[] = [];
    for (const block of data.content) {
      if (block.type === "tool_use") {
        lastToolUsed = block.name as string;
        const result = await executeTool(
          block.name as string,
          block.input as Record<string, unknown>,
          userId,
        );
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id as string,
          content: result,
        });
      }
    }

    // Normalize tool results — capture special markers
    for (const r of toolResults) {
      const c = r.content as string;
      if (typeof c === "string" && c.startsWith("DRAFT_CREATED:")) {
        try { pendingDraft = JSON.parse(c.slice("DRAFT_CREATED:".length)); } catch { /* ignore */ }
        r.content = "Blog draft is ready for review.";
      } else if (typeof c === "string" && c.startsWith("NAVIGATE_TO:")) {
        pendingNav = c.slice("NAVIGATE_TO:".length);
        r.content = `Navigating to ${pendingNav}.`;
      }
    }

    loopMessages = [
      ...loopMessages,
      { role: "assistant", content: data.content },
      { role: "user",      content: toolResults },
    ];
    loopCount++;
  }

  // After tool loop — get final response (no tools to prevent re-triggering)
  const finalRes = await callClaude(loopMessages, systemPrompt, false);
  if (!finalRes.ok) return new Response("AI service temporarily unavailable", { status: 502 });

  const finalData = await finalRes.json() as { content: ContentBlock[]; usage: Usage };
  logUsage(userId, finalData.usage, lastToolUsed, context.page);
  const finalText = extractText(finalData.content);
  return new Response(await textToStream(finalText, pendingDraft, pendingNav), { headers: sseHeaders });
}
