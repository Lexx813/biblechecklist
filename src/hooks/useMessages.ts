import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { subscribeWithMonitor } from "../lib/realtime";
import { messagesApi } from "../api/messages";
import { useSession } from "./useAuth";
import type { Database } from "../types/supabase";

type Json = Database["public"]["Tables"]["messages"]["Row"]["metadata"];

// ── Conversation list ─────────────────────────────────────────────────────────

export function useConversations() {
  // Realtime (via useGlobalUnreadMessageSync) + window-focus refetch + visibility
  // already cover staleness — no polling needed. Was refetchInterval: 15_000,
  // which combined with realtime + focus listeners triple-fetched conversations.
  //
  // userId is pulled from the cached session so getConversations() skips its
  // own supabase.auth.getUser() round-trip — saves one auth API call per
  // refetch, which used to fire 4x/min per consumer.
  const { data: session } = useSession();
  const userId = session?.user?.id;
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.getConversations(userId),
    staleTime: 30_000,
    enabled: !!userId,
  });
}

// ── Messages in a conversation ────────────────────────────────────────────────

export function useMessages(conversationId: string | null | undefined) {
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
          let needsProfileRefetch = false;
          queryClient.setQueryData(["messages", conversationId], (old: Record<string, unknown>[] = []) => {
            if (old.some((m) => m.id === payload.new.id)) return old;
            const cleaned = old.filter((m) => !String(m.id).startsWith("optimistic-"));
            const sender = old.find((m) => (m.sender as { id?: string } | null)?.id === payload.new.sender_id)?.sender ?? null;
            if (!sender) needsProfileRefetch = true;
            return [...cleaned, { ...payload.new, sender }];
          });
          // If sender profile wasn't in cache, refetch to get the joined profile data
          if (needsProfileRefetch) {
            queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          }
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (!payload?.new?.id) return;
          queryClient.setQueryData(["messages", conversationId], (old: Record<string, unknown>[] = []) =>
            old.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m)
          );
        }
      );
    subscribeWithMonitor(channel, `messages:${conversationId}`, (status) => {
      if (status === "SUBSCRIBED") {
        // After reconnect, refetch in case we missed inserts during dropout.
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messagesApi.getMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 60_000,
  });
}

// ── Reactions ─────────────────────────────────────────────────────────────────

export function useReactions(conversationId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`reactions:${conversationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["reactions", conversationId] });
      });
    subscribeWithMonitor(channel, `reactions:${conversationId}`);
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ["reactions", conversationId],
    queryFn: () => messagesApi.getReactions(conversationId!),
    enabled: !!conversationId,
    staleTime: 2_000,
  });
}

export function useToggleReaction(conversationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, userId, emoji }: { messageId: string; userId: string; emoji: string }) =>
      messagesApi.toggleReaction(messageId, userId, emoji),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["reactions", conversationId] }),
  });
}

// ── Get or create DM ─────────────────────────────────────────────────────────

export function useGetOrCreateDM() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId: string) => messagesApi.getOrCreateDM(otherUserId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

// ── Send message ──────────────────────────────────────────────────────────────

interface SendMessageVars {
  content: string;
  senderId?: string;
  recipientId?: string;
  replyToId?: string | null;
  messageType?: string;
  metadata?: Json | null;
}

export function useSendMessage(conversationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, replyToId, messageType, metadata }: SendMessageVars) =>
      messagesApi.sendMessage(conversationId!, content, replyToId, messageType, metadata),
    onMutate: async ({ senderId, content, replyToId, messageType, metadata }: SendMessageVars) => {
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
      queryClient.setQueryData(["messages", conversationId], (old: Record<string, unknown>[] = []) => [...old, optimistic]);
      return { previous };
    },
    onError: (_err: unknown, _vars: SendMessageVars, ctx: { previous: unknown } | undefined) => {
      if (ctx?.previous) queryClient.setQueryData(["messages", conversationId], ctx.previous);
    },
    onSuccess: async (data: { id?: string } | null, variables: SendMessageVars) => {
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

interface EditMessageVars { messageId: string; content: string; }

export function useEditMessage(conversationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, EditMessageVars, { previous: unknown }>({
    mutationFn: ({ messageId, content }) =>
      messagesApi.editMessage(messageId, content),
    onMutate: async ({ messageId, content }) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previous = queryClient.getQueryData(["messages", conversationId]);
      queryClient.setQueryData(["messages", conversationId], (old: Record<string, unknown>[] = []) =>
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
    mutationFn: (conversationId: string) => messagesApi.deleteConversation(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

// ── Delete message ────────────────────────────────────────────────────────────

export function useDeleteMessage(conversationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => messagesApi.deleteMessage(messageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] }),
  });
}

// ── Mark read ─────────────────────────────────────────────────────────────────

export function useMarkRead(conversationId: string | null | undefined, userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (snapConvId: string) => {
      if (!userId) return Promise.resolve();
      return messagesApi.markRead(snapConvId, userId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

// ── Presence (typing + online) ────────────────────────────────────────────────

export function usePresence(
  _conversationId: string | null | undefined,
  _userId: string | null | undefined,
  _otherUserId: string | null | undefined
) {
  const channelRef = useRef(null);
  const typingRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return { channelRef, typingRef, typingTimeoutRef };
}

// ── Unread count (for nav badge) ──────────────────────────────────────────────

/**
 * Pure read of the unread message count, derived from the shared
 * ["conversations"] cache. Safe to call from many components simultaneously —
 * does NOT open a realtime channel. Mount `useGlobalUnreadMessageSync` once
 * high in the tree (Providers / AuthedApp) to keep the cache live.
 *
 * Previously this hook opened its own `unread-badge-realtime` channel +
 * `visibilitychange` listener on every consumer (TopBar, MobileTabBar,
 * FloatingChat, HomePage = 4 channels per authed page). Now they all share
 * one subscription.
 */
export function useUnreadMessageCount() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.getConversations(userId),
    staleTime: 30_000,
    enabled: !!userId,
    select: (data: { unread_count?: number | string }[]) =>
      data.reduce((sum, c) => sum + (Number(c.unread_count) || 0), 0),
  });
}

/**
 * Singleton realtime + visibility sync for the conversations cache. Call once
 * near the top of the authed tree. Subsequent consumers can call
 * `useUnreadMessageCount` (or `useConversations`) and read the shared cache.
 *
 * Note: `postgres_changes` filters only support equality, and the `messages`
 * table has no `recipient_id` column — only `sender_id` and `conversation_id`.
 * We can't server-side-filter to "messages where I'm the recipient" in one
 * channel. We instead skip invalidation when the inserting user IS us
 * (sender_id matches our userId) since the WAL event still arrives but we
 * don't need to refetch our own writes.
 */
export function useGlobalUnreadMessageSync(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("unread-badge-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        // Skip self-sent messages — we already optimistically updated the cache.
        // The realtime broadcast is global (no recipient column to filter on),
        // so client-side filter avoids redundant invalidations.
        const senderId = (payload?.new as { sender_id?: string } | undefined)?.sender_id;
        if (senderId === userId) return;
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      });
    subscribeWithMonitor(channel, "unread-badge-realtime");
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, userId]);

  // Refetch when the user returns to the app — realtime misses events while
  // backgrounded. (refetchOnWindowFocus does NOT cover visibilitychange on
  // mobile Safari, so we keep this explicit listener.)
  useEffect(() => {
    if (!userId) return;
    function onVisible() {
      if (document.visibilityState === "visible") {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [queryClient, userId]);
}

// ── Star / Starred messages ───────────────────────────────────────────────────

export function useToggleStar(conversationId: string | null | undefined, userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => messagesApi.toggleStar(messageId),
    onMutate: async (messageId: string) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });
      const previous = queryClient.getQueryData(["messages", conversationId]);
      queryClient.setQueryData(["messages", conversationId], (old: Record<string, unknown>[] = []) =>
        old.map(m => {
          if (m.id !== messageId) return m;
          const starred = Array.isArray(m.starred_by) ? m.starred_by as string[] : [];
          const next = starred.includes(userId)
            ? starred.filter(id => id !== userId)
            : [...starred, userId];
          return { ...m, starred_by: next };
        })
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["messages", conversationId], ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["starred", conversationId] });
    },
  });
}

export function useStarredMessages(conversationId: string | null | undefined) {
  return useQuery({
    queryKey: ["starred", conversationId],
    queryFn: () => messagesApi.getStarred(conversationId!),
    enabled: !!conversationId,
    staleTime: 10_000,
  });
}

// ── Search messages ───────────────────────────────────────────────────────────

export function useSearchMessages(conversationId: string | null | undefined, query: string) {
  return useQuery({
    queryKey: ["searchMessages", conversationId, query],
    queryFn: () => messagesApi.searchMessages(conversationId!, query),
    enabled: !!conversationId && !!query && query.length >= 2,
    staleTime: 10_000,
  });
}

// ── Conversation settings ─────────────────────────────────────────────────────

export function useConvSettings(conversationId: string | null | undefined) {
  return useQuery({
    queryKey: ["convSettings", conversationId],
    queryFn: () => messagesApi.getConvSettings(conversationId!),
    enabled: !!conversationId,
    staleTime: 60_000,
  });
}

export function useSaveConvSettings(conversationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ themeAccent, disappearAfter }: { themeAccent: string; disappearAfter: number | null }) =>
      messagesApi.saveConvSettings(conversationId!, themeAccent, disappearAfter),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["convSettings", conversationId] }),
  });
}

// ── Link previews ─────────────────────────────────────────────────────────────

export function useLinkPreviews(conversationId: string | null | undefined) {
  return useQuery({
    queryKey: ["linkPreviews", conversationId],
    queryFn: () => messagesApi.getLinkPreviews(conversationId!),
    enabled: !!conversationId,
    staleTime: 60_000,
  });
}

// ── Image upload ──────────────────────────────────────────────────────────────

export function useUploadImage(conversationId: string | null | undefined) {
  const [uploading, setUploading] = useState(false);
  const sendMessage = useSendMessage(conversationId);

  const uploadAndSend = useCallback(async (
    file: File,
    senderId: string,
    replyToId: string | null = null,
    onError?: (msg: string) => void
  ) => {
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
      const msg = err instanceof Error ? err.message : "Failed to upload image.";
      onError?.(msg);
    } finally {
      setUploading(false);
    }
  }, [sendMessage]);

  return { uploading, uploadAndSend };
}
