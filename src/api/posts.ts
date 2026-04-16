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

  // ── Comments ──────────────────────────────────────────────────────────────
  listComments: async (postId: string) => {
    const { data, error } = await supabase
      .from("user_post_comments")
      .select("id, post_id, author_id, content, created_at, parent_id, like_count")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    if (!data?.length) return [];
    const authorIds = [...new Set(data.map(c => c.author_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", authorIds);
    const pm = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
    return data.map(c => ({ ...c, author: pm[c.author_id] ?? null }));
  },

  addComment: async (postId: string, content: string, parentId?: string) => {
    assertNoPII(content);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const row: Record<string, unknown> = { post_id: postId, author_id: user.id, content: content.trim() };
    if (parentId) row.parent_id = parentId;
    const { data, error } = await supabase
      .from("user_post_comments")
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteComment: async (commentId: string) => {
    const { error } = await supabase.from("user_post_comments").delete().eq("id", commentId);
    if (error) throw new Error(error.message);
  },

  getMyCommentLikes: async (postId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [] as string[];
    // Get all comment IDs for this post that the user has liked
    const { data: comments } = await supabase
      .from("user_post_comments")
      .select("id")
      .eq("post_id", postId);
    if (!comments?.length) return [] as string[];
    const commentIds = comments.map(c => c.id);
    const { data, error } = await supabase
      .from("user_post_comment_likes")
      .select("comment_id")
      .eq("user_id", user.id)
      .in("comment_id", commentIds);
    if (error) return [] as string[];
    return (data ?? []).map(r => r.comment_id as string);
  },

  toggleCommentLike: async (commentId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data: existing } = await supabase
      .from("user_post_comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase.from("user_post_comment_likes").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { liked: false };
    } else {
      const { error } = await supabase.from("user_post_comment_likes").insert({ comment_id: commentId, user_id: user.id });
      if (error) throw new Error(error.message);
      return { liked: true };
    }
  },

  // ── Reactions ────────────────────────────────────────────────────────────
  getReactions: async (postId: string) => {
    const { data, error } = await supabase
      .from("user_post_reactions")
      .select("id, post_id, user_id, emoji")
      .eq("post_id", postId);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getCommentLikers: async (commentId: string) => {
    const { data } = await supabase.from("user_post_comment_likes").select("user_id").eq("comment_id", commentId);
    if (!data?.length) return [];
    const ids = data.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
    return profiles ?? [];
  },

  getReactionLikers: async (postId: string, emoji: string) => {
    const { data } = await supabase.from("user_post_reactions").select("user_id").eq("post_id", postId).eq("emoji", emoji);
    if (!data?.length) return [];
    const ids = data.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
    return profiles ?? [];
  },

  toggleReaction: async (postId: string, emoji: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data: existing } = await supabase
      .from("user_post_reactions")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .eq("emoji", emoji)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase.from("user_post_reactions").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { added: false };
    } else {
      const { error } = await supabase.from("user_post_reactions").insert({ post_id: postId, user_id: user.id, emoji });
      if (error) throw new Error(error.message);
      return { added: true };
    }
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
