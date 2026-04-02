import { supabase } from "../lib/supabase";

export interface NotificationActor {
  display_name: string | null;
  avatar_url: string | null;
}

export interface NotificationThread {
  category_id: string | null;
}

export interface NotificationPost {
  slug: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  thread_id: string | null;
  post_id: string | null;
  preview: string | null;
  link_hash: string | null;
  read: boolean;
  created_at: string;
  actor: NotificationActor | null;
  thread: NotificationThread | null;
  post: NotificationPost | null;
}

export interface CreateNotificationOptions {
  threadId?: string | null;
  postId?: string | null;
  preview?: string | null;
  linkHash?: string | null;
}

export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("notifications")
      .select("*, actor:actor_id(display_name, avatar_url), thread:thread_id(category_id), post:post_id(slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw new Error(error.message);
    return (data ?? []) as Notification[];
  },

  markRead: async (ids: string[]): Promise<void> => {
    const { error } = await supabase.rpc("mark_notifications_read", { p_ids: ids });
    if (error) throw new Error(error.message);
  },

  markAllRead: async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (error) throw new Error(error.message);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  clearAll: async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("notifications").delete().eq("user_id", user.id);
    if (error) throw new Error(error.message);
  },

  // Called client-side after creating a reply/comment/mention
  create: async (
    userId: string,
    actorId: string,
    type: string,
    options: CreateNotificationOptions = {}
  ): Promise<void> => {
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
