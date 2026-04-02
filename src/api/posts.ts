// @ts-nocheck
import { supabase } from "../lib/supabase";
import { assertNoPII } from "../lib/pii";

export const postsApi = {
  create: async (userId, content) => {
    assertNoPII(content);
    const { data, error } = await supabase
      .from("user_posts")
      .insert({ user_id: userId, content: content.trim() })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  list: async (userId, limit = 30) => {
    const { data, error } = await supabase
      .from("user_posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  delete: async (postId) => {
    const { error } = await supabase.from("user_posts").delete().eq("id", postId);
    if (error) throw new Error(error.message);
  },
};
