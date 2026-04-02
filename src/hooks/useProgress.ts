import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { progressApi } from "../api/progress";
import { badgesApi } from "../api/badges";

type ProgressBlob = Record<string, unknown>;

export function useProgress(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["progress", userId],
    queryFn: () => progressApi.load(userId!),
    enabled: !!userId,
    staleTime: Infinity,
  });
}

export function useSaveProgress(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (progress: ProgressBlob) => progressApi.save(userId!, progress),
    onMutate: (progress: ProgressBlob) => {
      // Optimistically update the cache so the UI never rolls back
      queryClient.setQueryData(["progress", userId], progress);
    },
    onSuccess: () => {
      // Refresh streak after saving progress
      queryClient.invalidateQueries({ queryKey: ["streak", userId] });
      if (userId) {
        // Fetch fresh streak to check milestone badges
        queryClient.fetchQuery({
          queryKey: ["streak", userId],
          queryFn: () => progressApi.getStreak(userId),
          staleTime: 0,
        }).then((streak: { current_streak?: number } | null) => {
          const currentStreak = streak?.current_streak ?? 0;
          if (currentStreak >= 30) badgesApi.awardBadge(userId, "streak_30");
          if (currentStreak >= 100) badgesApi.awardBadge(userId, "streak_100");
          if (currentStreak >= 365) badgesApi.awardBadge(userId, "streak_365");
        }).catch(() => {});
      }
    },
  });
}

export function useReadingStreak(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["streak", userId],
    queryFn: () => progressApi.getStreak(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useChapterTimestamps(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["chapterTimestamps", userId],
    queryFn: () => progressApi.loadChapterTimestamps(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
}
