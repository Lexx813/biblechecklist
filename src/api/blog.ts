import { supabase } from "../lib/supabase";
import { assertNoPII } from "../lib/pii";

export interface BlogPostTranslation { title?: string; excerpt?: string; content?: string }

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  subtitle: string | null;
  cover_url: string | null;
  published: boolean;
  created_at: string;
  author_id: string;
  like_count: number;
  view_count?: number;
  lang: string | null;
  translations: Record<string, BlogPostTranslation> | null;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
  tags: string[];
  read_time_minutes: number;
}

export interface PostSeries {
  id: string;
  title: string;
  author_id: string;
  created_at: string;
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
      .select("id, title, slug, excerpt, cover_url, published, created_at, author_id, like_count, translations, lang, tags, read_time_minutes, profiles!author_id(display_name, avatar_url)")
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

  getBySlugForEdit: async (slug: string) => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, subtitle, content, cover_url, tags, published, slug, excerpt, is_featured")
      .eq("slug", slug)
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
      .select("id, title, slug, excerpt, content, cover_url, published, created_at, updated_at, translations, lang")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  listAll: async (): Promise<{ id: string; slug: string; published: boolean }[]> => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, slug, published")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as { id: string; slug: string; published: boolean }[];
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
        tags: (post as Record<string, unknown>).tags ?? [],
        subtitle: (post as Record<string, unknown>).subtitle ?? null,
        read_time_minutes: (post as Record<string, unknown>).read_time_minutes ?? 0,
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
        ...((updates as Record<string, unknown>).tags !== undefined && { tags: (updates as Record<string, unknown>).tags }),
        ...((updates as Record<string, unknown>).subtitle !== undefined && { subtitle: (updates as Record<string, unknown>).subtitle }),
        ...((updates as Record<string, unknown>).read_time_minutes !== undefined && { read_time_minutes: (updates as Record<string, unknown>).read_time_minutes }),
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

  getPostLikers: async (postId: string) => {
    const { data } = await supabase.from("blog_post_likes").select("user_id").eq("post_id", postId);
    if (!data?.length) return [];
    const ids = data.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
    return profiles ?? [];
  },

  getTagSuggestions: async (): Promise<string[]> => {
    const { data, error } = await supabase.rpc("get_distinct_tags");
    if (error) return [];
    return (data as string[]) ?? [];
  },

  listSeries: async (authorId: string): Promise<PostSeries[]> => {
    const { data, error } = await supabase
      .from("post_series")
      .select("id, title, author_id, created_at")
      .eq("author_id", authorId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  createSeries: async (authorId: string, title: string): Promise<PostSeries> => {
    const { data, error } = await supabase
      .from("post_series")
      .insert({ author_id: authorId, title })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  addToSeries: async (seriesId: string, postId: string, position: number): Promise<void> => {
    const { error } = await supabase
      .from("post_series_items")
      .upsert({ series_id: seriesId, post_id: postId, position });
    if (error) throw new Error(error.message);
  },

  getFeaturedPost: async (): Promise<BlogPost | null> => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, subtitle, cover_url, published, created_at, author_id, like_count, translations, lang, tags, read_time_minutes, profiles!author_id(display_name, avatar_url)")
      .eq("published", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data as unknown as BlogPost | null;
  },

  getTrendingPosts: async (): Promise<BlogPost[]> => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_url, created_at, author_id, like_count, view_count, tags, read_time_minutes, profiles!author_id(display_name, avatar_url)")
      .eq("published", true)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("like_count", { ascending: false })
      .limit(5);
    if (error) return [];
    return (data ?? []) as unknown as BlogPost[];
  },

  getActiveWriters: async (): Promise<Array<{ id: string; display_name: string | null; avatar_url: string | null; post_count: number }>> => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("author_id, profiles!author_id(id, display_name, avatar_url)")
      .eq("published", true)
      .gte("created_at", since);
    if (error || !data) return [];
    const counts: Record<string, { id: string; display_name: string | null; avatar_url: string | null; post_count: number }> = {};
    for (const row of data as unknown as Array<{ author_id: string; profiles: { id: string; display_name: string | null; avatar_url: string | null } }>) {
      const p = row.profiles;
      if (!p?.id) continue;
      if (!counts[p.id]) counts[p.id] = { id: p.id, display_name: p.display_name, avatar_url: p.avatar_url, post_count: 0 };
      counts[p.id].post_count++;
    }
    return Object.values(counts).sort((a, b) => b.post_count - a.post_count).slice(0, 4);
  },

  searchPosts: async (query: string, tag: string | null = null): Promise<BlogPost[]> => {
    let q = supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_url, created_at, author_id, like_count, tags, read_time_minutes, profiles!author_id(display_name, avatar_url)")
      .eq("published", true);
    if (query) {
      q = q.textSearch("search_vector", query, { type: "websearch" });
    }
    if (tag && tag !== "All") {
      q = q.contains("tags", [tag]);
    }
    const { data, error } = await q.order("created_at", { ascending: false }).limit(20);
    if (error) return [];
    return (data ?? []) as unknown as BlogPost[];
  },

  getRelatedPosts: async (postId: string, tags: string[]): Promise<BlogPost[]> => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, cover_url, created_at, author_id, like_count, read_time_minutes, profiles!author_id(display_name, avatar_url)")
      .eq("published", true)
      .neq("id", postId)
      .overlaps("tags", tags.length ? tags : ["__no_match__"])
      .order("like_count", { ascending: false })
      .limit(3);
    if (error || !data?.length) {
      const { data: fallback } = await supabase
        .from("blog_posts")
        .select("id, title, slug, cover_url, created_at, author_id, like_count, read_time_minutes, profiles!author_id(display_name, avatar_url)")
        .eq("published", true)
        .neq("id", postId)
        .order("like_count", { ascending: false })
        .limit(3);
      return (fallback ?? []) as unknown as BlogPost[];
    }
    return data as unknown as BlogPost[];
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
