import { supabase } from "../lib/supabase";

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

  enroll: async (templateKey) => {
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

  unenroll: async (planId) => {
    const { error } = await supabase
      .from("user_reading_plans")
      .delete()
      .eq("id", planId);
    if (error) throw new Error(error.message);
  },

  getCompletions: async (planId) => {
    const { data, error } = await supabase
      .from("reading_plan_completions")
      .select("day_number, completed_at")
      .eq("plan_id", planId);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  markDay: async (planId, dayNumber) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("reading_plan_completions")
      .insert({ plan_id: planId, user_id: user.id, day_number: dayNumber });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  },

  unmarkDay: async (planId, dayNumber) => {
    const { error } = await supabase
      .from("reading_plan_completions")
      .delete()
      .eq("plan_id", planId)
      .eq("day_number", dayNumber);
    if (error) throw new Error(error.message);
  },
};
