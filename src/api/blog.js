import { supabase } from "../lib/supabase";

const generateSlug = (title) =>
  title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-") + "-" + Date.now().toString(36);

export const blogApi = {
  listPublished: async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_url, published, created_at, author_id, like_count, profiles!author_id(display_name, avatar_url)")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getBySlug: async (slug) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*, profiles!author_id(display_name, avatar_url)")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  listMine: async (userId) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, published, created_at, updated_at")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  create: async (userId, post) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({ author_id: userId, slug: generateSlug(post.title), ...post })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (postId, updates) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", postId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  delete: async (postId) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", postId);
    if (error) throw new Error(error.message);
  },

  listComments: async (postId) => {
    const { data, error } = await supabase
      .from("blog_comments")
      .select("*, profiles!author_id(display_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  createComment: async (userId, postId, content) => {
    const { data, error } = await supabase
      .from("blog_comments")
      .insert({ author_id: userId, post_id: postId, content })
      .select("*, profiles!author_id(display_name, avatar_url)")
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteComment: async (commentId) => {
    const { error } = await supabase.from("blog_comments").delete().eq("id", commentId);
    if (error) throw new Error(error.message);
  },

  getUserLikes: async (userId) => {
    const { data, error } = await supabase.rpc("get_user_blog_likes", { p_user_id: userId });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  toggleLike: async (postId) => {
    const { data, error } = await supabase.rpc("toggle_blog_like", { p_post_id: postId });
    if (error) throw new Error(error.message);
    return data;
  },

  uploadCover: async (userId, file) => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("blog-covers")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data } = supabase.storage.from("blog-covers").getPublicUrl(path);
    return data.publicUrl;
  },
};
