// @ts-nocheck
import { supabase } from "../lib/supabase";

export const readingApi = {
  // delta = +N when marking chapters read, -N when unmarking
  logChapter: async (delta) => {
    if (delta === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.rpc("increment_reading_log", {
      p_date: today,
      p_delta: delta,
    });
    if (error) throw new Error(error.message);
  },

  getHeatmap: async (userId) => {
    const { data, error } = await supabase.rpc("get_reading_heatmap", { p_user_id: userId, p_days: 364 });
    if (error) return [];
    return data ?? [];
  },

  getStreaks: async (userId) => {
    const { data, error } = await supabase.rpc("get_reading_streaks", { p_user_id: userId });
    if (error) return { current_streak: 0, longest_streak: 0 };
    return data ?? { current_streak: 0, longest_streak: 0 };
  },

  setDailyGoal: async (goal) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ daily_chapter_goal: goal }).eq("id", user.id);
    if (error) throw new Error(error.message);
  },

  getHistory: async (userId, limit = 120) => {
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

  getStats: async (userId) => {
    const since = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
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
    const todayStr = new Date().toISOString().slice(0, 10);
    const yestStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let streak = 0;
    const anchor = activeMap.has(todayStr)
      ? new Date()
      : activeMap.has(yestStr)
      ? new Date(Date.now() - 86400000)
      : null;
    if (anchor) {
      const d = new Date(anchor);
      while (true) {
        const ds = d.toISOString().slice(0, 10);
        if (activeMap.has(ds)) {
          streak++;
          d.setDate(d.getDate() - 1);
        } else break;
      }
    }

    // Chapters in the last 7 days
    const weekAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const weeklyChapters = log
      .filter((r) => r.date > weekAgoStr)
      .reduce((sum, r) => sum + r.chapters_read, 0);

    // 14-day activity grid (oldest → newest)
    const grid = [];
    for (let i = 13; i >= 0; i--) {
      const ds = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      grid.push({ date: ds, chapters: activeMap.get(ds) ?? 0 });
    }

    return { streak, weeklyChapters, grid };
  },
};
