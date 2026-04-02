// @ts-nocheck
// src/api/streakFreeze.js
import { supabase } from "../lib/supabase";

export const streakFreezeApi = {
  getFreezeStatus: async (userId) => {
    const [profileRes, freezeRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("freeze_tokens")
        .eq("id", userId)
        .single(),
      supabase
        .from("streak_freeze_uses")
        .select("used_date")
        .eq("user_id", userId)
        .gte("used_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
        .order("used_date", { ascending: false }),
    ]);
    if (profileRes.error) throw profileRes.error;
    const tokens = profileRes.data?.freeze_tokens ?? 0;
    const recentFreezes = freezeRes.data?.map((r) => r.used_date) ?? [];
    return { tokens, recentFreezes };
  },

  applyFreeze: async (userId, date) => {
    // date: "YYYY-MM-DD" for the day to freeze
    const { error: insertError } = await supabase
      .from("streak_freeze_uses")
      .insert({ user_id: userId, used_date: date });
    if (insertError && insertError.code !== "23505") throw insertError;
    if (insertError?.code === "23505") return; // Already frozen this day

    const { error: updateError } = await supabase.rpc("decrement_freeze_token", {
      p_user_id: userId,
    });
    if (updateError) throw updateError;
  },
};
