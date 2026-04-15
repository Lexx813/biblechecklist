import { supabase } from "../lib/supabase";

export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  created_at: string;
  author_id: string;
  profiles: { display_name: string | null } | null;
}

export interface AdminForumThread {
  id: string;
  title: string;
  created_at: string;
  author_id: string;
  pinned: boolean;
  locked: boolean;
  category_id: string | null;
  forum_replies: { count: number }[];
  profiles: { display_name: string | null } | null;
}

export interface AdminComment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  author_id: string;
  profiles: { display_name: string | null } | null;
  blog_posts: { title: string; slug: string } | null;
}

export interface AdminAuditEntry {
  id: string;
  action: string;
  target_id: string | null;
  target_email: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor: { display_name: string | null; email: string | null } | null;
}

export const adminApi = {
  getProfile: async (userId: string) => {
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
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  deleteUser: async (userId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");
    const res = await fetch("/api/admin-delete-user", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId }),
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(json.error ?? "Failed to delete user");
  },

  setAdmin: async (userId: string, value: boolean) => {
    const { error } = await supabase.rpc("admin_set_admin", { target_user_id: userId, new_value: value });
    if (error) throw new Error(error.message);
  },

  setBlog: async (userId: string, value: boolean) => {
    const { error } = await supabase.rpc("admin_set_blog", { target_user_id: userId, new_value: value });
    if (error) throw new Error(error.message);
  },

  setModerator: async (userId: string, value: boolean) => {
    const { error } = await supabase.rpc("admin_set_moderator", { target_user_id: userId, new_value: value });
    if (error) throw new Error(error.message);
  },

  banUser: async (userId: string, value: boolean) => {
    const { error } = await supabase.rpc("admin_ban_user", { target_user_id: userId, new_value: value });
    if (error) throw new Error(error.message);
  },

  listAllComments: async (): Promise<AdminComment[]> => {
    const { data, error } = await supabase
      .from("blog_comments")
      .select("id, content, created_at, post_id, author_id, profiles!author_id(display_name), blog_posts!post_id(title, slug)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as AdminComment[];
  },

  getQuizStats: async () => {
    const { data, error } = await supabase
      .from("user_quiz_progress")
      .select("level, unlocked, badge_earned, best_score, attempts");
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  listAllBlogPosts: async (): Promise<AdminBlogPost[]> => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, published, created_at, author_id, profiles!author_id(display_name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as AdminBlogPost[];
  },

  listAllForumThreads: async (): Promise<AdminForumThread[]> => {
    const { data, error } = await supabase
      .from("forum_threads")
      .select("id, title, created_at, author_id, pinned, locked, category_id, forum_replies(count), profiles!author_id(display_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as AdminForumThread[];
  },

  createUser: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    return data;
  },

  listAuditLog: async ({ limit = 100, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<AdminAuditEntry[]> => {
    const { data, error } = await supabase
      .from("admin_audit_log")
      .select("id, action, target_id, target_email, metadata, created_at, actor:actor_id(display_name, email)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as AdminAuditEntry[];
  },
};
