import { supabase } from "../lib/supabase";

// { [bookIndex: number]: { [chapter: number]: isoString } }
type ChapterTimestampMap = Record<number, Record<number, string>>;

// progress blob stored in reading_progress.progress (JSON)
type ProgressBlob = Record<string, unknown>;

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_days: number;
}

export const progressApi = {
  load: async (userId: string): Promise<ProgressBlob> => {
    const { data, error } = await supabase
      .from("reading_progress")
      .select("progress")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data?.progress as ProgressBlob) ?? {};
  },

  save: async (userId: string, progress: ProgressBlob): Promise<void> => {
    const { error } = await supabase
      .from("reading_progress")
      .upsert({ user_id: userId, progress, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);

    // Record today as a reading day (ignore errors — streak is non-critical)
    await supabase
      .from("reading_activity")
      .upsert({ user_id: userId, activity_date: new Date().toISOString().slice(0, 10) });
  },

  getStreak: async (userId: string): Promise<StreakData> => {
    const { data, error } = await supabase.rpc("get_reading_streaks", { p_user_id: userId });
    if (error) throw new Error(error.message);
    return (data as StreakData | null) ?? { current_streak: 0, longest_streak: 0, total_days: 0 };
  },

  markChapterRead: async (userId: string, bookIndex: number, chapter: number): Promise<void> => {
    const { error } = await supabase.from("chapter_reads").upsert({
      user_id: userId, book_index: bookIndex, chapter, read_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  },

  unmarkChapterRead: async (userId: string, bookIndex: number, chapter: number): Promise<void> => {
    const { error } = await supabase.from("chapter_reads")
      .delete()
      .eq("user_id", userId)
      .eq("book_index", bookIndex)
      .eq("chapter", chapter);
    if (error) throw new Error(error.message);
  },

  loadChapterTimestamps: async (userId: string): Promise<ChapterTimestampMap> => {
    const { data, error } = await supabase
      .from("chapter_reads")
      .select("book_index, chapter, read_at")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    // Return as { [bookIndex]: { [chapter]: isoString } }
    const map: ChapterTimestampMap = {};
    for (const row of data ?? []) {
      if (!map[row.book_index]) map[row.book_index] = {};
      map[row.book_index][row.chapter] = row.read_at;
    }
    return map;
  },
};
