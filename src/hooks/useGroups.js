import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { groupsApi } from "../api/groups";

// ── My groups + public browse ─────────────────────────────────────────────────

export function useMyGroups() {
  return useQuery({
    queryKey: ["groups", "mine"],
    queryFn: groupsApi.getMyGroups,
    staleTime: 30_000,
  });
}

export function usePublicGroups() {
  return useQuery({
    queryKey: ["groups", "public"],
    queryFn: groupsApi.getPublicGroups,
    staleTime: 30_000,
  });
}

export function useGroup(groupId) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupsApi.getGroup(groupId),
    enabled: !!groupId,
    staleTime: 30_000,
  });
}

// ── Create / update / delete ──────────────────────────────────────────────────

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useUpdateGroup(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates) => groupsApi.updateGroup(groupId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.deleteGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });
}

// ── Membership ────────────────────────────────────────────────────────────────

export function useGroupMembers(groupId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-members:${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "study_group_members", filter: `group_id=eq.${groupId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [groupId, queryClient]);

  return useQuery({
    queryKey: ["group-members", groupId],
    queryFn: () => groupsApi.getMembers(groupId),
    enabled: !!groupId,
    staleTime: 15_000,
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.joinGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useJoinByCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.joinByCode,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.leaveGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useRemoveMember(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => groupsApi.removeMember(groupId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-members", groupId] }),
  });
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export function useGroupLeaderboard(groupId) {
  return useQuery({
    queryKey: ["group-leaderboard", groupId],
    queryFn: () => groupsApi.getLeaderboard(groupId),
    enabled: !!groupId,
    staleTime: 60_000,
  });
}

// ── Group chat ────────────────────────────────────────────────────────────────

export function useGroupMessages(groupId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-chat:${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "study_group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          queryClient.setQueryData(["group-messages", groupId], (old = []) => {
            if (old.some(m => m.id === payload.new.id)) return old;
            return [...old, payload.new];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "study_group_messages", filter: `group_id=eq.${groupId}` },
        () => { queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] }); }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [groupId, queryClient]);

  return useQuery({
    queryKey: ["group-messages", groupId],
    queryFn: () => groupsApi.getMessages(groupId),
    enabled: !!groupId,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}

export function useSendGroupMessage(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, replyToId }) => groupsApi.sendMessage(groupId, content, replyToId),
    onMutate: async ({ senderId, content, replyToId }) => {
      await queryClient.cancelQueries({ queryKey: ["group-messages", groupId] });
      const previous = queryClient.getQueryData(["group-messages", groupId]);
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        group_id: groupId,
        sender_id: senderId,
        content,
        reply_to_id: replyToId ?? null,
        edited_at: null,
        created_at: new Date().toISOString(),
        sender: null,
      };
      queryClient.setQueryData(["group-messages", groupId], (old = []) => [...old, optimistic]);
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["group-messages", groupId], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] }),
  });
}

export function useDeleteGroupMessage(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.deleteMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] }),
  });
}

export function useEditGroupMessage(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content }) => groupsApi.editMessage(messageId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] }),
  });
}

export function useGroupReactions(groupId) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-reactions:${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "study_group_message_reactions", filter: `group_id=eq.${groupId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["group-reactions", groupId] });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [groupId, queryClient]);
  return useQuery({
    queryKey: ["group-reactions", groupId],
    queryFn: () => groupsApi.getGroupReactions(groupId),
    enabled: !!groupId,
    staleTime: 5_000,
  });
}

export function useToggleGroupReaction(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji, userId }) => groupsApi.toggleGroupReaction(messageId, groupId, emoji, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-reactions", groupId] }),
  });
}
