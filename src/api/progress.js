import { supabase } from "../lib/supabase";

export const progressApi = {
  load: async (userId) => {
    const { data, error } = await supabase
      .from("reading_progress")
      .select("progress")
      .eq("user_id", userId)
      .single();

    // PGRST116 = no rows found, that's fine for a new user
    if (error && error.code !== "PGRST116") throw new Error(error.message);
    return data?.progress ?? {};
  },

  save: async (userId, progress) => {
    const { error } = await supabase
      .from("reading_progress")
      .upsert({ user_id: userId, progress, updated_at: new Date().toISOString() });

    if (error) throw new Error(error.message);
  },
};
