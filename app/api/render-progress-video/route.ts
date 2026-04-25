/**
 * POST /api/render-progress-video
 * Returns the input props needed to render the Remotion ProgressVideo composition.
 * Actual video rendering happens client-side via @remotion/player.
 *
 * For server-side MP4 export, set up Remotion Lambda:
 * https://www.remotion.dev/docs/lambda
 *
 * Body: { userId? }  — defaults to the authenticated user
 * Auth: Bearer <supabase-access-token>
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, rateLimitResponse } from "../../../src/lib/ratelimit";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const TOTAL_CHAPTERS = 1189;

const LEVEL_EMOJIS: Record<number, string> = {
  1: "📖", 2: "📚", 3: "🌱", 4: "👨‍👩‍👦", 5: "🏺", 6: "⚔️",
  7: "🎵", 8: "📯", 9: "🕊️", 10: "🌍", 11: "🔮", 12: "👑",
};

export async function POST(req: NextRequest) {
  const start = Date.now();

  try {
    // Auth
    const auth = req.headers.get("authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      console.warn("[render-progress-video] Missing or invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.warn("[render-progress-video] Auth failed:", authError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Always use the authenticated user's ID — never allow caller to specify another user's ID
    const userId = user.id;

    // Heavy CPU work — strict per-user cap to avoid runaway invocations.
    const rl = await rateLimit("renderVideo", userId);
    if (!rl.ok) return rateLimitResponse(rl);

    console.log(`[render-progress-video] Fetching data for userId=${userId}`);

    // Fetch user data in parallel
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const [profileRes, chapterRes, streakRes, badgeRes] = await Promise.all([
      supabase.from("profiles").select("display_name, avatar_url, top_badge_level").eq("id", userId).single(),
      supabase.from("chapter_reads").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.rpc("get_reading_streaks", { p_user_id: userId }),
      supabase.from("user_quiz_progress").select("level", { count: "exact", head: true }).eq("user_id", userId).eq("badge_earned", true),
    ]);

    if (profileRes.error) {
      console.error("[render-progress-video] Profile fetch error:", profileRes.error.message);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = profileRes.data;
    const chaptersRead = chapterRes.count ?? 0;
    const streak = (streakRes.data as { current_streak?: number } | null)?.current_streak ?? 0;
    const badgeCount = badgeRes.count ?? 0;
    const topBadgeLevel = profile?.top_badge_level ?? 0;
    const pct = Math.round((chaptersRead / TOTAL_CHAPTERS) * 100);

    const props = {
      displayName: profile?.display_name ?? "JW Study Member",
      avatarInitial: (profile?.display_name ?? "J")[0].toUpperCase(),
      avatarUrl: profile?.avatar_url ?? null,
      chaptersRead,
      totalChapters: TOTAL_CHAPTERS,
      currentStreak: streak,
      badgeCount,
      topBadgeEmoji: LEVEL_EMOJIS[topBadgeLevel] ?? "",
      pct,
    };

    console.log(`[render-progress-video] OK userId=${userId} pct=${pct}% elapsed=${Date.now() - start}ms`);

    return NextResponse.json({ props }, { status: 200 });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[render-progress-video] Unhandled error after ${Date.now() - start}ms:`, message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
