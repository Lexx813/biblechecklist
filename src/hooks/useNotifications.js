import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { notificationsApi } from "../api/notifications";

export function useNotifications(userId) {
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

  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: notificationsApi.list,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,      // realtime handles new inserts; no need to refetch often
    refetchOnWindowFocus: false,    // realtime subscription keeps data fresh
  });
}

export function useMarkNotificationsRead(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => ids === "all"
      ? notificationsApi.markAllRead()
      : notificationsApi.markRead(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
}

export function useDeleteNotification(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
}

export function useClearAllNotifications(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.clearAll,
    onSuccess: () => queryClient.setQueryData(["notifications", userId], []),
  });
}
