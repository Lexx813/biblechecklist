import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/admin";
import { profileApi } from "../api/profile";
import { blogApi } from "../api/blog";
import { forumApi } from "../api/forum";

export function useProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => adminApi.getProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.listUsers,
    staleTime: 60 * 1000,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useSetAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, value }: { userId: string; value: boolean }) => adminApi.setAdmin(userId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useFullProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["fullProfile", userId],
    queryFn: () => profileApi.get(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Record<string, unknown>) => profileApi.update(userId!, updates),
    onSuccess: (data) => queryClient.setQueryData(["fullProfile", userId], data),
  });
}

export function useUploadAvatar(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(userId!, file),
    onSuccess: (avatarUrl: string) => {
      queryClient.setQueryData(["fullProfile", userId], (prev: Record<string, unknown> | undefined) =>
        prev ? { ...prev, avatar_url: avatarUrl } : prev
      );
    },
  });
}

export function useSetModerator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, value }: { userId: string; value: boolean }) => adminApi.setModerator(userId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, value }: { userId: string; value: boolean }) => adminApi.banUser(userId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useSetBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, value }: { userId: string; value: boolean }) => adminApi.setBlog(userId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => adminApi.createUser(email, password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.cancelSubscription(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useGiftPremium() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, value }: { userId: string; value: boolean }) => adminApi.giftPremium(userId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useAllComments() {
  return useQuery({
    queryKey: ["admin", "comments"],
    queryFn: adminApi.listAllComments,
    staleTime: 60 * 1000,
  });
}

export function useAdminDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => blogApi.deleteComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "comments"] }),
  });
}

export function useAdminQuizStats() {
  return useQuery({
    queryKey: ["admin", "quizStats"],
    queryFn: adminApi.getQuizStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllBlogPosts() {
  return useQuery({
    queryKey: ["admin", "blog"],
    queryFn: adminApi.listAllBlogPosts,
    staleTime: 60 * 1000,
  });
}

export function useAdminDeleteBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => blogApi.delete(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blog"] });
      queryClient.invalidateQueries({ queryKey: ["blog", "published"] });
    },
  });
}

export function useAllForumThreads() {
  return useQuery({
    queryKey: ["admin", "forum"],
    queryFn: adminApi.listAllForumThreads,
    staleTime: 60 * 1000,
  });
}

export function useAdminDeleteForumThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => forumApi.deleteThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "forum"] });
      queryClient.invalidateQueries({ queryKey: ["forum"] });
    },
  });
}

export function useAdminPinThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, value }: { threadId: string; value: boolean }) => forumApi.pinThread(threadId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "forum"] }),
  });
}

export function useAdminLockThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, value }: { threadId: string; value: boolean }) => forumApi.lockThread(threadId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "forum"] }),
  });
}

export function useAdminAuditLog({ limit = 100, offset = 0 }: { limit?: number; offset?: number } = {}) {
  return useQuery({
    queryKey: ["admin", "auditLog", limit, offset],
    queryFn: () => adminApi.listAuditLog({ limit, offset }),
    staleTime: 30 * 1000,
  });
}
