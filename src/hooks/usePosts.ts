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

export function useUpdatePost(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content, visibility, imageUrl }: { postId: string; content: string; visibility: "public" | "friends"; imageUrl?: string | null }) =>
      postsApi.update(postId, content, visibility, imageUrl),
    onSuccess: (updated) => {
      queryClient.setQueryData(["userPosts", userId], (prev: any[] = []) =>
        prev.map(p => p.id === updated.id ? updated : p)
      );
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

// ── Comments ──────────────────────────────────────────────────────────────
export function usePostComments(postId: string | null) {
  return useQuery({
    queryKey: ["postComments", postId],
    queryFn: () => postsApi.listComments(postId!),
    enabled: !!postId,
    staleTime: 60_000,
  });
}

export function useAddComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => postsApi.addComment(postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postComments", postId] });
      queryClient.invalidateQueries({ queryKey: ["publicFeed"] });
      queryClient.invalidateQueries({ queryKey: ["friendPosts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => postsApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postComments", postId] });
      queryClient.invalidateQueries({ queryKey: ["publicFeed"] });
      queryClient.invalidateQueries({ queryKey: ["friendPosts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    },
  });
}

// ── Reactions ────────────────────────────────────────────────────────────
export function usePostReactions(postId: string | null) {
  return useQuery({
    queryKey: ["postReactions", postId],
    queryFn: () => postsApi.getReactions(postId!),
    enabled: !!postId,
    staleTime: 60_000,
  });
}

export function useToggleReaction(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (emoji: string) => postsApi.toggleReaction(postId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postReactions", postId] });
      queryClient.invalidateQueries({ queryKey: ["publicFeed"] });
      queryClient.invalidateQueries({ queryKey: ["friendPosts"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
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
      queryClient.invalidateQueries({ queryKey: ["publicFeed"] });
      queryClient.invalidateQueries({ queryKey: ["friendPosts"] });
    },
  });
}
