// src/hooks/useStreakFreeze.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { streakFreezeApi } from "../api/streakFreeze";

interface FreezeStatus {
  tokens: number;
  recentFreezes: string[];
}

export function useFreezeStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ["freezeStatus", userId],
    queryFn: () => streakFreezeApi.getFreezeStatus(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useApplyFreeze(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => streakFreezeApi.applyFreeze(userId!, date),
    onMutate: async (date: string) => {
      await queryClient.cancelQueries({ queryKey: ["freezeStatus", userId] });
      const prev = queryClient.getQueryData(["freezeStatus", userId]);
      queryClient.setQueryData(["freezeStatus", userId], (old: FreezeStatus | undefined) => ({
        ...old,
        tokens: Math.max(0, (old?.tokens ?? 1) - 1),
        recentFreezes: [...(old?.recentFreezes ?? []), date],
      }));
      return { prev };
    },
    onError: (_err: unknown, _date: string, ctx: { prev: unknown } | undefined) => {
      if (ctx?.prev) queryClient.setQueryData(["freezeStatus", userId], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["freezeStatus", userId] });
      queryClient.invalidateQueries({ queryKey: ["streak", userId] });
    },
  });
}
