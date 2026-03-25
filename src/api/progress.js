import { supabase } from "../lib/supabase";

export const progressApi = {
  load: async (userId) => {
    const { data, error } = await supabase
      .from("reading_progress")
      .select("progress")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data?.progress ?? {};
  },

  save: async (userId, progress) => {
    const { error } = await supabase
      .from("reading_progress")
      .upsert({ user_id: userId, progress, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);

    // Record today as a reading day (ignore errors — streak is non-critical)
    await supabase
      .from("reading_activity")
      .upsert({ user_id: userId, activity_date: new Date().toISOString().slice(0, 10) });
  },

  getStreak: async (userId) => {
    const { data, error } = await supabase.rpc("get_reading_streak", { p_user_id: userId });
    if (error) throw new Error(error.message);
    return data?.[0] ?? { current_streak: 0, longest_streak: 0, total_days: 0 };
  },

  markChapterRead: async (userId, bookIndex, chapter) => {
    await supabase.from("chapter_reads").upsert({
      user_id: userId, book_index: bookIndex, chapter, read_at: new Date().toISOString(),
    });
  },

  unmarkChapterRead: async (userId, bookIndex, chapter) => {
    await supabase.from("chapter_reads")
      .delete()
      .eq("user_id", userId)
      .eq("book_index", bookIndex)
      .eq("chapter", chapter);
  },

  loadChapterTimestamps: async (userId) => {
    const { data, error } = await supabase
      .from("chapter_reads")
      .select("book_index, chapter, read_at")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    // Return as { [bookIndex]: { [chapter]: isoString } }
    const map = {};
    for (const row of data ?? []) {
      if (!map[row.book_index]) map[row.book_index] = {};
      map[row.book_index][row.chapter] = row.read_at;
    }
    return map;
  },
};
