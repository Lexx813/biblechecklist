import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postsApi } from "../api/posts";

export function useUserPosts(userId: string | undefined, publicOnly = false) {
  return useQuery({
    queryKey: ["userPosts", userId, publicOnly],
    queryFn: () => postsApi.list(userId!, 30, publicOnly),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}

export function useCreatePost(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, visibility = "public", imageUrl }: { content: string; visibility?: "public" | "friends"; imageUrl?: string }) =>
      postsApi.create(userId!, content, visibility, imageUrl),
    onSuccess: (newPost) => {
      queryClient.setQueryData(["userPosts", userId], (prev: unknown[] = []) => [newPost, ...prev]);
      queryClient.invalidateQueries({ queryKey: ["activityFeed"] });
      queryClient.invalidateQueries({ queryKey: ["publicFeed"] });
      queryClient.invalidateQueries({ queryKey: ["friendPosts"] });
    },
  });
}

export function usePublicFeed() {
  return useQuery({
    queryKey: ["publicFeed"],
    queryFn: () => postsApi.listPublicFeed(20),
    staleTime: 2 * 60_000,
  });
}

export function useFriendPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ["friendPosts", userId],
    queryFn: () => postsApi.listFriendPosts(userId!),
    enabled: !!userId,
    staleTime: 2 * 60_000,
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
      queryClient.invalidateQueries({ queryKey: ["publicFeed"] });
      queryClient.invalidateQueries({ queryKey: ["friendPosts"] });
    },
  });
}
