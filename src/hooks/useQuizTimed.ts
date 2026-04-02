// @ts-nocheck
// src/hooks/useQuizTimed.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quizTimedApi } from "../api/quizTimed";

export function useTimedLeaderboard(level) {
  return useQuery({
    queryKey: ["timedLeaderboard", level],
    queryFn: () => quizTimedApi.getTimedLeaderboard(level),
    enabled: !!level,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUserBestTimedScore(userId, level) {
  return useQuery({
    queryKey: ["timedBest", userId, level],
    queryFn: () => quizTimedApi.getUserBestScore(userId, level),
    enabled: !!userId && !!level,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveTimedScore(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ level, score }) => quizTimedApi.saveTimedScore(userId, level, score),
    onSuccess: (_, { level }) => {
      queryClient.invalidateQueries({ queryKey: ["timedLeaderboard", level] });
      queryClient.invalidateQueries({ queryKey: ["timedBest", userId, level] });
    },
  });
}
