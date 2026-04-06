import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { progressApi } from "../api/progress";
import { badgesApi } from "../api/badges";
import { loadAnonProgress, clearAnonProgress, countAnonChapters } from "../lib/anonProgress";

type ProgressBlob = Record<string, unknown>;

/**
 * Merge anonymous (logged-out) localStorage progress into a freshly loaded
 * authenticated progress blob. Anon chapters never overwrite remote ones —
 * only newly checked chapters from the anon session are added.
 */
async function mergeAnonProgress(userId: string, remote: ProgressBlob): Promise<ProgressBlob> {
  const anon = loadAnonProgress();
  if (countAnonChapters(anon) === 0) return remote;

  const merged: ProgressBlob = { ...remote };
  for (const [bi, chs] of Object.entries(anon)) {
    if (!chs) continue;
    const existing = (merged[bi] as Record<string, boolean> | undefined) ?? {};
    const combined: Record<string, boolean> = { ...existing };
    for (const [ch, val] of Object.entries(chs)) {
      if (val) combined[ch] = true;
    }
    merged[bi] = combined;
  }

  try {
    await progressApi.save(userId, merged);
    // Best-effort: also create chapter_reads rows so heatmap reflects history
    for (const [biStr, chs] of Object.entries(anon)) {
      if (!chs) continue;
      const bi = Number(biStr);
      for (const [chStr, val] of Object.entries(chs)) {
        if (val) progressApi.markChapterRead(userId, bi, Number(chStr)).catch(() => {});
      }
    }
    clearAnonProgress();
  } catch {
    // Migration failed — keep anon data so we can retry next time
  }
  return merged;
}

export function useProgress(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["progress", userId],
    queryFn: async () => {
      const remote = await progressApi.load(userId!);
      return mergeAnonProgress(userId!, remote);
    },
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
