import { supabase } from "../lib/supabase";

// ── Meeting weeks (scraped content) ──────────────────────────────────────────

export async function getMeetingWeek(weekStart: string) {
  const { data, error } = await supabase
    .from("meeting_weeks")
    .select("*")
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRecentMeetingWeeks(limit = 8) {
  const { data, error } = await supabase
    .from("meeting_weeks")
    .select("week_start, clam_week_title, wt_article_title, scraped_at")
    .order("week_start", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// ── User prep progress ────────────────────────────────────────────────────────

export async function getPrepForWeek(userId: string, weekStart: string) {
  const { data, error } = await supabase
    .from("user_meeting_prep")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertPrep(userId: string, weekStart: string, updates: Record<string, unknown>) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("user_meeting_prep")
    .upsert({
      user_id: userId,
      week_start: weekStart,
      ...updates,
      updated_at: now,
    }, { onConflict: "user_id,week_start" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getPrepHistory(userId: string, limit = 12) {
  const { data, error } = await supabase
    .from("user_meeting_prep")
    .select("week_start, clam_completed, wt_completed, updated_at")
    .eq("user_id", userId)
    .order("week_start", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getPrepStreak(userId: string) {
  const { data, error } = await supabase.rpc("get_prep_streak", { p_user_id: userId });
  if (error) throw error;
  return data ?? 0;
}

// ── Trigger scraper for a week ────────────────────────────────────────────────

export async function triggerScrape(weekStart: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/scrape-meeting-content`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ week_start: weekStart }),
    }
  );
  if (!res.ok) throw new Error(`Scrape failed: ${res.statusText}`);
  return res.json();
}
