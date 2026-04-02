// src/hooks/useGroupChallenge.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupChallengeApi } from "../api/groupChallenge";

export function useActiveChallenge(groupId) {
  return useQuery({
    queryKey: ["groupChallenge", groupId],
    queryFn: () => groupChallengeApi.getActiveChallenge(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useChallengeProgress(challengeId, planKey) {
  return useQuery({
    queryKey: ["challengeProgress", challengeId],
    queryFn: () => groupChallengeApi.getChallengeProgress(challengeId, planKey),
    enabled: !!challengeId && !!planKey,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStartChallenge(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planKey, userId }) =>
      groupChallengeApi.startChallenge(groupId, planKey, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupChallenge", groupId] });
      queryClient.invalidateQueries({ queryKey: ["userGroupChallenges"] });
    },
  });
}

export function useEndChallenge(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (challengeId) => groupChallengeApi.endChallenge(challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupChallenge", groupId] });
      queryClient.invalidateQueries({ queryKey: ["userGroupChallenges"] });
    },
  });
}

export function useUserGroupChallenges(userId) {
  return useQuery({
    queryKey: ["userGroupChallenges", userId],
    queryFn: () => groupChallengeApi.getUserGroupChallenges(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
