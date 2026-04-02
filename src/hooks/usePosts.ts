import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postsApi } from "../api/posts";

export function useUserPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ["userPosts", userId],
    queryFn: () => postsApi.list(userId!),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

export function useCreatePost(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => postsApi.create(userId!, content),
    onSuccess: (newPost) => {
      queryClient.setQueryData(["userPosts", userId], (prev: unknown[] = []) => [newPost, ...prev]);
      queryClient.invalidateQueries({ queryKey: ["activityFeed"] });
    },
  });
}

export function useDeletePost(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => postsApi.delete(postId),
    onSuccess: (_, postId) => {
      queryClient.setQueryData(["userPosts", userId], (prev: Array<{ id: string }> = []) =>
        prev.filter(p => p.id !== postId)
      );
    },
  });
}
