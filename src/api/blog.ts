import { supabase } from "../lib/supabase";
import { assertNoPII } from "../lib/pii";

interface BlogPostInput {
  title: string;
  excerpt?: string;
  content?: string;
  [key: string]: unknown;
}

interface BlogPostUpdates {
  title?: string;
  excerpt?: string;
  content?: string;
  [key: string]: unknown;
}

const generateSlug = (title: string): string =>
  title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-") + "-" + Date.now().toString(36);

export const blogApi = {
  listPublished: async (lang: string | null = null) => {
    let q = supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_url, published, created_at, author_id, like_count, translations, lang, profiles!author_id(display_name, avatar_url)")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (lang) q = q.eq("lang", lang);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getBySlug: async (slug: string) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*, profiles!author_id(display_name, avatar_url)")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  incrementViewCount: async (postId: string) => {
    const { error } = await supabase.rpc("increment_blog_view", { p_post_id: postId });
    if (error) console.error("View count error:", error.message);
  },

  listMine: async (userId: string) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, content, cover_url, published, created_at, updated_at")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  create: async (userId: string, post: BlogPostInput) => {
    assertNoPII(post.title, post.excerpt, post.content);
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({ author_id: userId, slug: generateSlug(post.title), ...post })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (postId: string, updates: BlogPostUpdates) => {
    assertNoPII(updates.title, updates.excerpt, updates.content);
    const { data, error } = await supabase
      .from("blog_posts")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", postId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  delete: async (postId: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", postId);
    if (error) throw new Error(error.message);
  },

  listComments: async (postId: string) => {
    const { data, error } = await supabase
      .from("blog_comments")
      .select("*, profiles!author_id(display_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  createComment: async (userId: string, postId: string, content: string) => {
    assertNoPII(content);
    const { data, error } = await supabase
      .from("blog_comments")
      .insert({ author_id: userId, post_id: postId, content })
      .select("*, profiles!author_id(display_name, avatar_url)")
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteComment: async (commentId: string) => {
    const { error } = await supabase.from("blog_comments").delete().eq("id", commentId);
    if (error) throw new Error(error.message);
  },

  getUserLikes: async (userId: string) => {
    const { data, error } = await supabase.rpc("get_user_blog_likes", { p_user_id: userId });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  toggleLike: async (postId: string) => {
    const { data, error } = await supabase.rpc("toggle_blog_like", { p_post_id: postId });
    if (error) throw new Error(error.message);
    return data;
  },

  uploadCover: async (userId: string, file: File) => {
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Only JPEG, PNG, WebP, or GIF images are allowed.");
    if (file.size > MAX_SIZE) throw new Error("Image must be under 5 MB.");
    const ext = file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("blog-covers")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data } = supabase.storage.from("blog-covers").getPublicUrl(path);
    return data.publicUrl;
  },
};
