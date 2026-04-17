import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi } from "../api/blog";
import { notificationsApi } from "../api/notifications";

export function usePublishedPosts(lang: string | null = null) {
  return useQuery({
    queryKey: ["blog", "published", lang],
    queryFn: () => blogApi.listPublished(lang),
    enabled: lang !== null,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePostBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["blog", "post", slug],
    queryFn: () => blogApi.getBySlug(slug!),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMyPosts(userId: string | undefined) {
  return useQuery({
    queryKey: ["blog", "mine", userId],
    queryFn: () => blogApi.listMine(userId!),
    enabled: !!userId,
  });
}

export function useCreatePost(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: Record<string, unknown>) => blogApi.create(userId!, post as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog", "mine", userId] });
      queryClient.invalidateQueries({ queryKey: ["blog", "published"] });
    },
  });
}

export function useUpdatePost(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, updates }: { postId: string; updates: Record<string, unknown> }) =>
      blogApi.update(postId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog", "mine", userId] });
      queryClient.invalidateQueries({ queryKey: ["blog", "published"] });
    },
  });
}

export function useDeletePost(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => blogApi.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog", "mine", userId] });
      queryClient.invalidateQueries({ queryKey: ["blog", "published"] });
    },
  });
}

export function useComments(postId: string | undefined) {
  return useQuery({
    queryKey: ["blog", "comments", postId],
    queryFn: () => blogApi.listComments(postId!),
    enabled: !!postId,
    staleTime: 60 * 1000,
  });
}

export function useCreateComment(
  postId: string | undefined,
  postAuthorId: string | undefined,
  postSlug: string | undefined
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, content }: { userId: string; content: string }) =>
      blogApi.createComment(userId, postId!, content),
    onSuccess: (newComment, { userId, content }) => {
      queryClient.setQueryData(["blog", "comments", postId], (prev: unknown[] = []) => [...prev, newComment]);
      if (postAuthorId && postAuthorId !== userId) {
        notificationsApi.create(postAuthorId, userId, "comment", {
          postId,
          preview: content?.slice(0, 80),
          linkHash: postSlug ? `blog/${postSlug}` : `blog`,
        }).catch(() => {});
      }
    },
  });
}

export function useDeleteComment(postId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => blogApi.deleteComment(commentId),
    onSuccess: (_, commentId) => {
      queryClient.setQueryData(["blog", "comments", postId], (prev: Array<{ id: string }> = []) =>
        prev.filter(c => c.id !== commentId)
      );
    },
  });
}

export function useUserBlogLikes(userId: string | undefined) {
  return useQuery({
    queryKey: ["blog", "likes", userId],
    queryFn: () => blogApi.getUserLikes(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleBlogLike(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => blogApi.toggleLike(postId),
    onSuccess: (result: { liked: boolean; like_count: number }, postId) => {
      // Update liked set
      queryClient.setQueryData(["blog", "likes", userId], (prev: string[] = []) =>
        result.liked ? [...prev, postId] : prev.filter(id => id !== postId)
      );
      // Update like_count on published posts list
      queryClient.setQueryData(["blog", "published"], (prev: Array<{ id: string; like_count: number }> = []) =>
        prev.map(p => p.id === postId ? { ...p, like_count: result.like_count } : p)
      );
      // Update single post cache if loaded
      queryClient.setQueriesData(
        { queryKey: ["blog", "post"] },
        (prev: { id: string; like_count: number } | undefined) =>
          prev?.id === postId ? { ...prev, like_count: result.like_count } : prev
      );
    },
  });
}
