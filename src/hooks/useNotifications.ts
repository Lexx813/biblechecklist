import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { subscribeWithMonitor } from "../lib/realtime";
import { notificationsApi } from "../api/notifications";

/**
 * Pure read of the notifications list, derived from the shared
 * ["notifications", userId] cache. Safe to call from many components
 * simultaneously — does NOT open a realtime channel. Mount
 * `useGlobalNotificationsSync` once high in the authed tree to keep the
 * cache live.
 *
 * Previously every component that called this opened its own
 * `notifs:<userId>` channel + visibility listener (TopBar via
 * useUnreadNotificationCount, NotificationDropdown). Now they share.
 */
export function useNotifications(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: notificationsApi.list,
    enabled: !!userId,
    staleTime: 30_000,
    // realtime via useGlobalNotificationsSync + window-focus is enough.
    // Was refetchInterval: 30_000 + manual visibilitychange listener +
    // refetchOnWindowFocus — triple-fetching.
    refetchOnWindowFocus: true,
  });
}

/**
 * Singleton realtime sync for the notifications cache. Call once near the
 * top of the authed tree.
 */
export function useGlobalNotificationsSync(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  // Real-time: push new notifications live
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifs:${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      });
    subscribeWithMonitor(channel, `notifs:${userId}`, (status) => {
      // On reconnect after dropout, refetch in case we missed inserts.
      if (status === "SUBSCRIBED") {
        queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [userId, queryClient]);
}

export function useUnreadNotificationCount(userId: string | null | undefined) {
  const { data = [] } = useNotifications(userId);
  return data.filter((n: any) => !n.read).length;
}

export function useMarkNotificationsRead(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[] | "all") => ids === "all"
      ? notificationsApi.markAllRead()
      : notificationsApi.markRead(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
}

export function useMarkConversationNotificationsRead(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => notificationsApi.markConversationRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
}

export function useDeleteNotification(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
}

export function useClearAllNotifications(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.clearAll,
    onSuccess: () => queryClient.setQueryData(["notifications", userId], []),
  });
}
