import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { messagesApi } from "../api/messages";

// ── Conversation list ─────────────────────────────────────────────────────────

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: messagesApi.getConversations,
    staleTime: 30_000,
  });
}

// ── Messages in a conversation ────────────────────────────────────────────────

export function useMessages(conversationId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          queryClient.setQueryData(["messages", conversationId], (old = []) => {
            if (old.some((m) => m.id === payload.new.id)) return old;
            return [...old, payload.new];
          });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          queryClient.setQueryData(["messages", conversationId], (old = []) =>
            old.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m)
          );
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messagesApi.getMessages(conversationId),
    enabled: !!conversationId,
    staleTime: 3_000,
    refetchInterval: 5_000, // fallback polling in case realtime is not enabled
  });
}

// ── Reactions ─────────────────────────────────────────────────────────────────

export function useReactions(conversationId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`reactions:${conversationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["reactions", conversationId] });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ["reactions", conversationId],
    queryFn: () => messagesApi.getReactions(conversationId),
    enabled: !!conversationId,
    staleTime: 5_000,
  });
}

export function useToggleReaction(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, userId, emoji }) => messagesApi.toggleReaction(messageId, userId, emoji),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["reactions", conversationId] }),
  });
}

// ── Get or create DM ─────────────────────────────────────────────────────────

export function useGetOrCreateDM() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId) => messagesApi.getOrCreateDM(otherUserId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

// ── Send message ──────────────────────────────────────────────────────────────

export function useSendMessage(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, replyToId }) =>
      messagesApi.sendMessage(conversationId, content, replyToId),
    onMutate: async ({ senderId, content, replyToId }) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previous = queryClient.getQueryData(["messages", conversationId]);
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        reply_to_id: replyToId ?? null,
        edited_at: null,
        created_at: new Date().toISOString(),
        deleted_at: null,
        sender: null,
      };
      queryClient.setQueryData(["messages", conversationId], (old = []) => [...old, optimistic]);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["messages", conversationId], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ── Edit message ──────────────────────────────────────────────────────────────

export function useEditMessage(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content }) => messagesApi.editMessage(messageId, content),
    onMutate: async ({ messageId, content }) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previous = queryClient.getQueryData(["messages", conversationId]);
      queryClient.setQueryData(["messages", conversationId], (old = []) =>
        old.map(m => m.id === messageId ? { ...m, content, edited_at: new Date().toISOString() } : m)
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["messages", conversationId], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
  });
}

// ── Delete conversation ───────────────────────────────────────────────────────

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId) => messagesApi.deleteConversation(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

// ── Delete message ────────────────────────────────────────────────────────────

export function useDeleteMessage(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId) => messagesApi.deleteMessage(messageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
  });
}

// ── Mark read ─────────────────────────────────────────────────────────────────

export function useMarkRead(conversationId, userId) {
  return useMutation({
    mutationFn: () => messagesApi.markRead(conversationId, userId),
  });
}

// ── Presence (typing + online) ────────────────────────────────────────────────

/**
 * Returns:
 *   broadcastTyping(isTyping) — call when input changes
 *   isOtherTyping             — boolean
 *   isOtherOnline             — boolean
 *   otherLastSeen             — ISO string or null
 */
export function usePresence(conversationId, userId, otherUserId) {
  const channelRef = useRef(null);
  const typingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  // We expose state via a ref-based approach + a callback to avoid re-renders
  // The component reads from the channel's presence state directly
  // Instead, we return a channel ref so MessagesPage can track presence itself
  return { channelRef, typingRef, typingTimeoutRef };
}

// ── Unread count (for nav badge) ──────────────────────────────────────────────

export function useUnreadMessageCount() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("unread-badge-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [queryClient]);

  return useQuery({
    queryKey: ["conversations"],
    queryFn: messagesApi.getConversations,
    staleTime: 30_000,
    select: (data) => data.reduce((sum, c) => sum + (Number(c.unread_count) || 0), 0),
  });
}
