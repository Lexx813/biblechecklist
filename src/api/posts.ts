import { supabase } from "../lib/supabase";
import { assertNoPII } from "../lib/pii";

export const postsApi = {
  create: async (userId: string, content: string, visibility: "public" | "friends" = "public", imageUrl?: string) => {
    assertNoPII(content);
    const row: Record<string, unknown> = { user_id: userId, content: content.trim(), visibility };
    if (imageUrl) row.image_url = imageUrl;
    const { data, error } = await supabase
      .from("user_posts")
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  uploadImage: async (userId: string, file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("post-images")
      .upload(path, file, { contentType: file.type });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    return data.publicUrl;
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

  listPublicFeed: async (limit = 20) => {
    const { data, error } = await supabase
      .from("user_posts")
      .select("*, profiles:user_id(id, display_name, avatar_url)")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data ?? [];
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
