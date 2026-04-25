/**
 * App Router Route — AI Study Companion (multi-turn chat with tools)
 * POST /api/ai-chat
 * Body: { messages, context? }
 * Auth: Bearer <supabase-access-token>
 * Response: text/event-stream
 */

import { DOCTRINAL_FAQ, type DoctrinalFaqEntry } from "../../../src/data/doctrinalFaq";
import { BOOKS } from "../../../src/data/books";

const SUPABASE_URL     = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "").trim();
const SUPABASE_ANON    = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const SUPABASE_SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const ANTHROPIC_KEY    = process.env.ANTHROPIC_API_KEY ?? "";

const MODEL = "claude-haiku-4-5-20251001";
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
      pageGuidance = `The user is in the blog editor. You are a blog-writing assistant here.

YOUR CAPABILITIES (tell the user these if they ask what you can do):
- Write a complete, publication-ready blog post draft and load it directly into the editor
- Generate title ideas, outlines, or opening paragraphs
- Help revise or improve any section

TOOL USE RULES (MANDATORY):
- If they ask you to "write", "draft", "create", "generate", or describe a topic they want written about → call create_blog_draft IMMEDIATELY with a full, well-written article (500+ words). Do NOT say "I will" or "On it" — call the tool instantly and load the draft into the editor.
- For brainstorming, outlines, or suggestions → respond with text only (no tool needed).
- If the user seems unsure what to ask, remind them: "Just tell me a topic and I'll write a full draft and load it into the editor for you."
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

## Personalization (get_my_profile)
At the start of a fresh conversation (no prior turns from the user) and whenever the user asks about their progress, what to study, or how they're doing, call \`get_my_profile\`. The result tells you the user's reading streak, books in progress, last few saved notes, and today's date.

Use it to make the conversation feel personal — reference the book they're currently reading by name, acknowledge their streak naturally (without making it a celebration), and tie suggestions to where they actually are. Do NOT call it on every turn; once per conversation is enough.

## Doctrinal Q&A (lookup_doctrinal_faq) — MANDATORY FIRST CALL
For ANY question about Jehovah's Witnesses' beliefs, practices, or doctrines (blood, holidays, Trinity, paradise, hellfire, soul, 1914, the Governing Body, neutrality, Memorial, disfellowshipping, the cross, images, Mary, the 144,000, the great crowd, Armageddon, etc.), you MUST call \`lookup_doctrinal_faq\` first. The tool returns the canonical answer + a wol.jw.org or jw.org source URL.

How to use the result:
1. **Surface, don't innovate.** Restate the published answer in your own warm, pastoral tone — but never add doctrine, never speculate beyond what the publications teach, never disagree with the answer the tool returned.
2. **Link the source.** Always include the \`URL\` field as a markdown link at the end of your response so the user can read the publication directly. Use the URL exactly as returned.
3. **Defer authority.** You are a study aid, not a teacher of the faith. The Governing Body and the publications at wol.jw.org are the channel for spiritual instruction. If the user pushes back on a doctrine, gently point them to the source URL and to wol.jw.org for further study — don't argue.
4. **Tool returns no match?** Say "I'd point you to wol.jw.org for the authoritative answer on that" + quote any relevant scripture from your knowledge of the NWT (linked via the wol URL pattern). Do NOT improvise doctrine the publications don't already teach.

## Meeting Prep Awareness (get_this_week_meeting)
The user can prep for the two weekly Jehovah's Witness meetings (CLAM + Watchtower study) inside the app, and you have access to the scraped agenda.

- When the user mentions "this week's meeting", "the CLAM", "Watchtower study", "meeting prep", "what's on Tuesday", or asks for help thinking through any specific part — call \`get_this_week_meeting\` first. Don't guess the agenda.
- After calling, walk through the relevant parts naturally. Suggest reflection questions, related scriptures (use \`search_scripture\` if topical), or note-taking prompts.
- For "next week" or a specific date, pass \`week_start\`. Otherwise omit it (defaults to current week).
- If the tool reports content not yet scraped, tell the user the scraper runs Monday 06:00 UTC and direct them to wol.jw.org for the meantime.

## Scripture Grounding (search_scripture)
The user's app has a curated theme-verse index across all 66 NWT books, searchable via \`search_scripture\`.

- Before answering doctrinal or topical questions ("what does the Bible say about X", "is hell real", "who is Jesus"), call \`search_scripture(query)\` to surface the curated theme-verses for the topic. Use full natural-language phrasing, e.g. \`search_scripture("paradise on earth")\`.
- Use the returned verse_ref + theme as anchors for your answer. Quote the verse text the tool returned verbatim — never reword it.
- For specific verses the user names directly (e.g. "what does Romans 8:28 say"), the index won't have arbitrary verses. Quote from your knowledge of the NWT, link via the wol.jw.org/jw.org URL pattern in the section above, and continue the answer.
- Skip the tool for casual chat ("hi", "how are you", "thanks").

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
  {
    name: "search_scripture",
    description:
      "Semantically search a curated index of theme-verses across the 66 books of the New World Translation. Returns up to 5 verses ranked by relevance. Use BEFORE answering doctrinal or topical questions to surface representative verses for the topic. The index is curated theme-verses (not the full Bible), so use this for topical grounding, not for quoting an arbitrary verse — for arbitrary verses, quote from your knowledge of the NWT and link via wol.jw.org as the system prompt requires.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Topic, theme, or question to search for. Use full natural-language phrasing — the search uses semantic embeddings, not keyword match." },
        limit: { type: "integer", description: "Number of verses to return (1-10, default 5)" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_my_profile",
    description:
      "Get the current user's study profile: reading streak, books completed/in-progress, last few saved notes, today's date. Use AT THE START of a new conversation when the user opens the chat with no context, OR when the user asks about their progress, what they should study, or how they're doing. Use the result to make conversation feel personal — reference the book they're currently reading, congratulate the streak, suggest where to pick up.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "lookup_doctrinal_faq",
    description:
      "Look up the official Jehovah's Witnesses position on a common doctrinal question. Use BEFORE answering ANY question about JW beliefs (blood, holidays, Trinity, paradise, hellfire, soul, 1914, the Governing Body, neutrality, the Memorial, etc.). Returns the canonical answer + a wol.jw.org or jw.org source URL to link in the reply. If no match, the AI may quote scripture and link to wol.jw.org but should NOT improvise doctrine.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The topic, question, or keywords (e.g. 'blood transfusion', 'why no birthdays', 'is hell real', 'who are the 144000', 'jesus michael', 'governing body'). Use natural-language phrasing.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "mark_chapter_read",
    description:
      "Mark a Bible chapter as read in the user's reading tracker. Use when the user says 'I just read X', 'mark X as done', 'I finished X', or 'tick off X'. Always confirm the book and chapter before calling.",
    input_schema: {
      type: "object",
      properties: {
        book_index: { type: "integer", description: "Bible book index (0=Genesis, 65=Revelation)" },
        chapter:    { type: "integer", description: "Chapter number" },
      },
      required: ["book_index", "chapter"],
    },
  },
  {
    name: "get_this_week_meeting",
    description:
      "Fetch the scraped Christian Life and Ministry meeting (CLAM) + Watchtower study agenda for a given week. Use whenever the user asks about meeting prep, this week's meeting, the CLAM agenda, the Watchtower study, or wants help thinking through any part of the upcoming meeting. Defaults to the current week if no date is given.",
    input_schema: {
      type: "object",
      properties: {
        week_start: {
          type: "string",
          description: "Monday of the target week, YYYY-MM-DD. Optional — defaults to current week. Use 'next' to pull the upcoming week's Monday.",
        },
      },
      required: [],
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

// Clamp numeric tool inputs so a prompt-injected LLM can't spam unbounded writes.
function clampInt(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < min || i > max) return null;
  return i;
}

function clampString(v: unknown, max: number): string {
  return String(v ?? "").slice(0, max);
}

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  userId: string,
  userToken: string,
): Promise<string> {
  if (name === "save_note") {
    const bookIndex = clampInt(input.book_index, 0, 65);
    const chapter = clampInt(input.chapter, 1, 150);
    if (bookIndex === null) return "Error: book_index must be between 0 and 65.";
    if (chapter === null) return "Error: chapter must be between 1 and 150.";
    const content = clampString(input.content, 5000);
    if (!content.trim()) return "Error: content is empty.";
    const verse = input.verse ? clampString(input.verse, 20) : null;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/notes`, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({
        user_id:    userId,
        book_index: bookIndex,
        chapter,
        verse,
        content,
      }),
    });
    if (!res.ok) return `Error saving note: ${await res.text()}`;
    return "Note saved successfully.";
  }

  if (name === "get_my_notes") {
    const bookIndex = clampInt(input.book_index, 0, 65);
    if (bookIndex === null) return "Error: book_index must be between 0 and 65.";
    const chapter = input.chapter !== undefined && input.chapter !== null
      ? clampInt(input.chapter, 1, 150)
      : null;

    let url = `${SUPABASE_URL}/rest/v1/notes?user_id=eq.${userId}&book_index=eq.${bookIndex}&select=content,chapter,verse&order=created_at.desc&limit=15`;
    if (chapter !== null) url += `&chapter=eq.${chapter}`;
    const res = await fetch(url, { headers: supabaseHeaders() });
    if (!res.ok) return `Error fetching notes: ${await res.text()}`;
    const notes = await res.json() as Array<{ chapter: number; verse: string | null; content: string }>;
    if (!notes.length) return "No notes found for this book/chapter.";
    return notes.map(n => `Ch.${n.chapter}${n.verse ? `:${n.verse}` : ""} — ${n.content}`).join("\n");
  }

  if (name === "navigate_to") {
    return `NAVIGATE_TO:${clampString(input.page, 100)}`;
  }

  if (name === "create_blog_draft") {
    const title = clampString(input.title, 200);
    const content = clampString(input.content, 50000);
    const excerpt = clampString(input.excerpt, 500);
    return `DRAFT_CREATED:${JSON.stringify({ title, content, excerpt })}`;
  }

  if (name === "get_my_profile") {
    type ProgressMap = Record<string, number[]>;

    // Reading progress (single row per user, JSON blob of bookIndex → completed chapters[])
    const progRes = await fetch(
      `${SUPABASE_URL}/rest/v1/reading_progress?user_id=eq.${userId}&select=progress,updated_at`,
      { headers: supabaseHeaders() },
    );
    const progRow = progRes.ok ? ((await progRes.json()) as Array<{ progress: ProgressMap; updated_at: string }>)[0] : null;
    const prog: ProgressMap = (progRow?.progress as ProgressMap) ?? {};

    let booksCompleted = 0;
    let booksInProgress = 0;
    let totalChaptersRead = 0;
    let mostRecentBook: { name: string; chapters: number; readChapters: number } | null = null;

    BOOKS.forEach((b, i) => {
      const done = (prog[String(i)] ?? []).length;
      totalChaptersRead += done;
      if (done >= b.chapters) booksCompleted++;
      else if (done > 0) {
        booksInProgress++;
        if (!mostRecentBook || done > mostRecentBook.readChapters) {
          mostRecentBook = { name: b.name, chapters: b.chapters, readChapters: done };
        }
      }
    });

    // Streak via existing RPC
    const streakRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_reading_streaks`, {
      method: "POST",
      headers: supabaseHeaders(),
      body: JSON.stringify({ p_user_id: userId }),
    });
    const streak = streakRes.ok
      ? ((await streakRes.json()) as { current_streak?: number; longest_streak?: number; total_days?: number })
      : { current_streak: 0, longest_streak: 0, total_days: 0 };

    // Last 3 saved notes
    const notesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/notes?user_id=eq.${userId}&select=content,book_index,chapter,verse,created_at&order=created_at.desc&limit=3`,
      { headers: supabaseHeaders() },
    );
    const notes = notesRes.ok
      ? ((await notesRes.json()) as Array<{ content: string; book_index: number; chapter: number; verse: string | null; created_at: string }>)
      : [];

    const today = new Date().toISOString().slice(0, 10);
    const lines: string[] = [];
    lines.push(`Today: ${today}`);
    lines.push(`Reading streak: ${streak.current_streak ?? 0} day${(streak.current_streak ?? 0) === 1 ? "" : "s"} (longest: ${streak.longest_streak ?? 0})`);
    lines.push(`Books completed: ${booksCompleted} / 66`);
    lines.push(`Books in progress: ${booksInProgress}`);
    lines.push(`Total chapters read: ${totalChaptersRead} / 1189`);
    if (mostRecentBook) {
      const recent = mostRecentBook as { name: string; chapters: number; readChapters: number };
      const pct = Math.round((recent.readChapters / recent.chapters) * 100);
      lines.push(`Currently reading: ${recent.name} (${recent.readChapters}/${recent.chapters}, ${pct}%)`);
    }
    if (notes.length) {
      lines.push("");
      lines.push("Recent notes:");
      for (const n of notes) {
        const book = BOOKS[n.book_index]?.name ?? `Book ${n.book_index}`;
        const ref = `${book} ${n.chapter}${n.verse ? `:${n.verse}` : ""}`;
        const snippet = n.content.length > 80 ? n.content.slice(0, 80) + "…" : n.content;
        lines.push(`- ${ref} — "${snippet}"`);
      }
    } else {
      lines.push("No saved notes yet.");
    }
    return lines.join("\n");
  }

  if (name === "lookup_doctrinal_faq") {
    const query = clampString(input.query, 200).trim().toLowerCase();
    if (!query) return "Error: query is required.";

    // Score each FAQ entry by topic-tag and question-text overlap with the query.
    const queryTokens = query.split(/\s+/).filter((t) => t.length >= 3);
    function score(entry: DoctrinalFaqEntry): number {
      let s = 0;
      for (const topic of entry.topics) {
        if (query.includes(topic)) s += 5;
        for (const tok of queryTokens) if (topic.includes(tok)) s += 1;
      }
      const qtext = entry.question.toLowerCase();
      for (const tok of queryTokens) if (qtext.includes(tok)) s += 2;
      return s;
    }

    const ranked = DOCTRINAL_FAQ
      .map((e) => ({ e, s: score(e) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);

    if (!ranked.length) {
      return "No matching FAQ entry. Direct the user to wol.jw.org for authoritative answers, and quote any cited scripture from your knowledge of the NWT (linked via the wol URL pattern). Do not improvise doctrine.";
    }

    return ranked
      .map(({ e }) => `Q: ${e.question}\nA: ${e.answer}\nSource: ${e.source}\nURL: ${e.url}`)
      .join("\n\n---\n\n");
  }

  if (name === "get_this_week_meeting") {
    function mondayOf(date: Date): string {
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      const dow = d.getUTCDay(); // 0=Sun..6=Sat
      const diff = dow === 0 ? -6 : 1 - dow;
      d.setUTCDate(d.getUTCDate() + diff);
      return d.toISOString().slice(0, 10);
    }

    const raw = clampString(input.week_start, 20).trim();
    let weekStart: string;
    if (!raw) {
      weekStart = mondayOf(new Date());
    } else if (raw.toLowerCase() === "next") {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + 7);
      weekStart = mondayOf(d);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      weekStart = mondayOf(new Date(raw + "T00:00:00Z"));
    } else {
      return "Error: week_start must be YYYY-MM-DD or 'next'.";
    }

    const url = `${SUPABASE_URL}/rest/v1/meeting_weeks?week_start=eq.${weekStart}&select=*`;
    const res = await fetch(url, { headers: supabaseHeaders() });
    if (!res.ok) return `Error fetching meeting week: ${await res.text()}`;
    const rows = (await res.json()) as Array<{
      week_start: string;
      clam_week_title: string | null;
      clam_bible_reading: string | null;
      clam_opening_song: number | null;
      clam_midpoint_song: number | null;
      clam_closing_song: number | null;
      clam_parts: Array<{ num?: number; title?: string; section?: string }> | null;
      clam_wol_url: string | null;
      wt_article_title: string | null;
      wt_theme_scripture: string | null;
      wt_paragraph_count: number | null;
      wt_wol_url: string | null;
      scraped_at: string | null;
    }>;
    const week = rows[0];
    if (!week) {
      return `No meeting content scraped yet for the week of ${weekStart}. The scraper runs Monday 06:00 UTC. Direct the user to wol.jw.org for the latest material in the meantime.`;
    }

    const lines: string[] = [];
    lines.push(`# Week of ${weekStart}`);
    if (week.clam_week_title) lines.push(`## CLAM — ${week.clam_week_title}`);
    if (week.clam_bible_reading) lines.push(`Bible reading: ${week.clam_bible_reading}`);
    const songs = [
      week.clam_opening_song && `opening ${week.clam_opening_song}`,
      week.clam_midpoint_song && `midpoint ${week.clam_midpoint_song}`,
      week.clam_closing_song && `closing ${week.clam_closing_song}`,
    ].filter(Boolean);
    if (songs.length) lines.push(`Songs: ${songs.join(", ")}`);
    if (Array.isArray(week.clam_parts) && week.clam_parts.length) {
      const grouped: Record<string, string[]> = { treasures: [], ministry: [], living: [], other: [] };
      for (const p of week.clam_parts) {
        const key = (p.section ?? "other").toLowerCase();
        const bucket = grouped[key] ?? grouped.other;
        bucket.push(`${p.num ?? "?"}. ${p.title ?? "(untitled)"}`);
      }
      const labels: Record<string, string> = {
        treasures: "Treasures From God's Word",
        ministry: "Apply Yourself to the Field Ministry",
        living: "Living as Christians",
      };
      for (const sec of ["treasures", "ministry", "living"] as const) {
        if (grouped[sec].length) {
          lines.push(`### ${labels[sec]}`);
          lines.push(...grouped[sec].map((s) => `- ${s}`));
        }
      }
    }
    if (week.clam_wol_url) lines.push(`CLAM agenda: ${week.clam_wol_url}`);
    lines.push("");
    if (week.wt_article_title) {
      lines.push(`## Watchtower Study — ${week.wt_article_title}`);
      if (week.wt_theme_scripture) lines.push(`Theme scripture: ${week.wt_theme_scripture}`);
      if (week.wt_paragraph_count) lines.push(`Paragraphs: ${week.wt_paragraph_count}`);
      if (week.wt_wol_url) lines.push(`Article: ${week.wt_wol_url}`);
    }
    if (week.scraped_at) lines.push(`\n_Scraped ${week.scraped_at}_`);
    return lines.join("\n");
  }

  if (name === "search_scripture") {
    const query = clampString(input.query, 500).trim();
    if (!query) return "Error: query is required.";
    const limit = clampInt(input.limit, 1, 10) ?? 5;

    const fnUrl = `${SUPABASE_URL}/functions/v1/semantic-search`;
    const res = await fetch(fnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return `Error searching scripture: ${await res.text()}`;
    const data = await res.json() as { verses?: Array<{ verse_ref: string; verse_text: string; book_theme?: string }> };
    const verses = (data.verses ?? []).slice(0, limit);
    if (!verses.length) return "No relevant verses found. Try rephrasing the query.";
    return verses
      .map((v) => `${v.verse_ref} — ${v.verse_text}${v.book_theme ? ` (theme: ${v.book_theme})` : ""}`)
      .join("\n");
  }

  if (name === "mark_chapter_read") {
    const bookIndex = clampInt(input.book_index, 0, 65);
    const chapter   = clampInt(input.chapter, 1, 150);
    if (bookIndex === null) return "Error: book_index must be between 0 and 65.";
    if (chapter === null)   return "Error: chapter must be between 1 and 150.";

    // Upsert into chapter_reads using service role (same table as progress.ts)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/chapter_reads`, {
      method: "POST",
      headers: { ...supabaseHeaders(), Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ user_id: userId, book_index: bookIndex, chapter }),
    });
    if (!res.ok) return `Error marking chapter read: ${await res.text()}`;
    const bookName = BOOKS[bookIndex]?.name ?? `Book ${bookIndex}`;
    return `Marked ${bookName} ${chapter} as read. Well done!`;
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
// Haiku 4.5 pricing (per token, USD)
const COST_PER_INPUT  = 1   / 1_000_000;
const COST_PER_OUTPUT = 5   / 1_000_000;

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

// ── Quota enforcement ────────────────────────────────────────────────────────
// Prevents a compromised account from burning through the Anthropic budget.
const PER_MINUTE_REQUEST_CAP  = 6;
const DAILY_INPUT_TOKEN_CAP   = 100_000;
const DAILY_OUTPUT_TOKEN_CAP  = 30_000;

async function checkQuota(userId: string): Promise<{ ok: boolean; reason?: string }> {
  const now = Date.now();
  const oneMinAgo = new Date(now - 60_000).toISOString();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  // Recent requests (rate limit)
  const minRes = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_usage_logs?user_id=eq.${userId}&created_at=gte.${oneMinAgo}&select=id`,
    { headers: { ...supabaseHeaders(), Prefer: "count=exact" } },
  );
  if (minRes.ok) {
    const range = minRes.headers.get("content-range") ?? "0-0/0";
    const count = parseInt(range.split("/")[1] ?? "0", 10);
    if (count >= PER_MINUTE_REQUEST_CAP) {
      return { ok: false, reason: "Too many requests. Please slow down and try again in a minute." };
    }
  }

  // Daily input + output token totals (cost cap — output is the dominant cost)
  const dayRes = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_usage_logs?user_id=eq.${userId}&created_at=gte.${oneDayAgo}&select=input_tokens,output_tokens`,
    { headers: supabaseHeaders() },
  );
  if (dayRes.ok) {
    const rows = await dayRes.json() as Array<{ input_tokens: number; output_tokens: number }>;
    let inTotal = 0, outTotal = 0;
    for (const r of rows) {
      inTotal  += r.input_tokens  ?? 0;
      outTotal += r.output_tokens ?? 0;
    }
    if (inTotal >= DAILY_INPUT_TOKEN_CAP || outTotal >= DAILY_OUTPUT_TOKEN_CAP) {
      return { ok: false, reason: "Daily AI quota reached. Try again tomorrow." };
    }
  }

  return { ok: true };
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

// ── Persist a turn to ai_messages (fire-and-forget) ───────────────────────────
// Only writes when the /ai page sends a conversation_id. Bubble omits it →
// no-op. Errors are swallowed so they never block the user-visible response.
function persistTurn(
  conversationId: string,
  userId: string,
  userText: string,
  assistantText: string,
): void {
  const rows = [
    { conversation_id: conversationId, user_id: userId, role: "user",      content: [{ type: "text", text: userText }] },
    { conversation_id: conversationId, user_id: userId, role: "assistant", content: [{ type: "text", text: assistantText }] },
  ];
  fetch(`${SUPABASE_URL}/rest/v1/ai_messages`, {
    method: "POST",
    headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  }).catch((err) => {
    console.error("[ai-chat] persistTurn failed:", err);
  });
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

  // Quota gate — blocks rate-limit spam and daily token blow-outs before any LLM call.
  const quota = await checkQuota(userId);
  if (!quota.ok) {
    return new Response(JSON.stringify({ error: quota.reason }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  if (!ANTHROPIC_KEY) {
    return new Response(JSON.stringify({ error: "AI service not configured." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse body
  let messages: ChatMessage[] = [];
  let context: AppContext = {};
  let conversationId: string | null = null;
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
    // Optional: persist this turn to ai_messages under the given conversation.
    // Only the /ai full-chat page sends this; the floating bubble omits it.
    if (typeof body.conversation_id === "string" && /^[0-9a-f-]{36}$/.test(body.conversation_id)) {
      conversationId = body.conversation_id;
    }
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
      if (conversationId) {
        const userText = messages[messages.length - 1].content as string;
        persistTurn(conversationId, userId, userText, text);
      }
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
          token,
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
  if (conversationId) {
    const userText = messages[messages.length - 1].content as string;
    persistTurn(conversationId, userId, userText, finalText);
  }
  return new Response(await textToStream(finalText, pendingDraft, pendingNav), { headers: sseHeaders });
}
