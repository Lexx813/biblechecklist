// src/api/quizTimed.ts
import { supabase } from "../lib/supabase";

export const quizTimedApi = {
  saveTimedScore: async (userId: string, level: number, score: number) => {
    const { error } = await supabase
      .from("quiz_timed_scores")
      .insert({ user_id: userId, level, score });
    if (error) throw error;
  },

  getTimedLeaderboard: async (level: number) => {
    // Get best score per user for a given level
    const { data, error } = await supabase
      .from("quiz_timed_scores")
      .select(`
        user_id,
        score,
        achieved_at,
        profiles (display_name, avatar_url)
      `)
      .eq("level", level)
      .order("score", { ascending: false })
      .limit(200); // fetch extra rows to ensure dedup covers all distinct users

    if (error) throw error;

    // Deduplicate: one entry per user (their best score, which is first due to ordering)
    const seen = new Set<string>();
    return (data ?? [])
      .filter((row) => {
        if (seen.has(row.user_id)) return false;
        seen.add(row.user_id);
        return true;
      })
      .map((row, i) => {
        const profile = row.profiles as unknown as { display_name: string | null; avatar_url: string | null } | null;
        return {
          rank: i + 1,
          userId: row.user_id,
          displayName: profile?.display_name ?? "Anonymous",
          avatarUrl: profile?.avatar_url ?? null,
          score: row.score,
          achievedAt: row.achieved_at,
        };
      });
  },

  getUserBestScore: async (userId: string, level: number) => {
    const { data, error } = await supabase
      .from("quiz_timed_scores")
      .select("score")
      .eq("user_id", userId)
      .eq("level", level)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.score ?? null;
  },
};
