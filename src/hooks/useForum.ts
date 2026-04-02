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

export function useThreads(categoryId: string | undefined, limit = 20, lang: string | null = null) {
  const queryClient = useQueryClient();

  // Real-time: sync new, edited, and deleted threads live
  useEffect(() => {
    if (!categoryId) return;
    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: ["forum", "threads", categoryId] });
    const channel = supabase
      .channel(`threads:${categoryId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forum_threads", filter: `category_id=eq.${categoryId}` }, invalidate)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "forum_threads", filter: `category_id=eq.${categoryId}` }, invalidate)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "forum_threads", filter: `category_id=eq.${categoryId}` }, invalidate)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [categoryId, queryClient]);

  return useQuery({
    queryKey: ["forum", "threads", categoryId, limit, lang],
    queryFn: () => forumApi.listThreads(categoryId!, limit, lang),
    enabled: !!categoryId,
    staleTime: 30 * 1000,
  });
}

export function useThread(threadId: string | undefined) {
  return useQuery({
    queryKey: ["forum", "thread", threadId],
    queryFn: () => forumApi.getThread(threadId!),
    enabled: !!threadId,
    staleTime: 30 * 1000,
  });
}

export function useReplies(threadId: string | undefined) {
  const queryClient = useQueryClient();

  // Real-time: sync INSERT, UPDATE, DELETE live
  useEffect(() => {
    if (!threadId) return;
    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: ["forum", "replies", threadId] });
    const channel = supabase
      .channel(`replies:${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forum_replies", filter: `thread_id=eq.${threadId}` }, invalidate)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "forum_replies", filter: `thread_id=eq.${threadId}` }, invalidate)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "forum_replies", filter: `thread_id=eq.${threadId}` }, invalidate)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [threadId, queryClient]);

  return useQuery({
    queryKey: ["forum", "replies", threadId],
    queryFn: () => forumApi.listReplies(threadId!),
    enabled: !!threadId,
    staleTime: 15 * 1000,
  });
}

export function useCreateThread(categoryId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, title, content, lang = "en" }: { userId: string; title: string; content: string; lang?: string }) =>
      forumApi.createThread(userId, categoryId!, title, content, lang),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", "threads", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["forum", "categories"] });
    },
  });
}

export function useCreateReply(
  threadId: string | undefined,
  threadAuthorId: string | undefined,
  categoryId: string | undefined
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, content }: { userId: string; content: string }) =>
      forumApi.createReply(userId, threadId!, content),
    onSuccess: (_data, { userId, content, mentionedUserIds = [] }: { userId: string; content: string; mentionedUserIds?: string[] }) => {
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

export function useUpdateThread(threadId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, content }: { title: string; content: string }) =>
      forumApi.updateThread(threadId!, { title, content }),
    onSuccess: (data) => queryClient.setQueryData(["forum", "thread", threadId], data),
  });
}

export function useDeleteThread(categoryId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: forumApi.deleteThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", "threads", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["forum", "categories"] });
    },
  });
}

export function useUpdateReply(threadId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ replyId, content }: { replyId: string; content: string }) =>
      forumApi.updateReply(replyId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", "replies", threadId] });
    },
  });
}

export function useDeleteReply(threadId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: forumApi.deleteReply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", "replies", threadId] });
    },
  });
}

export function usePinThread(categoryId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, value }: { threadId: string; value: boolean }) =>
      forumApi.pinThread(threadId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forum", "threads", categoryId] }),
  });
}

export function useLockThread(categoryId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, value }: { threadId: string; value: boolean }) =>
      forumApi.lockThread(threadId, value),
    onSuccess: (_, { threadId }) => {
      queryClient.invalidateQueries({ queryKey: ["forum", "threads", categoryId] });
      queryClient.invalidateQueries({ queryKey: ["forum", "thread", threadId] });
    },
  });
}

export function useUserForumLikes(userId: string | undefined) {
  return useQuery({
    queryKey: ["forum", "likes", userId],
    queryFn: () => forumApi.getUserLikes(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleThreadLike(userId: string | undefined, categoryId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => forumApi.toggleThreadLike(threadId),
    onSuccess: (result: { liked: boolean; like_count: number }, threadId) => {
      queryClient.setQueryData(
        ["forum", "likes", userId],
        (prev: { threads: string[]; replies: string[] } = { threads: [], replies: [] }) => ({
          ...prev,
          threads: result.liked
            ? [...(prev.threads ?? []), threadId]
            : (prev.threads ?? []).filter(id => id !== threadId),
        })
      );
      // Update count in threads list
      queryClient.setQueryData(
        ["forum", "threads", categoryId],
        (prev: Array<{ id: string; like_count: number }> = []) =>
          prev.map(t => t.id === threadId ? { ...t, like_count: result.like_count } : t)
      );
      queryClient.setQueryData(
        ["forum", "thread", threadId],
        (prev: { like_count: number } | undefined) =>
          prev ? { ...prev, like_count: result.like_count } : prev
      );
    },
  });
}

export function useMarkSolution(threadId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ replyId, value }: { replyId: string; value: boolean }) =>
      forumApi.markSolution(replyId, threadId!, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forum", "replies", threadId] }),
  });
}

export function useUserWatches(userId: string | undefined) {
  return useQuery({
    queryKey: ["forum", "watches", userId],
    queryFn: () => forumApi.getUserWatches(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export function useToggleWatch(userId: string | undefined, threadId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => forumApi.toggleWatch(threadId!),
    onSuccess: (result: { watching: boolean }) => {
      queryClient.setQueryData(["forum", "watches", userId], (prev: string[] = []) =>
        result.watching
          ? [...prev, threadId!]
          : prev.filter(id => id !== threadId)
      );
    },
  });
}

export function useThreadReactions(threadId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ["forum", "reactions", threadId],
    queryFn: () => forumApi.getThreadReactions(threadId!, userId!),
    enabled: !!threadId && !!userId,
    staleTime: 30 * 1000,
  });
}

export function useToggleReaction(userId: string | undefined, threadId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contentType, contentId, emoji }: { contentType: string; contentId: string; emoji: string }) =>
      forumApi.toggleReaction(contentType, contentId, emoji),
    onSuccess: (result: { count: number; added: boolean }, { contentType, contentId, emoji }) => {
      queryClient.setQueryData(
        ["forum", "reactions", threadId],
        (prev: { counts: Record<string, number>; mine: string[] } = { counts: {}, mine: [] }) => {
          const key = `${contentType}:${contentId}:${emoji}`;
          const newCounts = { ...prev.counts, [key]: result.count };
          const newMine = result.added
            ? [...prev.mine, key]
            : prev.mine.filter(k => k !== key);
          return { counts: newCounts, mine: newMine };
        }
      );
    },
  });
}

export function useUserForumStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["forum", "stats", userId],
    queryFn: () => forumApi.getUserForumStats(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleReplyLike(userId: string | undefined, threadId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (replyId: string) => forumApi.toggleReplyLike(replyId),
    onSuccess: (result: { liked: boolean; like_count: number }, replyId) => {
      queryClient.setQueryData(
        ["forum", "likes", userId],
        (prev: { threads: string[]; replies: string[] } = { threads: [], replies: [] }) => ({
          ...prev,
          replies: result.liked
            ? [...(prev.replies ?? []), replyId]
            : (prev.replies ?? []).filter(id => id !== replyId),
        })
      );
      queryClient.setQueryData(
        ["forum", "replies", threadId],
        (prev: Array<{ id: string; like_count: number }> = []) =>
          prev.map(r => r.id === replyId ? { ...r, like_count: result.like_count } : r)
      );
    },
  });
}
