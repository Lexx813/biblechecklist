import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi } from "../api/blog";
import { notificationsApi } from "../api/notifications";

export function usePublishedPosts() {
  return useQuery({
    queryKey: ["blog", "published"],
    queryFn: blogApi.listPublished,
    staleTime: 2 * 60 * 1000,
  });
}

export function usePostBySlug(slug) {
  return useQuery({
    queryKey: ["blog", "post", slug],
    queryFn: () => blogApi.getBySlug(slug),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMyPosts(userId) {
  return useQuery({
    queryKey: ["blog", "mine", userId],
    queryFn: () => blogApi.listMine(userId),
    enabled: !!userId,
  });
}

export function useCreatePost(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post) => blogApi.create(userId, post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog", "mine", userId] });
      queryClient.invalidateQueries({ queryKey: ["blog", "published"] });
    },
  });
}

export function useUpdatePost(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, updates }) => blogApi.update(postId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog", "mine", userId] });
      queryClient.invalidateQueries({ queryKey: ["blog", "published"] });
    },
  });
}

export function useDeletePost(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId) => blogApi.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog", "mine", userId] });
      queryClient.invalidateQueries({ queryKey: ["blog", "published"] });
    },
  });
}

export function useComments(postId) {
  return useQuery({
    queryKey: ["blog", "comments", postId],
    queryFn: () => blogApi.listComments(postId),
    enabled: !!postId,
    staleTime: 60 * 1000,
  });
}

export function useCreateComment(postId, postAuthorId, postSlug) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, content }) => blogApi.createComment(userId, postId, content),
    onSuccess: (newComment, { userId, content }) => {
      queryClient.setQueryData(["blog", "comments", postId], (prev = []) => [...prev, newComment]);
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

export function useDeleteComment(postId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId) => blogApi.deleteComment(commentId),
    onSuccess: (_, commentId) => {
      queryClient.setQueryData(["blog", "comments", postId], (prev = []) =>
        prev.filter(c => c.id !== commentId)
      );
    },
  });
}

export function useUserBlogLikes(userId) {
  return useQuery({
    queryKey: ["blog", "likes", userId],
    queryFn: () => blogApi.getUserLikes(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleBlogLike(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId) => blogApi.toggleLike(postId),
    onSuccess: (result, postId) => {
      // Update liked set
      queryClient.setQueryData(["blog", "likes", userId], (prev = []) =>
        result.liked ? [...prev, postId] : prev.filter(id => id !== postId)
      );
      // Update like_count on published posts list
      queryClient.setQueryData(["blog", "published"], (prev = []) =>
        prev.map(p => p.id === postId ? { ...p, like_count: result.like_count } : p)
      );
      // Update single post cache if loaded
      queryClient.setQueriesData({ queryKey: ["blog", "post"] }, (prev) =>
        prev?.id === postId ? { ...prev, like_count: result.like_count } : prev
      );
    },
  });
}
