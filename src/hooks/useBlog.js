import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blogApi } from "../api/blog";

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
