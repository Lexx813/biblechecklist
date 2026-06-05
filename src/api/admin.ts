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

// Shape returned by the admin_list_users / admin_get_profile RPCs. Mirrors the
// full `profiles` row — those RPCs are SECURITY DEFINER gated on is_admin().
export interface AdminProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  is_moderator: boolean | null;
  is_banned: boolean | null;
  can_blog: boolean | null;
  is_approved_creator: boolean | null;
  subscription_status: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string | null;
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
  // Both reads go through SECURITY DEFINER RPCs that re-check is_admin() —
  // direct column SELECT on email / stripe_* / subscription_status is revoked
  // for `authenticated` to stop a PII dump.
  getProfile: async (userId: string): Promise<AdminProfileRow | null> => {
    const { data, error } = await supabase.rpc("admin_get_profile", { p_user_id: userId });
    if (error) throw new Error(error.message);
    if (!data) return null;
    return (Array.isArray(data) ? data[0] : data) as AdminProfileRow;
  },

  listUsers: async (): Promise<AdminProfileRow[]> => {
    const { data, error } = await supabase.rpc("admin_list_users", { p_limit: 1000 });
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminProfileRow[];
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

  // Self-service: delete the caller's own account. Target is derived server-side
  // from the bearer token, so this can never be used to delete someone else.
  deleteOwnAccount: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");
    const res = await fetch("/api/delete-account", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(json.error ?? "Failed to delete account");
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
    const { data, error } = await supabase.rpc("admin_list_audit_log", { p_limit: limit, p_offset: offset });
    if (error) throw new Error(error.message);
    type Row = {
      id: string;
      action: string;
      target_id: string | null;
      target_email: string | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
      actor_display_name: string | null;
      actor_email: string | null;
    };
    return ((data ?? []) as Row[]).map((r) => ({
      id: r.id,
      action: r.action,
      target_id: r.target_id,
      target_email: r.target_email,
      metadata: r.metadata,
      created_at: r.created_at,
      actor: r.actor_email || r.actor_display_name
        ? { display_name: r.actor_display_name, email: r.actor_email }
        : null,
    }));
  },
};

// ── Analytics ─────────────────────────────────────────────────────────────

export interface AnalyticsKpis {
  totalUsers: number;
  newUsersThisWeek: number;
  dailyActiveToday: number;
  dauChangePct: number;
  retentionPct30d: number;
  chaptersToday: number;
  avgStreak: number;
}

// The previous analyticsApi made bare SELECTs against profiles, reading_activity,
// chapter_reads, forum_threads, etc. directly. RLS on those tables only exposes
// rows the calling user owns, so the admin dashboard collapsed to zeros even
// for the real admin. We now call SECURITY DEFINER RPCs (migration
// 20260523_admin_analytics_rpcs.sql) that aggregate server-side and gate on
// public.is_admin(). The JSON shapes here mirror what the dashboard already
// expects, so the AnalyticsTab consumer didn't change.

async function callRpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args ?? {});
  if (error) throw new Error(`${name}: ${error.message}`);
  return data as T;
}

export const analyticsApi = {
  async getKpis(): Promise<AnalyticsKpis> {
    return callRpc<AnalyticsKpis>("admin_get_analytics_kpis");
  },

  async getSignupsSeries(days: number): Promise<{ date: string; count: number }[]> {
    return callRpc<{ date: string; count: number }[]>("admin_get_signups_series", { p_days: days });
  },

  async getDauSeries(days: number): Promise<{ date: string; count: number }[]> {
    return callRpc<{ date: string; count: number }[]>("admin_get_dau_series", { p_days: days });
  },

  // Time-bucketed growth series (day/week/month/year) for the range selector.
  async getGrowthSeries(
    metric: "signups" | "dau",
    bucket: "day" | "week" | "month" | "year",
    points: number,
  ): Promise<{ date: string; count: number }[]> {
    return callRpc<{ date: string; count: number }[]>("admin_get_growth_series", {
      p_metric: metric,
      p_bucket: bucket,
      p_points: points,
    });
  },

  async getFeatureUsage(): Promise<{ feature: string; pct: number }[]> {
    return callRpc<{ feature: string; pct: number }[]>("admin_get_feature_usage");
  },

  // ── Per-feature drill-down: top N users by activity count in last 30 days ──
  async getFeatureLeaders(feature: string, limit = 50): Promise<Array<{
    user_id: string;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
    count: number;
    last_activity: string | null;
  }>> {
    return callRpc<Array<{
      user_id: string;
      display_name: string | null;
      email: string | null;
      avatar_url: string | null;
      count: number;
      last_activity: string | null;
    }>>("admin_get_feature_leaders", { p_feature: feature, p_limit: limit });
  },

  async getRetentionCohorts(): Promise<{ label: string; pct: number }[]> {
    return callRpc<{ label: string; pct: number }[]>("admin_get_retention_cohorts");
  },

  async getReadingAdoption(): Promise<{ bucket: string; count: number }[]> {
    return callRpc<{ bucket: string; count: number }[]>("admin_get_reading_adoption");
  },

  async getCompletionHistogram(): Promise<{ bucket: string; count: number }[]> {
    return callRpc<{ bucket: string; count: number }[]>("admin_get_completion_histogram");
  },

  async getBookHeatmap(): Promise<{ bookIndex: number; pct: number }[]> {
    return callRpc<{ bookIndex: number; pct: number }[]>("admin_get_book_heatmap");
  },
};
