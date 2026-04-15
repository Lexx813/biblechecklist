import { supabase } from "../lib/supabase";
import { assertNoPII } from "../lib/pii";

export interface BlogPostTranslation { title?: string; excerpt?: string }

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
  published: boolean;
  created_at: string;
  author_id: string;
  like_count: number;
  lang: string | null;
  translations: Record<string, BlogPostTranslation> | null;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

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
  listPublished: async (lang: string | null = null): Promise<BlogPost[]> => {
    let q = supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_url, published, created_at, author_id, like_count, translations, lang, profiles!author_id(display_name, avatar_url)")
      .eq("published", true)
      .order("created_at", { ascending: false });
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as BlogPost[];
    if (!lang) return rows;
    const inLang = rows.filter(p => p.lang === lang || (p.translations && p.translations[lang]));
    return inLang.length > 0 ? inLang : rows;
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
    assertNoPII(post.title, post.excerpt ?? "", post.content ?? "");
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        author_id: userId,
        slug: generateSlug(post.title),
        title: post.title,
        excerpt: post.excerpt ?? null,
        content: post.content ?? null,
        cover_url: (post as Record<string, unknown>).cover_url ?? null,
        published: (post as Record<string, unknown>).published ?? false,
        lang: (post as Record<string, unknown>).lang ?? "en",
        translations: (post as Record<string, unknown>).translations ?? {},
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (postId: string, updates: BlogPostUpdates) => {
    if (updates.title) assertNoPII(updates.title);
    if (updates.excerpt) assertNoPII(updates.excerpt);
    if (updates.content) assertNoPII(updates.content);
    const { data, error } = await supabase
      .from("blog_posts")
      .update({
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.excerpt !== undefined && { excerpt: updates.excerpt }),
        ...(updates.content !== undefined && { content: updates.content }),
        ...((updates as Record<string, unknown>).cover_url !== undefined && { cover_url: (updates as Record<string, unknown>).cover_url }),
        ...((updates as Record<string, unknown>).published !== undefined && { published: (updates as Record<string, unknown>).published }),
        ...((updates as Record<string, unknown>).lang !== undefined && { lang: (updates as Record<string, unknown>).lang }),
        ...((updates as Record<string, unknown>).translations !== undefined && { translations: (updates as Record<string, unknown>).translations }),
        updated_at: new Date().toISOString(),
      })
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
    const ALLOWED_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (!ALLOWED_TYPES[file.type]) throw new Error("Only JPEG, PNG, WebP, or GIF images are allowed.");
    if (file.size > MAX_SIZE) throw new Error("Image must be under 5 MB.");
    const ext = ALLOWED_TYPES[file.type];
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("blog-covers")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data } = supabase.storage.from("blog-covers").getPublicUrl(path);
    return data.publicUrl;
  },
};
