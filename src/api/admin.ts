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

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function computeCurrentStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  const dateSet = new Set(sortedDates);
  let streak = 0;
  let cursor = dateSet.has(today) ? today : (dateSet.has(yesterday) ? yesterday : null);
  if (!cursor) return 0;
  while (dateSet.has(cursor)) {
    streak++;
    const prev = new Date(cursor);
    prev.setDate(prev.getDate() - 1);
    cursor = toDateStr(prev);
  }
  return streak;
}

export const analyticsApi = {
  async getKpis(): Promise<AnalyticsKpis> {
    const now = new Date();
    const todayStr = toDateStr(now);
    const sevenDaysAgo = toDateStr(new Date(now.getTime() - 7 * 86400000));
    const thirtyDaysAgo = toDateStr(new Date(now.getTime() - 30 * 86400000));
    const sixtyDaysAgo = toDateStr(new Date(now.getTime() - 60 * 86400000));
    const lastWeekSameDay = toDateStr(new Date(now.getTime() - 7 * 86400000));
    const ninetyDaysAgo = toDateStr(new Date(now.getTime() - 90 * 86400000));

    const [
      { count: totalUsers },
      { count: newUsersThisWeek },
      dauToday,
      dauLastWeek,
      cohort30to60,
      cohortActive30d,
      chaptersToday,
      recentActivity,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo + "T00:00:00"),
      supabase.from("reading_activity").select("user_id").eq("activity_date", todayStr),
      supabase.from("reading_activity").select("user_id").eq("activity_date", lastWeekSameDay),
      supabase.from("profiles").select("id").gte("created_at", sixtyDaysAgo + "T00:00:00").lt("created_at", thirtyDaysAgo + "T00:00:00"),
      supabase.from("reading_activity").select("user_id").gte("activity_date", thirtyDaysAgo),
      supabase.from("chapter_reads").select("*", { count: "exact", head: true }).gte("read_at", todayStr + "T00:00:00"),
      supabase.from("reading_activity").select("user_id, activity_date").gte("activity_date", ninetyDaysAgo),
    ]);

    const dauTodayCount = new Set((dauToday.data ?? []).map(r => r.user_id)).size;
    const dauLastWeekCount = new Set((dauLastWeek.data ?? []).map(r => r.user_id)).size;
    const dauChangePct = dauLastWeekCount > 0
      ? Math.round(((dauTodayCount - dauLastWeekCount) / dauLastWeekCount) * 100)
      : 0;

    const cohort30to60Ids = new Set((cohort30to60.data ?? []).map(r => r.id));
    const activeInLast30Ids = new Set((cohortActive30d.data ?? []).map(r => r.user_id));
    const retentionPct30d = cohort30to60Ids.size > 0
      ? Math.round([...cohort30to60Ids].filter(id => activeInLast30Ids.has(id)).length / cohort30to60Ids.size * 100)
      : 0;

    // Compute avg streak from reading_activity
    const byUser: Record<string, string[]> = {};
    for (const r of recentActivity.data ?? []) {
      if (!byUser[r.user_id]) byUser[r.user_id] = [];
      byUser[r.user_id].push(r.activity_date);
    }
    const streaks = Object.values(byUser).map(dates => computeCurrentStreak([...new Set(dates)].sort()));
    const activeStreaks = streaks.filter(s => s > 0);
    const avgStreak = activeStreaks.length > 0
      ? Math.round(activeStreaks.reduce((a, b) => a + b, 0) / activeStreaks.length)
      : 0;

    return {
      totalUsers: totalUsers ?? 0,
      newUsersThisWeek: newUsersThisWeek ?? 0,
      dailyActiveToday: dauTodayCount,
      dauChangePct,
      retentionPct30d,
      chaptersToday: chaptersToday.count ?? 0,
      avgStreak,
    };
  },

  async getSignupsSeries(days: number): Promise<{ date: string; count: number }[]> {
    const start = toDateStr(new Date(Date.now() - days * 86400000));
    const { data } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", start + "T00:00:00");

    const counts: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = toDateStr(new Date(Date.now() - (days - 1 - i) * 86400000));
      counts[d] = 0;
    }
    for (const row of data ?? []) {
      const d = (row.created_at as string).split("T")[0];
      if (d in counts) counts[d]++;
    }
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  },

  async getDauSeries(days: number): Promise<{ date: string; count: number }[]> {
    const start = toDateStr(new Date(Date.now() - days * 86400000));
    const { data } = await supabase
      .from("reading_activity")
      .select("activity_date, user_id")
      .gte("activity_date", start);

    const counts: Record<string, Set<string>> = {};
    for (let i = 0; i < days; i++) {
      const d = toDateStr(new Date(Date.now() - (days - 1 - i) * 86400000));
      counts[d] = new Set();
    }
    for (const row of data ?? []) {
      if (row.activity_date in counts) counts[row.activity_date].add(row.user_id);
    }
    return Object.entries(counts).map(([date, set]) => ({ date, count: set.size }));
  },

  async getFeatureUsage(): Promise<{ feature: string; pct: number }[]> {
    const thirtyDaysAgo = toDateStr(new Date(Date.now() - 30 * 86400000));

    const [
      { count: totalUsers },
      reading,
      forumThreads,
      forumReplies,
      msgs,
      quiz,
      notes,
      groups,
      videoLikes,
      videoComments,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("reading_activity").select("user_id").gte("activity_date", thirtyDaysAgo),
      supabase.from("forum_threads").select("author_id").gte("created_at", thirtyDaysAgo + "T00:00:00"),
      supabase.from("forum_replies").select("author_id").gte("created_at", thirtyDaysAgo + "T00:00:00"),
      supabase.from("messages").select("sender_id").gte("created_at", thirtyDaysAgo + "T00:00:00"),
      supabase.from("challenge_attempts").select("user_id").gte("created_at", thirtyDaysAgo + "T00:00:00"),
      supabase.from("study_notes").select("user_id").gte("created_at", thirtyDaysAgo + "T00:00:00"),
      supabase.from("study_group_members").select("user_id"),
      supabase.from("video_likes").select("user_id").gte("created_at", thirtyDaysAgo + "T00:00:00"),
      supabase.from("video_comments").select("author_id").gte("created_at", thirtyDaysAgo + "T00:00:00"),
    ]);

    const total = totalUsers ?? 1;

    const uniqUserIds = (arr: { user_id?: string | null }[]) =>
      new Set(arr.map(r => r.user_id).filter(Boolean)).size;
    const uniqAuthorIds = (arr: { author_id?: string | null }[]) =>
      new Set(arr.map(r => r.author_id).filter(Boolean)).size;

    const forumUsers = new Set([
      ...(forumThreads.data ?? []).map(r => r.author_id),
      ...(forumReplies.data ?? []).map(r => r.author_id),
    ]).size;
    const videoUsers = new Set([
      ...(videoLikes.data ?? []).map(r => r.user_id),
      ...(videoComments.data ?? []).map(r => r.author_id),
    ]).size;

    const features = [
      { feature: "Reading",  count: uniqUserIds(reading.data ?? []) },
      { feature: "Forum",    count: forumUsers },
      { feature: "Messages", count: new Set((msgs.data ?? []).map(r => r.sender_id).filter(Boolean)).size },
      { feature: "Quiz",     count: uniqUserIds(quiz.data ?? []) },
      { feature: "Notes",    count: uniqUserIds(notes.data ?? []) },
      { feature: "Groups",   count: uniqUserIds(groups.data ?? []) },
      { feature: "Videos",   count: videoUsers },
    ];

    void uniqAuthorIds; // suppress unused warning

    return features
      .map(f => ({ feature: f.feature, pct: Math.round((f.count / total) * 100) }))
      .sort((a, b) => b.pct - a.pct);
  },

  async getRetentionCohorts(): Promise<{ label: string; pct: number }[]> {
    const now = Date.now();
    const sevenDaysAgo = toDateStr(new Date(now - 7 * 86400000));
    const { data: recentActivity } = await supabase
      .from("reading_activity")
      .select("user_id")
      .gte("activity_date", sevenDaysAgo);
    const activeIds = new Set((recentActivity ?? []).map(r => r.user_id));

    const cohorts: { label: string; weeksAgo: number; windowDays: number }[] = [
      { label: "Week 1",   weeksAgo: 1,  windowDays: 7 },
      { label: "Week 2",   weeksAgo: 2,  windowDays: 7 },
      { label: "Week 4",   weeksAgo: 4,  windowDays: 7 },
      { label: "Week 8",   weeksAgo: 8,  windowDays: 7 },
      { label: "Week 12+", weeksAgo: 12, windowDays: 30 },
    ];

    const results = await Promise.all(
      cohorts.map(async ({ label, weeksAgo, windowDays }) => {
        const end   = toDateStr(new Date(now - weeksAgo * 7 * 86400000));
        const start = toDateStr(new Date(now - (weeksAgo * 7 + windowDays) * 86400000));
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .gte("created_at", start + "T00:00:00")
          .lt("created_at", end + "T00:00:00");
        const cohortIds = data ?? [];
        const retained = cohortIds.filter(r => activeIds.has(r.id)).length;
        const pct = cohortIds.length > 0
          ? Math.round((retained / cohortIds.length) * 100)
          : 0;
        return { label, pct };
      })
    );
    return results;
  },

  async getReadingAdoption(): Promise<{ bucket: string; count: number }[]> {
    const todayStr = toDateStr(new Date());
    const thirtyDaysAgo = toDateStr(new Date(Date.now() - 30 * 86400000));

    const [hasPlans, activeMonth, activeToday, completed] = await Promise.all([
      supabase.from("user_reading_plans").select("user_id"),
      supabase.from("reading_activity").select("user_id").gte("activity_date", thirtyDaysAgo),
      supabase.from("reading_activity").select("user_id").eq("activity_date", todayStr),
      supabase.from("reading_plan_completions").select("user_id"),
    ]);

    return [
      { bucket: "Has reading plan",   count: new Set((hasPlans.data ?? []).map(r => r.user_id)).size },
      { bucket: "Active this month",  count: new Set((activeMonth.data ?? []).map(r => r.user_id)).size },
      { bucket: "Read today",         count: new Set((activeToday.data ?? []).map(r => r.user_id)).size },
      { bucket: "Completed a plan",   count: new Set((completed.data ?? []).map(r => r.user_id)).size },
    ];
  },

  async getCompletionHistogram(): Promise<{ bucket: string; count: number }[]> {
    const [{ data: users }, { data: reads }] = await Promise.all([
      supabase.from("profiles").select("id"),
      supabase.from("chapter_reads").select("user_id, book_index, chapter"),
    ]);

    const totalChapters = 1189;
    const chaptersPerUser: Record<string, Set<string>> = {};
    for (const r of reads ?? []) {
      if (!chaptersPerUser[r.user_id]) chaptersPerUser[r.user_id] = new Set();
      chaptersPerUser[r.user_id].add(`${r.book_index}-${r.chapter}`);
    }

    const buckets = [
      { bucket: "0–10%",   min: 0,    max: 0.1,  count: 0 },
      { bucket: "10–25%",  min: 0.1,  max: 0.25, count: 0 },
      { bucket: "25–50%",  min: 0.25, max: 0.5,  count: 0 },
      { bucket: "50–75%",  min: 0.5,  max: 0.75, count: 0 },
      { bucket: "75–99%",  min: 0.75, max: 1.0,  count: 0 },
      { bucket: "100%",    min: 1.0,  max: 1.01, count: 0 },
    ];

    for (const user of users ?? []) {
      const pct = (chaptersPerUser[user.id]?.size ?? 0) / totalChapters;
      for (const b of buckets) {
        if (pct >= b.min && pct < b.max) { b.count++; break; }
      }
    }

    return buckets.map(({ bucket, count }) => ({ bucket, count }));
  },

  async getBookHeatmap(): Promise<{ bookIndex: number; pct: number }[]> {
    const [{ count: totalUsers }, { data: reads }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("chapter_reads").select("user_id, book_index"),
    ]);

    const usersPerBook: Record<number, Set<string>> = {};
    for (const r of reads ?? []) {
      if (!usersPerBook[r.book_index]) usersPerBook[r.book_index] = new Set();
      usersPerBook[r.book_index].add(r.user_id);
    }

    const total = totalUsers ?? 1;
    return Array.from({ length: 66 }, (_, i) => ({
      bookIndex: i,
      pct: Math.round(((usersPerBook[i]?.size ?? 0) / total) * 100),
    }));
  },
};
