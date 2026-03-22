import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { forumApi } from "../api/forum";

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
  });
}

export function useThread(threadId) {
  return useQuery({
    queryKey: ["forum", "thread", threadId],
    queryFn: () => forumApi.getThread(threadId),
    enabled: !!threadId,
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

export function useCreateReply(threadId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, content }) => forumApi.createReply(userId, threadId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum", "replies", threadId] });
    },
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
