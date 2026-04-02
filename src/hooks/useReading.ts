import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { readingApi } from "../api/reading";

export function useReadingStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["reading", "stats", userId],
    queryFn: () => readingApi.getStats(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export function useReadingHeatmap(userId: string | undefined) {
  return useQuery({
    queryKey: ["reading", "heatmap", userId],
    queryFn: () => readingApi.getHeatmap(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useReadingStreaks(userId: string | undefined) {
  return useQuery({
    queryKey: ["reading", "streaks", userId],
    queryFn: () => readingApi.getStreaks(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useReadingHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ["reading", "history", userId],
    queryFn: () => readingApi.getHistory(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSetDailyGoal(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goal: number) => readingApi.setDailyGoal(goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fullProfile", userId] });
      queryClient.invalidateQueries({ queryKey: ["reading", "streaks", userId] });
    },
  });
}
