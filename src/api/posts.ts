import { supabase } from "../lib/supabase";
import { assertNoPII } from "../lib/pii";

export const postsApi = {
  create: async (userId: string, content: string, visibility: "public" | "friends" = "public") => {
    assertNoPII(content);
    const { data, error } = await supabase
      .from("user_posts")
      .insert({ user_id: userId, content: content.trim(), visibility })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  list: async (userId: string, limit = 30, publicOnly = false) => {
    let query = supabase
      .from("user_posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (publicOnly) query = query.eq("visibility", "public");
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  delete: async (postId: string) => {
    const { error } = await supabase.from("user_posts").delete().eq("id", postId);
    if (error) throw new Error(error.message);
  },

  listFriendPosts: async (userId: string, limit = 10) => {
    const { data: friendships, error: fErr } = await supabase
      .from("friendships")
      .select("user_id_1, user_id_2")
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);
    if (fErr) throw new Error(fErr.message);

    const friendIds = (friendships ?? []).map(f =>
      f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
    );
    if (friendIds.length === 0) return [];

    const { data, error } = await supabase
      .from("user_posts")
      .select("*, profiles:user_id(id, display_name, avatar_url)")
      .in("user_id", friendIds)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
