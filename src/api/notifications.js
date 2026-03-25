import { supabase } from "../lib/supabase";

export const notificationsApi = {
  list: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("notifications")
      .select("*, actor:actor_id(display_name, avatar_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  markRead: async (ids) => {
    const { error } = await supabase.rpc("mark_notifications_read", { p_ids: ids });
    if (error) throw new Error(error.message);
  },

  markAllRead: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (error) throw new Error(error.message);
  },

  delete: async (id) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  clearAll: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("notifications").delete().eq("user_id", user.id);
    if (error) throw new Error(error.message);
  },

  // Called client-side after creating a reply/comment/mention
  create: async (userId, actorId, type, options = {}) => {
    const { error } = await supabase.rpc("create_notification", {
      p_user_id: userId,
      p_actor_id: actorId,
      p_type: type,
      p_thread_id: options.threadId ?? null,
      p_post_id: options.postId ?? null,
      p_preview: options.preview ?? null,
      p_link_hash: options.linkHash ?? null,
    });
    if (error) console.warn("notification failed:", error.message);
  },
};
