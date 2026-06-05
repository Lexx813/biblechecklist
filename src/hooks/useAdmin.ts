import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, analyticsApi } from "../api/admin";
import { profileApi } from "../api/profile";
import { blogApi } from "../api/blog";
import { forumApi } from "../api/forum";
import { quizApi } from "../api/quiz";
import { supabase } from "../lib/supabase";
import { aggregateUserTotals, topUserIdsByCost } from "../utils/aiUsageAggregation";

export function useProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => adminApi.getProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.listUsers,
    staleTime: 60 * 1000,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useSetAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, value }: { userId: string; value: boolean }) => adminApi.setAdmin(userId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useFullProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["fullProfile", userId],
    queryFn: () => profileApi.get(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Record<string, unknown>) => profileApi.update(userId!, updates),
    onSuccess: (data) => queryClient.setQueryData(["fullProfile", userId], data),
  });
}

export function useUploadAvatar(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(userId!, file),
    onSuccess: (avatarUrl: string) => {
      queryClient.setQueryData(["fullProfile", userId], (prev: Record<string, unknown> | undefined) =>
        prev ? { ...prev, avatar_url: avatarUrl } : prev
      );
    },
  });
}

export function useUploadCover(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => profileApi.uploadCover(userId!, file),
    onSuccess: (coverUrl: string) => {
      queryClient.setQueryData(["fullProfile", userId], (prev: Record<string, unknown> | undefined) =>
        prev ? { ...prev, cover_url: coverUrl } : prev
      );
    },
  });
}

export function useSetModerator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, value }: { userId: string; value: boolean }) => adminApi.setModerator(userId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, value }: { userId: string; value: boolean }) => adminApi.banUser(userId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useSetBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, value }: { userId: string; value: boolean }) => adminApi.setBlog(userId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => adminApi.createUser(email, password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}


export function useAllComments() {
  return useQuery({
    queryKey: ["admin", "comments"],
    queryFn: adminApi.listAllComments,
    staleTime: 60 * 1000,
  });
}

export function useAdminDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => blogApi.deleteComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "comments"] }),
  });
}

export function useAdminQuizStats() {
  return useQuery({
    queryKey: ["admin", "quizStats"],
    queryFn: adminApi.getQuizStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeatureLeaders(feature: string | null, limit = 50) {
  return useQuery({
    queryKey: ["admin", "featureLeaders", feature, limit],
    queryFn: () => analyticsApi.getFeatureLeaders(feature!, limit),
    enabled: !!feature,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllBlogPosts() {
  return useQuery({
    queryKey: ["admin", "blog"],
    queryFn: adminApi.listAllBlogPosts,
    staleTime: 60 * 1000,
  });
}

export function useAdminDeleteBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => blogApi.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog", "published"] });
    },
  });
}

export function useAllForumThreads() {
  return useQuery({
    queryKey: ["admin", "forum"],
    queryFn: adminApi.listAllForumThreads,
    staleTime: 60 * 1000,
  });
}

export function useAdminDeleteForumThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => forumApi.deleteThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "forum"] });
      queryClient.invalidateQueries({ queryKey: ["forum"] });
    },
  });
}

export function useAdminPinThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, value }: { threadId: string; value: boolean }) => forumApi.pinThread(threadId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "forum"] }),
  });
}

export function useAdminLockThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, value }: { threadId: string; value: boolean }) => forumApi.lockThread(threadId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "forum"] }),
  });
}

export function useAdminAuditLog({ limit = 100, offset = 0 }: { limit?: number; offset?: number } = {}) {
  return useQuery({
    queryKey: ["admin", "auditLog", limit, offset],
    queryFn: () => adminApi.listAuditLog({ limit, offset }),
    staleTime: 30 * 1000,
  });
}

export function useAllQuizQuestions() {
  return useQuery({
    queryKey: ["admin", "quizQuestions"],
    queryFn: () => quizApi.getAllQuestions(),
    staleTime: 60 * 1000,
  });
}

export function useCreateQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ level, question, options, correctIndex }: { level: number; question: string; options: string[]; correctIndex: number }) =>
      quizApi.createQuestion(level, question, options, correctIndex),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "quizQuestions"] }),
  });
}

export function useUpdateQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, level, question, options, correctIndex }: { id: string; level: number; question: string; options: string[]; correctIndex: number }) =>
      quizApi.updateQuestion(id, level, question, options, correctIndex),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "quizQuestions"] }),
  });
}

export function useDeleteQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizApi.deleteQuestion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "quizQuestions"] }),
  });
}

export function useAIUsage(days = 30) {
  return useQuery({
    queryKey: ["admin", "ai-usage", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86_400_000).toISOString();

      const { data, error } = await supabase
        .from("ai_usage_logs")
        .select("created_at, input_tokens, output_tokens, tool_used, page, cost_usd, user_id")
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      if (error) throw error;
      const rows = data ?? [];

      // KPIs
      const totalMessages = rows.length;
      const totalCost     = rows.reduce((s, r) => s + Number(r.cost_usd), 0);
      const totalTokens   = rows.reduce((s, r) => s + r.input_tokens + r.output_tokens, 0);
      const uniqueUsers   = new Set(rows.map(r => r.user_id).filter((id): id is string => !!id)).size;

      // Messages per day
      const byDay: Record<string, number> = {};
      const costByDay: Record<string, number> = {};
      for (const r of rows) {
        const day = r.created_at.slice(0, 10);
        byDay[day]    = (byDay[day]    ?? 0) + 1;
        costByDay[day] = (costByDay[day] ?? 0) + Number(r.cost_usd);
      }
      const dailySeries = Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count, cost: Number(costByDay[date].toFixed(4)) }));

      // Tool usage breakdown
      const toolCounts: Record<string, number> = { none: 0 };
      for (const r of rows) {
        const key = r.tool_used ?? "none";
        toolCounts[key] = (toolCounts[key] ?? 0) + 1;
      }
      const toolBreakdown = Object.entries(toolCounts).map(([tool, count]) => ({ tool, count }));

      // Top pages
      const pageCounts: Record<string, number> = {};
      for (const r of rows) {
        const key = r.page ?? "unknown";
        pageCounts[key] = (pageCounts[key] ?? 0) + 1;
      }
      const topPages = Object.entries(pageCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([page, count]) => ({ page, count }));

      // Top users by cost — surfaces who's burning tokens fastest.
      // Skips rows whose user_id was nulled by the ON DELETE SET NULL FK — passing
      // null into `.in("id", …)` on profiles makes PostgREST fail uuid parsing.
      const userTotals = aggregateUserTotals(rows);
      const topUserIds = topUserIdsByCost(userTotals);

      // Batch-fetch profiles for the top 10. Email column SELECT is revoked
      // from authenticated; admin RPC bypasses safely with is_admin() check.
      type ProfileRow = { id: string; display_name: string | null; email: string | null };
      let profiles: ProfileRow[] = [];
      if (topUserIds.length) {
        const { data: profData } = await supabase.rpc("admin_get_user_emails", { p_user_ids: topUserIds });
        profiles = (profData as ProfileRow[]) ?? [];
      }
      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      const topUsers = topUserIds.map((id) => {
        const t = userTotals.get(id)!;
        const p = profileMap.get(id);
        // Fall back to email local-part, then a short id, so admins can always identify a user
        const fallbackName = p?.email?.split("@")[0] || `user…${id.slice(0, 8)}`;
        return {
          user_id: id,
          name: p?.display_name || fallbackName,
          email: p?.email ?? null,
          messages: t.messages,
          tokens: t.tokens,
          cost: Number(t.cost.toFixed(4)),
        };
      });

      return { totalMessages, totalCost, totalTokens, uniqueUsers, dailySeries, toolBreakdown, topPages, topUsers };
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export type GrowthBucket = "day" | "week" | "month" | "year";

/**
 * Time-bucketed growth series for the Analytics range selector. Kept separate
 * from useAnalytics so changing the range only refetches the two growth charts,
 * not the whole dashboard.
 */
export function useGrowthSeries(metric: "signups" | "dau", bucket: GrowthBucket, points: number) {
  return useQuery({
    queryKey: ["admin", "growth", metric, bucket, points],
    queryFn: () => analyticsApi.getGrowthSeries(metric, bucket, points),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      const [kpis, signups, dau, features, retention, adoption, histogram, heatmap] = await Promise.all([
        analyticsApi.getKpis(),
        analyticsApi.getSignupsSeries(30),
        analyticsApi.getDauSeries(30),
        analyticsApi.getFeatureUsage(),
        analyticsApi.getRetentionCohorts(),
        analyticsApi.getReadingAdoption(),
        analyticsApi.getCompletionHistogram(),
        analyticsApi.getBookHeatmap(),
      ]);
      return { kpis, signups, dau, features, retention, adoption, histogram, heatmap };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSongStats(days = 30) {
  return useQuery({
    queryKey: ["admin", "song-stats", days],
    queryFn: async () => {
      // Aggregated server-side via SECURITY DEFINER RPC. Pulling raw song_plays
      // rows hits PostgREST's 1000-row cap and silently undercounts every metric
      // once the window crosses ~1000 events.
      const { data, error } = await supabase.rpc("admin_get_song_stats", { p_days: days });
      if (error) throw error;
      const payload = data as {
        totalPlays: number;
        totalCompletes: number;
        totalDownloads: number;
        totalJwClicks: number;
        totalShares: number;
        perSongRows: Array<{
          id: string;
          slug: string;
          title: string;
          title_es: string | null;
          theme: string;
          scripture_ref: string;
          primary_scripture_text: string;
          primary_scripture_text_es: string | null;
          description: string;
          description_es: string | null;
          cover_image_url: string | null;
          duration_seconds: number;
          jw_org_links: { url: string; anchor: string }[];
          published: boolean;
          song_number: number | null;
          all_time_plays: number;
          all_time_downloads: number;
          window_plays: number;
          window_completes: number;
          window_downloads: number;
          window_shares: number;
          window_jw_org_clicks: number;
          completion_pct: number | null;
        }>;
        dailySeries: Array<{ date: string; plays: number; downloads: number }>;
        sourceBreakdown: Array<{ source: string; count: number }>;
      };

      const {
        totalPlays,
        totalCompletes,
        totalDownloads,
        totalJwClicks,
        totalShares,
        perSongRows,
        dailySeries,
        sourceBreakdown: rawSourceBreakdown,
      } = payload;

      const sourceBreakdown = [...rawSourceBreakdown].sort((a, b) => b.count - a.count);

      return {
        totalPlays,
        totalCompletes,
        totalDownloads,
        totalJwClicks,
        totalShares,
        perSongRows,
        dailySeries,
        sourceBreakdown,
      };
    },
    staleTime: 60 * 1000,
  });
}
