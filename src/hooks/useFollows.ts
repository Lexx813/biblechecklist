// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { followsApi } from "../api/follows";

export function useFollowCounts(userId) {
  return useQuery({
    queryKey: ["followCounts", userId],
    queryFn: () => followsApi.getFollowCounts(userId),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

export function useIsFollowing(followerId, targetId) {
  return useQuery({
    queryKey: ["isFollowing", followerId, targetId],
    queryFn: () => followsApi.isFollowing(followerId, targetId),
    enabled: !!followerId && !!targetId && followerId !== targetId,
    staleTime: 5 * 60_000,
  });
}

export function useToggleFollow(currentUserId, targetId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => followsApi.toggleFollow(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isFollowing", currentUserId, targetId] });
      queryClient.invalidateQueries({ queryKey: ["followCounts", targetId] });
      queryClient.invalidateQueries({ queryKey: ["activityFeed", currentUserId] });
    },
  });
}

export function useFollowers(userId) {
  return useQuery({
    queryKey: ["followers", userId],
    queryFn: () => followsApi.getFollowers(userId),
    enabled: !!userId,
    staleTime: 2 * 60_000,
  });
}

export function useFollowing(userId) {
  return useQuery({
    queryKey: ["following", userId],
    queryFn: () => followsApi.getFollowing(userId),
    enabled: !!userId,
    staleTime: 2 * 60_000,
  });
}

export function useActivityFeed(userId) {
  return useQuery({
    queryKey: ["activityFeed", userId],
    queryFn: () => followsApi.getActivityFeed(userId),
    enabled: !!userId,
    staleTime: 2 * 60_000,
  });
}
