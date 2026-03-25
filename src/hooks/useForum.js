import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { forumApi } from "../api/forum";
import { notificationsApi } from "../api/notifications";

export function useTopThreads(limit = 4) {
  return useQuery({
    queryKey: ["forum", "top", limit],
    queryFn: () => forumApi.listTopThreads(limit),
    staleTime: 3 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["forum", "categories"],
    queryFn: forumApi.listCategories,
    staleTime: 60 * 1000,
  });
}

export function useThreads(categoryId) {
  return useQuery({
    queryKey: ["forum", "threads", categoryId],
    queryFn: () => forumApi.listThreads(categoryId),
    enabled: !!categoryId,
    staleTime: 30 * 1000,
  });
}

export function useThread(threadId) {
  return useQuery({
    queryKey: ["forum", "thread", threadId],
    queryFn: () => forumApi.getThread(threadId),
    enabled: !!threadId,
    staleTime: 30 * 1000,
  });
}

export function useReplies(threadId) {
  const queryClient = useQueryClient();

  // Real-time: push new replies live
  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`replies:${threadId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "forum_replies",
        filter: `thread_id=eq.${threadId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["forum", "replies", threadId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [threadId, queryClient]);

  return useQuery({
    queryKey: ["forum", "replies", threadId],
    queryFn: () => forumApi.listReplies(threadId),
    enabled: !!threadId,
    staleTime: 15 * 1000, // real-time channel keeps this fresh anyway
  });
}

export function useCreateThread(categoryId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, title, content }) => forumApi.createThread(userId, categoryId, title, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", "threads", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["forum", "categories"] });
    },
  });
}

export function useCreateReply(threadId, threadAuthorId, categoryId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, content }) => forumApi.createReply(userId, threadId, content),
    onSuccess: (_data, { userId, content, mentionedUserIds = [] }) => {
      queryClient.invalidateQueries({ queryKey: ["forum", "replies", threadId] });
      const linkHash = categoryId ? `forum/${categoryId}/${threadId}` : `forum/${threadId}`;
      const preview = content?.replace(/<[^>]*>/g, "").slice(0, 80);

      // Notify thread author of the reply (skip if they are the replier)
      if (threadAuthorId && threadAuthorId !== userId) {
        notificationsApi.create(threadAuthorId, userId, "reply", {
          threadId,
          preview,
          linkHash,
        }).catch(() => {});
      }

      // Notify each mentioned user (skip replier and thread author who already got a reply notif)
      const notified = new Set([userId, threadAuthorId]);
      for (const mentionedId of mentionedUserIds) {
        if (notified.has(mentionedId)) continue;
        notified.add(mentionedId);
        notificationsApi.create(mentionedId, userId, "mention", {
          threadId,
          preview,
          linkHash,
        }).catch(() => {});
      }
    },
  });
}

export function useUpdateThread(threadId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, content }) => forumApi.updateThread(threadId, { title, content }),
    onSuccess: (data) => queryClient.setQueryData(["forum", "thread", threadId], data),
  });
}

export function useDeleteThread(categoryId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: forumApi.deleteThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", "threads", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["forum", "categories"] });
    },
  });
}

export function useUpdateReply(threadId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ replyId, content }) => forumApi.updateReply(replyId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", "replies", threadId] });
    },
  });
}

export function useDeleteReply(threadId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: forumApi.deleteReply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", "replies", threadId] });
    },
  });
}

export function usePinThread(categoryId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, value }) => forumApi.pinThread(threadId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forum", "threads", categoryId] }),
  });
}

export function useLockThread(categoryId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, value }) => forumApi.lockThread(threadId, value),
    onSuccess: (_, { threadId }) => {
      queryClient.invalidateQueries({ queryKey: ["forum", "threads", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["forum", "thread", threadId] });
    },
  });
}

export function useUserForumLikes(userId) {
  return useQuery({
    queryKey: ["forum", "likes", userId],
    queryFn: () => forumApi.getUserLikes(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleThreadLike(userId, categoryId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId) => forumApi.toggleThreadLike(threadId),
    onSuccess: (result, threadId) => {
      queryClient.setQueryData(["forum", "likes", userId], (prev = { threads: [], replies: [] }) => ({
        ...prev,
        threads: result.liked
          ? [...(prev.threads ?? []), threadId]
          : (prev.threads ?? []).filter(id => id !== threadId),
      }));
      // Update count in threads list
      queryClient.setQueryData(["forum", "threads", categoryId], (prev = []) =>
        prev.map(t => t.id === threadId ? { ...t, like_count: result.like_count } : t)
      );
      queryClient.setQueryData(["forum", "thread", threadId], (prev) =>
        prev ? { ...prev, like_count: result.like_count } : prev
      );
    },
  });
}

export function useToggleReplyLike(userId, threadId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (replyId) => forumApi.toggleReplyLike(replyId),
    onSuccess: (result, replyId) => {
      queryClient.setQueryData(["forum", "likes", userId], (prev = { threads: [], replies: [] }) => ({
        ...prev,
        replies: result.liked
          ? [...(prev.replies ?? []), replyId]
          : (prev.replies ?? []).filter(id => id !== replyId),
      }));
      queryClient.setQueryData(["forum", "replies", threadId], (prev = []) =>
        prev.map(r => r.id === replyId ? { ...r, like_count: result.like_count } : r)
      );
    },
  });
}
