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
      .select("id, email, is_admin, is_moderator, can_blog, is_banned, created_at, subscription_status, stripe_subscription_id")
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

  createUser: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },
};
