import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
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
          if (!payload?.new?.id) return;
          queryClient.setQueryData(["messages", conversationId], (old = []) => {
            if (old.some((m) => m.id === payload.new.id)) return old;
            const cleaned = old.filter((m) => !String(m.id).startsWith("optimistic-"));
            return [...cleaned, payload.new];
          });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (!payload?.new?.id) return;
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
    staleTime: 30_000,
    refetchInterval: 30_000,
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
    mutationFn: ({ content, replyToId, messageType, metadata }) =>
      messagesApi.sendMessage(conversationId, content, replyToId, messageType, metadata),
    onMutate: async ({ senderId, content, replyToId, messageType, metadata }) => {
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
        message_type: messageType ?? "text",
        metadata: metadata ?? null,
        starred_by: [],
        sender: null,
      };
      queryClient.setQueryData(["messages", conversationId], (old = []) => [...old, optimistic]);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["messages", conversationId], ctx.previous);
    },
    onSuccess: async (data, variables) => {
      // Fire push notification to recipient (non-blocking)
      if (variables.recipientId) {
        messagesApi.notifyRecipient(conversationId, variables.recipientId);
      }
      // Fetch link preview if message contains a URL
      if (data?.id && variables.messageType !== "image" && variables.content) {
        const urlMatch = variables.content.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          messagesApi.fetchLinkPreview(data.id, urlMatch[0]).then(() => {
            queryClient.invalidateQueries({ queryKey: ["linkPreviews", conversationId] });
          });
        }
      }
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => messagesApi.markRead(conversationId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

// ── Presence (typing + online) ────────────────────────────────────────────────

export function usePresence(conversationId, userId, otherUserId) {
  const channelRef = useRef(null);
  const typingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
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

  // Refetch when the user returns to the app — realtime misses events while backgrounded
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [queryClient]);

  return useQuery({
    queryKey: ["conversations"],
    queryFn: messagesApi.getConversations,
    staleTime: 30_000,
    select: (data) => data.reduce((sum, c) => sum + (Number(c.unread_count) || 0), 0),
  });
}

// ── Star / Starred messages ───────────────────────────────────────────────────

export function useToggleStar(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId) => messagesApi.toggleStar(messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previous = queryClient.getQueryData(["messages", conversationId]);
      // We don't know the user id here so just invalidate on settle
      return { previous };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["starred", conversationId] });
    },
  });
}

export function useStarredMessages(conversationId) {
  return useQuery({
    queryKey: ["starred", conversationId],
    queryFn: () => messagesApi.getStarred(conversationId),
    enabled: !!conversationId,
    staleTime: 10_000,
  });
}

// ── Search messages ───────────────────────────────────────────────────────────

export function useSearchMessages(conversationId, query) {
  return useQuery({
    queryKey: ["searchMessages", conversationId, query],
    queryFn: () => messagesApi.searchMessages(conversationId, query),
    enabled: !!conversationId && !!query && query.length >= 2,
    staleTime: 10_000,
  });
}

// ── Conversation settings ─────────────────────────────────────────────────────

export function useConvSettings(conversationId) {
  return useQuery({
    queryKey: ["convSettings", conversationId],
    queryFn: () => messagesApi.getConvSettings(conversationId),
    enabled: !!conversationId,
    staleTime: 60_000,
  });
}

export function useSaveConvSettings(conversationId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ themeAccent, disappearAfter }) =>
      messagesApi.saveConvSettings(conversationId, themeAccent, disappearAfter),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["convSettings", conversationId] }),
  });
}

// ── Link previews ─────────────────────────────────────────────────────────────

export function useLinkPreviews(conversationId) {
  return useQuery({
    queryKey: ["linkPreviews", conversationId],
    queryFn: () => messagesApi.getLinkPreviews(conversationId),
    enabled: !!conversationId,
    staleTime: 60_000,
  });
}

// ── Image upload ──────────────────────────────────────────────────────────────

export function useUploadImage(conversationId) {
  const [uploading, setUploading] = useState(false);
  const sendMessage = useSendMessage(conversationId);

  const uploadAndSend = useCallback(async (file, senderId, replyToId = null) => {
    setUploading(true);
    try {
      const url = await messagesApi.uploadImage(file);
      sendMessage.mutate({
        senderId,
        content: url,
        replyToId,
        messageType: "image",
        metadata: { url, filename: file.name, size: file.size },
      });
    } catch (err) {
      console.error("[upload] failed:", err);
    } finally {
      setUploading(false);
    }
  }, [sendMessage]);

  return { uploading, uploadAndSend };
}
