import { supabase } from "../lib/supabase";

const PROFILE_FIELDS = "profiles!author_id(display_name, avatar_url, top_badge_level)";

export const forumApi = {
  // Categories with thread + reply counts
  listCategories: async () => {
    const { data, error } = await supabase
      .from("forum_categories")
      .select(`*, name_es, description_es, forum_threads(count)`)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // Threads in a category with reply count + author
  listThreads: async (categoryId) => {
    const { data, error } = await supabase
      .from("forum_threads")
      .select(`*, ${PROFILE_FIELDS}, forum_replies(count)`)
      .eq("category_id", categoryId)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // Single thread
  getThread: async (threadId) => {
    const { data, error } = await supabase
      .from("forum_threads")
      .select(`*, ${PROFILE_FIELDS}`)
      .eq("id", threadId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // Replies for a thread
  listReplies: async (threadId) => {
    const { data, error } = await supabase
      .from("forum_replies")
      .select(`*, ${PROFILE_FIELDS}`)
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  createThread: async (userId, categoryId, title, content) => {
    const { data, error } = await supabase
      .from("forum_threads")
      .insert({ author_id: userId, category_id: categoryId, title, content })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  createReply: async (userId, threadId, content) => {
    const { data, error } = await supabase
      .from("forum_replies")
      .insert({ author_id: userId, thread_id: threadId, content })
      .select(`*, ${PROFILE_FIELDS}`)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateThread: async (threadId, { title, content }) => {
    const { data, error } = await supabase
      .from("forum_threads")
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq("id", threadId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteThread: async (threadId) => {
    const { error } = await supabase.from("forum_threads").delete().eq("id", threadId);
    if (error) throw new Error(error.message);
  },

  updateReply: async (replyId, content) => {
    const { data, error } = await supabase
      .from("forum_replies")
      .update({ content })
      .eq("id", replyId)
      .select(`*, ${PROFILE_FIELDS}`)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteReply: async (replyId) => {
    const { error } = await supabase.from("forum_replies").delete().eq("id", replyId);
    if (error) throw new Error(error.message);
  },

  pinThread: async (threadId, value) => {
    const { error } = await supabase.rpc("admin_pin_thread", { p_thread_id: threadId, new_value: value });
    if (error) throw new Error(error.message);
  },

  lockThread: async (threadId, value) => {
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

  getUserLikes: async (userId) => {
    const { data, error } = await supabase.rpc("get_user_forum_likes", { p_user_id: userId });
    if (error) throw new Error(error.message);
    return data ?? { threads: [], replies: [] };
  },

  toggleThreadLike: async (threadId) => {
    const { data, error } = await supabase.rpc("toggle_thread_like", { p_thread_id: threadId });
    if (error) throw new Error(error.message);
    return data;
  },

  toggleReplyLike: async (replyId) => {
    const { data, error } = await supabase.rpc("toggle_reply_like", { p_reply_id: replyId });
    if (error) throw new Error(error.message);
    return data;
  },
};
