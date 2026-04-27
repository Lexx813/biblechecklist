import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, analyticsApi } from "../api/admin";
import { profileApi } from "../api/profile";
import { blogApi } from "../api/blog";
import { forumApi } from "../api/forum";
import { quizApi } from "../api/quiz";
import { supabase } from "../lib/supabase";

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
      const uniqueUsers   = new Set(rows.map(r => r.user_id)).size;

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

      // Top users by cost — surfaces who's burning tokens fastest
      const userTotals = new Map<string, { messages: number; tokens: number; cost: number }>();
      for (const r of rows) {
        const cur = userTotals.get(r.user_id) ?? { messages: 0, tokens: 0, cost: 0 };
        cur.messages += 1;
        cur.tokens   += r.input_tokens + r.output_tokens;
        cur.cost     += Number(r.cost_usd);
        userTotals.set(r.user_id, cur);
      }
      const topUserIds = [...userTotals.entries()]
        .sort(([, a], [, b]) => b.cost - a.cost)
        .slice(0, 10)
        .map(([id]) => id);

      // Batch-fetch profiles for the top 10
      type ProfileRow = { id: string; display_name: string | null; email: string | null };
      let profiles: ProfileRow[] = [];
      if (topUserIds.length) {
        const { data: profData } = await supabase
          .from("profiles")
          .select("id, display_name, email")
          .in("id", topUserIds);
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
      const since = new Date(Date.now() - days * 86_400_000).toISOString();

      const [songsResult, eventsResult] = await Promise.all([
        supabase
          .from("songs")
          .select("id, slug, title, theme, primary_scripture_ref, play_count, download_count, published, created_at")
          .order("created_at", { ascending: true }),
        supabase
          .from("song_plays")
          .select("song_id, event_type, source, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: true }),
      ]);

      if (songsResult.error) throw songsResult.error;
      if (eventsResult.error) throw eventsResult.error;

      const songs = songsResult.data ?? [];
      const events = eventsResult.data ?? [];

      // Per-song aggregates over the window
      type SongAgg = {
        song_id: string;
        plays: number;
        completes: number;
        downloads: number;
        shares: number;
        jw_org_clicks: number;
      };
      const perSong = new Map<string, SongAgg>();
      for (const s of songs) {
        perSong.set(s.id, { song_id: s.id, plays: 0, completes: 0, downloads: 0, shares: 0, jw_org_clicks: 0 });
      }
      for (const e of events) {
        const a = perSong.get(e.song_id);
        if (!a) continue;
        if (e.event_type === "play") a.plays += 1;
        else if (e.event_type === "complete") a.completes += 1;
        else if (e.event_type === "download") a.downloads += 1;
        else if (e.event_type === "share") a.shares += 1;
        else if (e.event_type === "jw_org_click") a.jw_org_clicks += 1;
      }

      const perSongRows = songs.map((s) => {
        const a = perSong.get(s.id)!;
        const completion_pct = a.plays > 0 ? Math.round((a.completes / a.plays) * 100) : null;
        return {
          id: s.id,
          slug: s.slug,
          title: s.title,
          theme: s.theme,
          scripture_ref: s.primary_scripture_ref,
          published: s.published,
          all_time_plays: s.play_count,
          all_time_downloads: s.download_count,
          window_plays: a.plays,
          window_completes: a.completes,
          window_downloads: a.downloads,
          window_shares: a.shares,
          window_jw_org_clicks: a.jw_org_clicks,
          completion_pct,
        };
      });

      // KPI totals over the window
      const totalPlays = events.filter((e) => e.event_type === "play").length;
      const totalCompletes = events.filter((e) => e.event_type === "complete").length;
      const totalDownloads = events.filter((e) => e.event_type === "download").length;
      const totalJwClicks = events.filter((e) => e.event_type === "jw_org_click").length;
      const totalShares = events.filter((e) => e.event_type === "share").length;

      // Daily series for plays + downloads
      const byDay: Record<string, { plays: number; downloads: number }> = {};
      for (const e of events) {
        const day = e.created_at.slice(0, 10);
        if (!byDay[day]) byDay[day] = { plays: 0, downloads: 0 };
        if (e.event_type === "play") byDay[day].plays += 1;
        if (e.event_type === "download") byDay[day].downloads += 1;
      }
      const dailySeries = Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, plays: v.plays, downloads: v.downloads }));

      // Source breakdown (where listeners came from)
      const bySource: Record<string, number> = {};
      for (const e of events) {
        if (e.event_type !== "play") continue;
        const k = e.source ?? "direct";
        bySource[k] = (bySource[k] ?? 0) + 1;
      }
      const sourceBreakdown = Object.entries(bySource)
        .sort(([, a], [, b]) => b - a)
        .map(([source, count]) => ({ source, count }));

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
