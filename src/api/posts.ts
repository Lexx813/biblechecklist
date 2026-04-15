import { supabase } from "../lib/supabase";
import { assertNoPII, upgradeInsecureLinks } from "../lib/pii";

export const postsApi = {
  create: async (userId: string, content: string, visibility: "public" | "friends" = "public", imageUrl?: string) => {
    const safeContent = upgradeInsecureLinks(content.trim());
    assertNoPII(safeContent);
    const row: Record<string, unknown> = { user_id: userId, content: safeContent, visibility };
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
    const ALLOWED_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (!ALLOWED_TYPES[file.type]) throw new Error("Only JPEG, PNG, WebP, or GIF images are allowed.");
    if (file.size > MAX_SIZE) throw new Error("Image must be under 5 MB.");
    const ext = ALLOWED_TYPES[file.type];
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

  update: async (postId: string, content: string, visibility: "public" | "friends", imageUrl?: string | null) => {
    const safeContent = upgradeInsecureLinks(content.trim());
    assertNoPII(safeContent);
    const updates: Record<string, unknown> = { content: safeContent, visibility };
    if (imageUrl !== undefined) updates.image_url = imageUrl;
    const { data, error } = await supabase
      .from("user_posts")
      .update(updates)
      .eq("id", postId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
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
      .select("user_a_id, user_b_id")
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);
    if (fErr) throw new Error(fErr.message);

    const friendIds = (friendships ?? []).map(f =>
      f.user_a_id === userId ? f.user_b_id : f.user_a_id
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
