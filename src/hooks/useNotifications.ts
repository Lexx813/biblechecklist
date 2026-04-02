import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { notificationsApi } from "../api/notifications";

export function useNotifications(userId: string | null | undefined) {
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
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, queryClient]);

  // Refetch when user returns to app — realtime misses events while backgrounded
  useEffect(() => {
    if (!userId) return;
    function onVisible() {
      if (document.visibilityState === "visible") {
        queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: notificationsApi.list,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
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
