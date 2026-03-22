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
  },
};
