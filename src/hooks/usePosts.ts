// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postsApi } from "../api/posts";

export function useUserPosts(userId) {
  return useQuery({
    queryKey: ["userPosts", userId],
    queryFn: () => postsApi.list(userId),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

export function useCreatePost(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content) => postsApi.create(userId, content),
    onSuccess: (newPost) => {
      queryClient.setQueryData(["userPosts", userId], (prev = []) => [newPost, ...prev]);
      queryClient.invalidateQueries({ queryKey: ["activityFeed"] });
    },
  });
}

export function useDeletePost(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId) => postsApi.delete(postId),
    onSuccess: (_, postId) => {
      queryClient.setQueryData(["userPosts", userId], (prev = []) =>
        prev.filter(p => p.id !== postId)
      );
    },
  });
}
