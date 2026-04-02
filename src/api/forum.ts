import { supabase } from "../lib/supabase";
import { assertNoPII } from "../lib/pii";

const PROFILE_FIELDS = "profiles!author_id(display_name, avatar_url, top_badge_level, is_moderator, is_admin)";

export const forumApi = {
  // Categories with translations + thread counts.
  // All language rows are fetched once; the caller picks the right lang.
  listCategories: async () => {
    const { data, error } = await supabase
      .from("forum_categories")
      .select(`*, forum_category_translations(lang, name, description), forum_threads(count)`)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // Threads in a category with reply count + author
  // lang: undefined = all languages, string = filter to that lang
  listThreads: async (categoryId: string, limit = 20, lang: string | null = null) => {
    let q = supabase
      .from("forum_threads")
      .select(`*, ${PROFILE_FIELDS}, forum_replies(count)`)
      .eq("category_id", categoryId)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (lang) q = q.eq("lang", lang);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // Single thread
  getThread: async (threadId: string) => {
    const { data, error } = await supabase
      .from("forum_threads")
      .select(`*, ${PROFILE_FIELDS}`)
      .eq("id", threadId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // Replies for a thread
  listReplies: async (threadId: string) => {
    const { data, error } = await supabase
      .from("forum_replies")
      .select(`*, ${PROFILE_FIELDS}`)
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  createThread: async (userId: string, categoryId: string, title: string, content: string, lang = "en") => {
    assertNoPII(title, content);
    const { data, error } = await supabase
      .from("forum_threads")
      .insert({ author_id: userId, category_id: categoryId, title, content, lang })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  createReply: async (userId: string, threadId: string, content: string) => {
    assertNoPII(content);
    const { data, error } = await supabase
      .from("forum_replies")
      .insert({ author_id: userId, thread_id: threadId, content })
      .select(`*, ${PROFILE_FIELDS}`)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateThread: async (threadId: string, { title, content }: { title: string; content: string }) => {
    assertNoPII(title, content);
    const { data, error } = await supabase
      .from("forum_threads")
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq("id", threadId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteThread: async (threadId: string) => {
    const { error } = await supabase.from("forum_threads").delete().eq("id", threadId);
    if (error) throw new Error(error.message);
  },

  updateReply: async (replyId: string, content: string) => {
    assertNoPII(content);
    const { data, error } = await supabase
      .from("forum_replies")
      .update({ content })
      .eq("id", replyId)
      .select(`*, ${PROFILE_FIELDS}`)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteReply: async (replyId: string) => {
    const { error } = await supabase.from("forum_replies").delete().eq("id", replyId);
    if (error) throw new Error(error.message);
  },

  pinThread: async (threadId: string, value: boolean) => {
    const { error } = await supabase.rpc("admin_pin_thread", { p_thread_id: threadId, new_value: value });
    if (error) throw new Error(error.message);
  },

  lockThread: async (threadId: string, value: boolean) => {
    const { error } = await supabase.rpc("admin_lock_thread", { p_thread_id: threadId, new_value: value });
    if (error) throw new Error(error.message);
  },

  listTopThreads: async (limit = 4) => {
    const { data, error } = await supabase
      .from("forum_threads")
      .select(`*, ${PROFILE_FIELDS}, forum_replies(count)`)
      .order("like_count", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getUserLikes: async (userId: string) => {
    const { data, error } = await supabase.rpc("get_user_forum_likes", { p_user_id: userId });
    if (error) throw new Error(error.message);
    return data ?? { threads: [], replies: [] };
  },

  toggleThreadLike: async (threadId: string) => {
    const { data, error } = await supabase.rpc("toggle_thread_like", { p_thread_id: threadId });
    if (error) throw new Error(error.message);
    return data;
  },

  toggleReplyLike: async (replyId: string) => {
    const { data, error } = await supabase.rpc("toggle_reply_like", { p_reply_id: replyId });
    if (error) throw new Error(error.message);
    return data;
  },

  // Mark/unmark a reply as the accepted solution for a thread
  markSolution: async (replyId: string, threadId: string, value: boolean) => {
    const { error } = await supabase.rpc("mark_reply_as_solution", {
      p_reply_id: replyId,
      p_thread_id: threadId,
      p_value: value,
    });
    if (error) throw new Error(error.message);
  },

  incrementView: async (threadId: string) => {
    await supabase.rpc("increment_thread_view", { p_thread_id: threadId });
  },

  toggleWatch: async (threadId: string) => {
    const { data, error } = await supabase.rpc("toggle_thread_watch", { p_thread_id: threadId });
    if (error) throw new Error(error.message);
    return data;
  },

  getUserWatches: async (userId: string) => {
    const { data, error } = await supabase.rpc("get_user_thread_watches", { p_user_id: userId });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  toggleReaction: async (contentType: string, contentId: string, emoji: string) => {
    const { data, error } = await supabase.rpc("toggle_forum_reaction", {
      p_content_type: contentType,
      p_content_id: contentId,
      p_emoji: emoji,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  getThreadReactions: async (threadId: string, userId: string) => {
    const { data, error } = await supabase.rpc("get_thread_reactions", {
      p_thread_id: threadId,
      p_user_id: userId,
    });
    if (error) throw new Error(error.message);
    return data ?? { counts: {}, mine: [] };
  },

  getUserForumStats: async (userId: string) => {
    const { data, error } = await supabase.rpc("get_user_forum_stats", { p_user_id: userId });
    if (error) throw new Error(error.message);
    return data ?? { threads: 0, replies: 0 };
  },

  // Category management (admin)
  createCategory: async (icon: string, name: string, description: string, sortOrder: number) => {
    const { data, error } = await supabase
      .from("forum_categories")
      .insert({ icon, name, description, sort_order: sortOrder })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateCategory: async (categoryId: string, updates: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from("forum_categories")
      .update(updates)
      .eq("id", categoryId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteCategory: async (categoryId: string) => {
    const { error } = await supabase.from("forum_categories").delete().eq("id", categoryId);
    if (error) throw new Error(error.message);
  },
};
