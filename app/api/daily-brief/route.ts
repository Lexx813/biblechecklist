/**
 * GET  /api/daily-brief   — Return today's AI brief (cached; generate if stale)
 * DELETE /api/daily-brief — Dismiss until tomorrow
 * Auth: Bearer <supabase-access-token>
 */

import { BOOKS } from "../../../src/data/books";
import { generateSchedule, getTemplateOrCustom } from "../../../src/data/readingPlanTemplates";

const SUPABASE_URL     = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const ANTHROPIC_KEY    = process.env.ANTHROPIC_API_KEY ?? "";
const MODEL            = "claude-haiku-4-5-20251001";

function sbHeaders() {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_SERVICE,
    Authorization: `Bearer ${SUPABASE_SERVICE}`,
    Prefer: "return=representation",
  };
}

async function getUserId(req: Request): Promise<string | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_SERVICE, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const u = (await res.json()) as { id?: string };
  return u.id ?? null;
}

// Today in UTC (YYYY-MM-DD)
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

// Midnight tonight UTC (start of tomorrow)
function tomorrowUTC() {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}

// Is the cached brief still valid for today?
function isFresh(generatedAt: string): boolean {
  return generatedAt.slice(0, 10) === todayUTC();
}

// ── Context gathering ─────────────────────────────────────────────────────────

async function gatherContext(userId: string): Promise<string> {
  const today = todayUTC();
  const parts: string[] = [`Today: ${today}`];

  // Reading streak
  const streakRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_reading_streaks`, {
    method: "POST",
    headers: sbHeaders(),
    body: JSON.stringify({ p_user_id: userId }),
  });
  const streak = streakRes.ok
    ? ((await streakRes.json()) as { current_streak?: number })
    : null;
  if (streak?.current_streak) {
    parts.push(`Reading streak: ${streak.current_streak} day${streak.current_streak === 1 ? "" : "s"}`);
  }

  // Active reading plan + today's reading
  const plansRes = await fetch(
    `${SUPABASE_URL}/rest/v1/user_reading_plans?user_id=eq.${userId}&is_paused=is.false&completed_at=is.null&order=created_at.desc&limit=1`,
    { headers: sbHeaders() },
  );
  type PlanRow = {
    id: string; template_key: string; start_date: string;
    paused_days?: number; is_paused?: boolean; paused_at?: string;
    custom_config?: unknown;
  };
  const plans = plansRes.ok ? ((await plansRes.json()) as PlanRow[]) : [];
  const plan = plans[0] ?? null;

  if (plan) {
    const tpl = getTemplateOrCustom(plan);
    const schedule = generateSchedule(tpl.bookIndices, tpl.totalDays);
    const start = new Date(plan.start_date + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let dayN = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
    const pausedDays = plan.paused_days ?? 0;
    dayN = Math.max(1, dayN - pausedDays);
    const dayEntry = schedule.find((d) => d.day === dayN);

    if (dayEntry?.readings?.length) {
      const readingLabel = (dayEntry.readings as Array<{ bookIndex: number; chapter: number }>)
        .map((r) => `${BOOKS[r.bookIndex]?.name ?? ""} ${r.chapter}`)
        .join(", ");
      parts.push(`Plan: "${tpl.name}" (Day ${dayN} of ${tpl.totalDays})`);
      parts.push(`Today's reading: ${readingLabel}`);
    }
  }

  // Last 2 notes
  const notesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/notes?user_id=eq.${userId}&select=content,book_index,chapter&order=created_at.desc&limit=2`,
    { headers: sbHeaders() },
  );
  type NoteRow = { content: string; book_index: number; chapter: number };
  const notes = notesRes.ok ? ((await notesRes.json()) as NoteRow[]) : [];
  if (notes.length) {
    const snippets = notes.map((n) => {
      const book = BOOKS[n.book_index]?.name ?? "";
      const preview = n.content.length > 60 ? n.content.slice(0, 60) + "…" : n.content;
      return `${book} ${n.chapter}: "${preview}"`;
    });
    parts.push(`Recent notes: ${snippets.join(" | ")}`);
  }

  // This week's meeting (if exists)
  const monday = (() => {
    const d = new Date();
    const dow = d.getUTCDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    d.setUTCDate(d.getUTCDate() + diff);
    return d.toISOString().slice(0, 10);
  })();
  const meetingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/meeting_weeks?week_start=eq.${monday}&select=clam_title,wt_title&limit=1`,
    { headers: sbHeaders() },
  );
  type MeetingRow = { clam_title?: string; wt_title?: string };
  const meetings = meetingRes.ok ? ((await meetingRes.json()) as MeetingRow[]) : [];
  if (meetings[0]?.clam_title) {
    parts.push(`This week's CLAM theme: "${meetings[0].clam_title}"`);
  }

  // Last AI conversation title (for "continue chat" context)
  const convRes = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_conversations?user_id=eq.${userId}&order=updated_at.desc&limit=1&select=id,title`,
    { headers: sbHeaders() },
  );
  type ConvRow = { id: string; title: string };
  const convs = convRes.ok ? ((await convRes.json()) as ConvRow[]) : [];
  if (convs[0]) {
    parts.push(`Last chat: "${convs[0].title}" (id: ${convs[0].id})`);
  }

  return parts.join("\n");
}

// ── Generate brief via Haiku ──────────────────────────────────────────────────

async function generateBrief(context: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 120,
      system:
        "You write a warm, personal 2-sentence daily greeting for a Jehovah's Witness Bible study app. " +
        "Use the user's data to make it feel like a knowledgeable friend checking in. " +
        "Reference specific details — book they're reading, streak, recent note topic. " +
        "If they have today's reading, mention it naturally. " +
        "Tone: warm, encouraging, faithful (JW perspective). " +
        "Do NOT start with 'I', do NOT use em dashes, do NOT be generic. " +
        "Output ONLY the 2-sentence paragraph — no preamble, no sign-off.",
      messages: [
        {
          role: "user",
          content: `User data:\n${context}\n\nWrite their greeting.`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  return (
    data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("") || "Welcome back. Your study time today matters — open up where you left off."
  );
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Check cache
  const cacheRes = await fetch(
    `${SUPABASE_URL}/rest/v1/daily_briefs?user_id=eq.${userId}&select=brief_text,generated_at,dismissed_until`,
    { headers: sbHeaders() },
  );
  type BriefRow = { brief_text: string; generated_at: string; dismissed_until: string | null };
  const rows = cacheRes.ok ? ((await cacheRes.json()) as BriefRow[]) : [];
  const cached = rows[0] ?? null;

  // Dismissed until future date → return empty
  if (cached?.dismissed_until && new Date(cached.dismissed_until) > new Date()) {
    return Response.json({ brief: null, dismissed: true });
  }

  // Cache hit for today
  if (cached && isFresh(cached.generated_at)) {
    return Response.json({ brief: cached.brief_text });
  }

  // Generate fresh brief
  try {
    const context = await gatherContext(userId);
    const brief = await generateBrief(context);

    // Upsert
    await fetch(`${SUPABASE_URL}/rest/v1/daily_briefs`, {
      method: "POST",
      headers: { ...sbHeaders(), Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        user_id: userId,
        brief_text: brief,
        generated_at: new Date().toISOString(),
        dismissed_until: null,
      }),
    });

    return Response.json({ brief });
  } catch (err) {
    console.error("[daily-brief] generation error:", err);
    // Graceful fallback — don't break the homepage
    return Response.json({ brief: null });
  }
}

// ── DELETE (dismiss until tomorrow) ──────────────────────────────────────────

export async function DELETE(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await fetch(`${SUPABASE_URL}/rest/v1/daily_briefs`, {
    method: "POST",
    headers: { ...sbHeaders(), Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      user_id: userId,
      brief_text: "",
      generated_at: new Date(0).toISOString(),
      dismissed_until: tomorrowUTC(),
    }),
  });

  return Response.json({ ok: true });
}
