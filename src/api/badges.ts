// src/api/badges.ts
import { supabase } from "../lib/supabase";

export const badgesApi = {
  getUserBadges: async (userId: string) => {
    const { data, error } = await supabase
      .from("user_badges")
      .select("badge_key, earned_at")
      .eq("user_id", userId);
    if (error) throw error;
    return data ?? [];
  },

  awardBadge: async (userId: string, badgeKey: string) => {
    const { error } = await supabase
      .from("user_badges")
      .insert({ user_id: userId, badge_key: badgeKey });
    // Unique constraint violation (23505) = badge already earned — treat as success
    if (error && error.code !== "23505") throw error;
    return { alreadyEarned: error?.code === "23505" };
  },
};
