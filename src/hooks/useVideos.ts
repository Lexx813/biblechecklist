import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { videosApi, VideoInput } from "../api/videos";

export function usePublishedVideos() {
  return useQuery({
    queryKey: ["videos", "published"],
    queryFn: videosApi.listPublished,
    staleTime: 2 * 60 * 1000,
  });
}

export function useVideoBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["videos", "detail", slug],
    queryFn: () => videosApi.getBySlug(slug!),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateVideo(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VideoInput) => videosApi.create(userId!, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos", "published"] }),
  });
}

export function useVideoComments(videoId: string | undefined) {
  return useQuery({
    queryKey: ["videos", "comments", videoId],
    queryFn: () => videosApi.listComments(videoId!),
    enabled: !!videoId,
    staleTime: 60 * 1000,
  });
}

export function useCreateVideoComment(videoId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, content }: { userId: string; content: string }) =>
      videosApi.createComment(userId, videoId!, content),
    onSuccess: (newComment) => {
      qc.setQueryData(["videos", "comments", videoId], (prev: unknown[] = []) => [
        ...prev,
        newComment,
      ]);
    },
  });
}

export function useDeleteVideoComment(videoId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => videosApi.deleteComment(commentId),
    onSuccess: (_, commentId) => {
      qc.setQueryData(
        ["videos", "comments", videoId],
        (prev: Array<{ id: string }> = []) => prev.filter((c) => c.id !== commentId)
      );
    },
  });
}

export function useUserLikedVideoIds(userId: string | undefined) {
  return useQuery({
    queryKey: ["videos", "likes", userId],
    queryFn: () => videosApi.getUserLikedVideoIds(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleVideoLike(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => videosApi.toggleLike(videoId),
    onSuccess: (result: { liked: boolean; likes_count: number }, videoId) => {
      qc.setQueryData(["videos", "likes", userId], (prev: string[] = []) =>
        result.liked ? [...prev, videoId] : prev.filter((id) => id !== videoId)
      );
      qc.setQueryData(
        ["videos", "published"],
        (prev: Array<{ id: string; likes_count: number }> = []) =>
          prev.map((v) => (v.id === videoId ? { ...v, likes_count: result.likes_count } : v))
      );
      qc.setQueriesData(
        { queryKey: ["videos", "detail"] },
        (prev: { id: string; likes_count: number } | undefined) =>
          prev?.id === videoId ? { ...prev, likes_count: result.likes_count } : prev
      );
    },
  });
}

export function useMyCreatorRequest(userId: string | undefined) {
  return useQuery({
    queryKey: ["creator-request", userId],
    queryFn: () => videosApi.getMyCreatorRequest(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitCreatorRequest(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: { display_name: string; topic_description: string; sample_url?: string }) =>
      videosApi.submitCreatorRequest(userId!, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creator-request", userId] }),
  });
}

export function useAdminCreatorRequests() {
  return useQuery({
    queryKey: ["admin", "creator-requests"],
    queryFn: videosApi.adminListCreatorRequests,
    staleTime: 30 * 1000,
  });
}

export function useAdminSetCreatorApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, approved }: { userId: string; approved: boolean }) =>
      videosApi.adminSetCreatorApproval(userId, approved),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "creator-requests"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useAdminSetVideoPublished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ videoId, published }: { videoId: string; published: boolean }) =>
      videosApi.adminSetPublished(videoId, published),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos", "published"] }),
  });
}
