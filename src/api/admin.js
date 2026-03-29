import { supabase } from "../lib/supabase";

export const adminApi = {
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, is_admin, is_moderator, can_blog, is_banned, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  listUsers: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, is_admin, is_moderator, can_blog, is_banned, created_at, subscription_status, stripe_subscription_id")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  cancelSubscription: async (userId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-cancel-subscription`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to cancel subscription");
    return json;
  },

  deleteUser: async (userId) => {
    const { error } = await supabase.rpc("admin_delete_user", { target_user_id: userId });
    if (error) throw new Error(error.message);
  },

  setAdmin: async (userId, value) => {
    const { error } = await supabase.rpc("admin_set_admin", { target_user_id: userId, new_value: value });
    if (error) throw new Error(error.message);
  },

  setBlog: async (userId, value) => {
    const { error } = await supabase.rpc("admin_set_blog", { target_user_id: userId, new_value: value });
    if (error) throw new Error(error.message);
  },

  setModerator: async (userId, value) => {
    const { error } = await supabase.rpc("admin_set_moderator", { target_user_id: userId, new_value: value });
    if (error) throw new Error(error.message);
  },

  giftPremium: async (userId, value) => {
    const { error } = await supabase.rpc("admin_gift_premium", { target_user_id: userId, new_value: value });
    if (error) throw new Error(error.message);
  },

  banUser: async (userId, value) => {
    const { error } = await supabase.rpc("admin_ban_user", { target_user_id: userId, new_value: value });
    if (error) throw new Error(error.message);
  },

  listAllComments: async () => {
    const { data, error } = await supabase
      .from("blog_comments")
      .select("id, content, created_at, post_id, author_id, profiles!author_id(display_name), blog_posts!post_id(title, slug)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getQuizStats: async () => {
    const { data, error } = await supabase
      .from("user_quiz_progress")
      .select("level, unlocked, badge_earned, best_score, attempts");
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  listAllBlogPosts: async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, published, created_at, author_id, profiles!author_id(display_name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  listAllForumThreads: async () => {
    const { data, error } = await supabase
      .from("forum_threads")
      .select("id, title, created_at, author_id, pinned, locked, category_id, forum_replies(count), profiles!author_id(display_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  createUser: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },

  listAuditLog: async ({ limit = 100, offset = 0 } = {}) => {
    const { data, error } = await supabase
      .from("admin_audit_log")
      .select("id, action, target_id, target_email, metadata, created_at, actor:actor_id(display_name, email)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
