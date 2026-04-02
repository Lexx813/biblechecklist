// @ts-nocheck
import { supabase } from "../lib/supabase";

export const bookmarksApi = {
  list: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { threads: [], posts: [] };
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id, created_at, thread_id, post_id, thread:thread_id(id,title,category_id), post:post_id(id,title,slug,excerpt)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    return {
      threads: rows
        .filter(r => r.thread_id && r.thread)
        .map(r => ({ ...r.thread, bookmarkId: r.id, createdAt: r.created_at })),
      posts: rows
        .filter(r => r.post_id && r.post)
        .map(r => ({ ...r.post, bookmarkId: r.id, createdAt: r.created_at })),
    };
  },

  getIds: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { threadIds: [], postIds: [] };
    const { data, error } = await supabase
      .from("bookmarks")
      .select("thread_id, post_id")
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    return {
      threadIds: rows.filter(r => r.thread_id).map(r => r.thread_id),
      postIds: rows.filter(r => r.post_id).map(r => r.post_id),
    };
  },

  toggle: async (options) => {
    const { data, error } = await supabase.rpc("toggle_bookmark", {
      p_thread_id: options.threadId ?? null,
      p_post_id: options.postId ?? null,
    });
    if (error) throw new Error(error.message);
    return data;
  },
};
