import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { groupsApi } from "../api/groups";
import { badgesApi } from "../api/badges";

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

export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupsApi.getGroup(groupId!),
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

export function useUpdateGroup(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Record<string, unknown>) => groupsApi.updateGroup(groupId!, updates),
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

export function useGroupMembers(groupId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-members:${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "study_group_members", filter: `group_id=eq.${groupId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, queryClient]);

  return useQuery({
    queryKey: ["group-members", groupId],
    queryFn: () => groupsApi.getMembers(groupId!),
    enabled: !!groupId,
    staleTime: 15_000,
  });
}

export function useJoinGroup(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.joinGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      if (userId) badgesApi.awardBadge(userId, "first_group");
    },
  });
}

export function useJoinByCode(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.joinByCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      if (userId) badgesApi.awardBadge(userId, "first_group");
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.leaveGroup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useRemoveMember(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(groupId!, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-members", groupId] }),
  });
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export function useGroupLeaderboard(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group-leaderboard", groupId],
    queryFn: () => groupsApi.getLeaderboard(groupId!),
    enabled: !!groupId,
    staleTime: 60_000,
  });
}

// ── Group chat ────────────────────────────────────────────────────────────────

interface GroupMessage {
  id: string | number;
  group_id: string;
  sender_id: string;
  content: string;
  reply_to_id: string | null;
  edited_at: string | null;
  created_at: string;
  sender: unknown;
}

export function useGroupMessages(groupId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-chat:${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "study_group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          queryClient.setQueryData(["group-messages", groupId], (old: GroupMessage[] = []) => {
            if (old.some(m => m.id === payload.new.id)) return old;
            const cleaned = old.filter(m => !String(m.id).startsWith("optimistic-"));
            return [...cleaned, payload.new as GroupMessage];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "study_group_messages", filter: `group_id=eq.${groupId}` },
        () => { queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] }); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, queryClient]);

  return useQuery({
    queryKey: ["group-messages", groupId],
    queryFn: () => groupsApi.getMessages(groupId!),
    enabled: !!groupId,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useSendGroupMessage(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, replyToId }: any) =>
      groupsApi.sendMessage(groupId!, content, replyToId),
    onMutate: async ({ senderId, content, replyToId }: any) => {
      await queryClient.cancelQueries({ queryKey: ["group-messages", groupId] });
      const previous = queryClient.getQueryData(["group-messages", groupId]);
      const optimistic: GroupMessage = {
        id: `optimistic-${Date.now()}`,
        group_id: groupId!,
        sender_id: senderId,
        content,
        reply_to_id: replyToId ?? null,
        edited_at: null,
        created_at: new Date().toISOString(),
        sender: null,
      };
      queryClient.setQueryData(["group-messages", groupId], (old: GroupMessage[] = []) => [...old, optimistic]);
      return { previous };
    },
    onError: (_e: unknown, _v: unknown, ctx: { previous: unknown } | undefined) => {
      if (ctx?.previous) queryClient.setQueryData(["group-messages", groupId], ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] }),
  });
}

export function useDeleteGroupMessage(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.deleteMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] }),
  });
}

export function useEditGroupMessage(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      groupsApi.editMessage(messageId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] }),
  });
}

export function useGroupReactions(groupId: string | undefined) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-reactions:${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "study_group_message_reactions", filter: `group_id=eq.${groupId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["group-reactions", groupId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, queryClient]);
  return useQuery({
    queryKey: ["group-reactions", groupId],
    queryFn: () => groupsApi.getGroupReactions(groupId!),
    enabled: !!groupId,
    staleTime: 5_000,
  });
}

export function useToggleGroupReaction(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji, userId }: { messageId: string; emoji: string; userId: string }) =>
      groupsApi.toggleGroupReaction(messageId, groupId!, emoji, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-reactions", groupId] }),
  });
}

// ── Announcements ─────────────────────────────────────────────────────────────

export function useGroupAnnouncements(groupId: string | undefined) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-announcements:${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_announcements", filter: `group_id=eq.${groupId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["group-announcements", groupId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, queryClient]);
  return useQuery({
    queryKey: ["group-announcements", groupId],
    queryFn: () => groupsApi.getAnnouncements(groupId!),
    enabled: !!groupId,
    staleTime: 30_000,
  });
}

export function useCreateAnnouncement(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => groupsApi.createAnnouncement(groupId!, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-announcements", groupId] }),
  });
}

export function useDeleteAnnouncement(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupsApi.deleteAnnouncement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["group-announcements", groupId] }),
  });
}

// ── Join requests ─────────────────────────────────────────────────────────────

export function useJoinRequests(groupId: string | undefined) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-join-requests:${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_join_requests", filter: `group_id=eq.${groupId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["join-requests", groupId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, queryClient]);
  return useQuery({
    queryKey: ["join-requests", groupId],
    queryFn: () => groupsApi.getJoinRequests(groupId!),
    enabled: !!groupId,
    staleTime: 15_000,
  });
}

export function useMyJoinRequest(groupId: string | undefined) {
  return useQuery({
    queryKey: ["my-join-request", groupId],
    queryFn: () => groupsApi.getMyJoinRequest(groupId!),
    enabled: !!groupId,
    staleTime: 15_000,
  });
}

export function useRequestJoin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.requestJoin(groupId),
    onSuccess: (_d: unknown, groupId: string) =>
      queryClient.invalidateQueries({ queryKey: ["my-join-request", groupId] }),
  });
}

export function useCancelJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.cancelJoinRequest(groupId),
    onSuccess: (_d: unknown, groupId: string) =>
      queryClient.invalidateQueries({ queryKey: ["my-join-request", groupId] }),
  });
}

export function useApproveJoinRequest(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, userId }: { requestId: string; userId: string }) =>
      groupsApi.approveJoinRequest(requestId, groupId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["join-requests", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
    },
  });
}

export function useDenyJoinRequest(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => groupsApi.denyJoinRequest(requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["join-requests", groupId] }),
  });
}

// ── Reading progress ──────────────────────────────────────────────────────────

export function useGroupProgress(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group-progress", groupId],
    queryFn: () => groupsApi.getGroupProgress(groupId!),
    enabled: !!groupId,
    staleTime: 60_000,
  });
}
