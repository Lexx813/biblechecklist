import { supabase } from "../lib/supabase";
import { localDateStr } from "../lib/localDate";

export const readingApi = {
  // delta = +N when marking chapters read, -N when unmarking
  logChapter: async (delta: number) => {
    if (delta === 0) return;
    const today = localDateStr();
    const { error } = await supabase.rpc("increment_reading_log", {
      p_date: today,
      p_delta: delta,
    });
    if (error) throw new Error(error.message);
  },

  getHeatmap: async (userId: string) => {
    const { data, error } = await supabase.rpc("get_reading_heatmap", { p_user_id: userId, p_days: 364 });
    if (error) return [];
    return data ?? [];
  },

  getStreaks: async (userId: string) => {
    const { data, error } = await supabase.rpc("get_reading_streaks", { p_user_id: userId, p_today: localDateStr() });
    if (error) return { current_streak: 0, longest_streak: 0 };
    return data ?? { current_streak: 0, longest_streak: 0 };
  },

  setDailyGoal: async (goal: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ daily_chapter_goal: goal }).eq("id", user.id);
    if (error) throw new Error(error.message);
  },

  getHistory: async (userId: string, limit = 120) => {
    const { data, error } = await supabase
      .from("reading_log")
      .select("date, chapters_read")
      .eq("user_id", userId)
      .gt("chapters_read", 0)
      .order("date", { ascending: false })
      .limit(limit);
    if (error) return [];
    return data ?? [];
  },

  getStats: async (userId: string) => {
    const since = localDateStr(new Date(), -60);
    const { data, error } = await supabase
      .from("reading_log")
      .select("date, chapters_read")
      .eq("user_id", userId)
      .gte("date", since)
      .order("date", { ascending: false });
    if (error) throw new Error(error.message);

    const log = data ?? [];
    const activeMap = new Map(
      log.filter((r) => r.chapters_read > 0).map((r) => [r.date, r.chapters_read])
    );

    // Current streak — counts backwards from today (or yesterday if today not yet logged)
    let streak = 0;
    const start = activeMap.has(localDateStr()) ? 0 : activeMap.has(localDateStr(new Date(), -1)) ? -1 : null;
    if (start !== null) {
      while (activeMap.has(localDateStr(new Date(), start - streak))) streak++;
    }

    // Chapters in the last 7 days
    const weekAgoStr = localDateStr(new Date(), -7);
    const weeklyChapters = log
      .filter((r) => r.date > weekAgoStr)
      .reduce((sum, r) => sum + r.chapters_read, 0);

    // 14-day activity grid (oldest → newest)
    const grid: { date: string; chapters: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const ds = localDateStr(new Date(), -i);
      grid.push({ date: ds, chapters: activeMap.get(ds) ?? 0 });
    }

    return { streak, weeklyChapters, grid };
  },
};
