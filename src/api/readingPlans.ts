import { supabase } from "../lib/supabase";

interface UserReadingPlan {
  id: string;
  paused_at: string | null;
  paused_days: number | null;
  [key: string]: unknown;
}

export const readingPlansApi = {
  getMyPlans: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("user_reading_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  enroll: async (templateKey: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("user_reading_plans")
      .insert({ user_id: user.id, template_key: templateKey, start_date: new Date().toISOString().slice(0, 10) })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  enrollCustom: async ({ name, bookIndices, totalDays, totalChapters, icon, difficulty }: {
    name: string;
    bookIndices: number[];
    totalDays: number;
    totalChapters: number;
    icon?: string;
    difficulty?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const custom_config = { name, bookIndices, totalDays, totalChapters, icon: icon ?? "🗂️", difficulty: difficulty ?? "Custom" };
    const { data, error } = await supabase
      .from("user_reading_plans")
      .insert({
        user_id: user.id,
        template_key: "custom",
        start_date: new Date().toISOString().slice(0, 10),
        custom_config,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  unenroll: async (planId: string) => {
    const { error } = await supabase
      .from("user_reading_plans")
      .delete()
      .eq("id", planId);
    if (error) throw new Error(error.message);
  },

  // ── Pause / Resume ────────────────────────────────────────────────────────

  pause: async (planId: string) => {
    const { error } = await supabase
      .from("user_reading_plans")
      .update({ is_paused: true, paused_at: new Date().toISOString() })
      .eq("id", planId);
    if (error) throw new Error(error.message);
  },

  resume: async (plan: UserReadingPlan) => {
    // Accumulate the days this pause lasted into paused_days, then clear paused_at
    let additionalDays = 0;
    if (plan.paused_at) {
      const pausedDate = new Date(plan.paused_at);
      pausedDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      additionalDays = Math.floor((today.getTime() - pausedDate.getTime()) / 86400000);
    }
    const { error } = await supabase
      .from("user_reading_plans")
      .update({
        is_paused: false,
        paused_at: null,
        paused_days: (plan.paused_days ?? 0) + additionalDays,
      })
      .eq("id", plan.id);
    if (error) throw new Error(error.message);
  },

  // ── Catch-up: adjust start_date so user is only 2 days behind ─────────────

  catchUp: async (planId: string, completedCount: number) => {
    // New effective start: make effectiveDay = completedCount + 2
    // effectiveDay = daysSince(start_date) - paused_days
    // We want daysSince(new_start) = completedCount + 2 (with paused_days=0 reset)
    const newStart = new Date();
    newStart.setDate(newStart.getDate() - (completedCount + 1)); // day 1 = completedCount+2 days ago
    const { error } = await supabase
      .from("user_reading_plans")
      .update({
        start_date: newStart.toISOString().slice(0, 10),
        paused_days: 0,
        is_paused: false,
        paused_at: null,
      })
      .eq("id", planId);
    if (error) throw new Error(error.message);
  },

  // ── Completions ───────────────────────────────────────────────────────────

  getCompletions: async (planId: string) => {
    const { data, error } = await supabase
      .from("reading_plan_completions")
      .select("day_number, completed_at")
      .eq("plan_id", planId);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  markDay: async (planId: string, dayNumber: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("reading_plan_completions")
      .insert({ plan_id: planId, user_id: user.id, day_number: dayNumber });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  },

  unmarkDay: async (planId: string, dayNumber: number) => {
    const { error } = await supabase
      .from("reading_plan_completions")
      .delete()
      .eq("plan_id", planId)
      .eq("day_number", dayNumber);
    if (error) throw new Error(error.message);
  },
};
