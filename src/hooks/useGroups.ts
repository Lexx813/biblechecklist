import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { groupsApi } from "../api/groups";

// ── Groups ────────────────────────────────────────────────────────────────────

export function useMyGroups() {
  return useQuery({ queryKey: ["groups", "mine"], queryFn: groupsApi.getMyGroups, staleTime: 30_000 });
}

export function usePublicGroups() {
  return useQuery({ queryKey: ["groups", "public"], queryFn: groupsApi.getPublicGroups, staleTime: 30_000 });
}

export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupsApi.getGroup(groupId!),
    enabled: !!groupId,
    staleTime: 30_000,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.createGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useUpdateGroup(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: Parameters<typeof groupsApi.updateGroup>[1]) => groupsApi.updateGroup(groupId!, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group", groupId] });
      qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.deleteGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

// ── Members ───────────────────────────────────────────────────────────────────

export function useGroupMembers(groupId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!groupId) return;
    const ch = supabase
      .channel(`group-members:${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${groupId}` }, () => {
        qc.invalidateQueries({ queryKey: ["group-members", groupId] });
        qc.invalidateQueries({ queryKey: ["group", groupId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [groupId, qc]);

  return useQuery({
    queryKey: ["group-members", groupId],
    queryFn: () => groupsApi.getMembers(groupId!),
    enabled: !!groupId,
    staleTime: 15_000,
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.joinGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.leaveGroup,
    onSuccess: (_d, groupId) => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["group-members", groupId] });
    },
  });
}

export function useApproveJoinRequest(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.approveJoinRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group-members", groupId] });
      qc.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });
}

export function useDenyJoinRequest(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.denyJoinRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-members", groupId] }),
  });
}

export function useRemoveMember(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.removeMember,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group-members", groupId] });
      qc.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });
}

export function useUpdateMemberRole(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: "admin" | "member" }) =>
      groupsApi.updateMemberRole(memberId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-members", groupId] }),
  });
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export function useGroupPosts(groupId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!groupId) return;
    const ch = supabase
      .channel(`group-posts:${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_posts", filter: `group_id=eq.${groupId}` }, () => {
        qc.invalidateQueries({ queryKey: ["group-posts", groupId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [groupId, qc]);

  return useQuery({
    queryKey: ["group-posts", groupId],
    queryFn: () => groupsApi.getPosts(groupId!),
    enabled: !!groupId,
    staleTime: 30_000,
  });
}

export function useCreatePost(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, isAnnouncement, mediaUrls }: { content: string; isAnnouncement?: boolean; mediaUrls?: string[] }) =>
      groupsApi.createPost(groupId!, content, isAnnouncement, mediaUrls),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-posts", groupId] }),
  });
}

export function useDeletePost(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.deletePost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-posts", groupId] }),
  });
}

export function useToggleLike(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.toggleLike,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-posts", groupId] }),
  });
}

// ── Comments ──────────────────────────────────────────────────────────────────

export function usePostComments(postId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!postId) return;
    const ch = supabase
      .channel(`post-comments:${postId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_post_comments", filter: `post_id=eq.${postId}` }, () => {
        qc.invalidateQueries({ queryKey: ["post-comments", postId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [postId, qc]);

  return useQuery({
    queryKey: ["post-comments", postId],
    queryFn: () => groupsApi.getComments(postId!),
    enabled: !!postId,
    staleTime: 15_000,
  });
}

export function useAddComment(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) => groupsApi.addComment(postId, content),
    onSuccess: (_d, { postId }) => {
      qc.invalidateQueries({ queryKey: ["post-comments", postId] });
      qc.invalidateQueries({ queryKey: ["group-posts", groupId] });
    },
  });
}

export function useDeleteComment(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, postId }: { commentId: string; postId: string }) =>
      groupsApi.deleteComment(commentId).then(() => postId),
    onSuccess: (postId) => {
      qc.invalidateQueries({ queryKey: ["post-comments", postId] });
      qc.invalidateQueries({ queryKey: ["group-posts", groupId] });
    },
  });
}

// ── Events ────────────────────────────────────────────────────────────────────

export function useGroupEvents(groupId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!groupId) return;
    const ch = supabase
      .channel(`group-events:${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_events", filter: `group_id=eq.${groupId}` }, () => {
        qc.invalidateQueries({ queryKey: ["group-events", groupId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "group_event_rsvps" }, () => {
        qc.invalidateQueries({ queryKey: ["group-events", groupId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [groupId, qc]);

  return useQuery({
    queryKey: ["group-events", groupId],
    queryFn: () => groupsApi.getEvents(groupId!),
    enabled: !!groupId,
    staleTime: 60_000,
  });
}

export function useCreateEvent(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (event: Parameters<typeof groupsApi.createEvent>[1]) => groupsApi.createEvent(groupId!, event),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-events", groupId] }),
  });
}

export function useDeleteEvent(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.deleteEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-events", groupId] }),
  });
}

export function useSetRsvp(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: "going" | "maybe" | "not_going" }) =>
      groupsApi.setRsvp(eventId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-events", groupId] }),
  });
}

export function useRemoveRsvp(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: groupsApi.removeRsvp,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-events", groupId] }),
  });
}

// ── Files ─────────────────────────────────────────────────────────────────────

export function useGroupFiles(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group-files", groupId],
    queryFn: () => groupsApi.getFiles(groupId!),
    enabled: !!groupId,
    staleTime: 60_000,
  });
}

export function useUploadFile(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => groupsApi.uploadFile(groupId!, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-files", groupId] }),
  });
}

export function useDeleteFile(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fileId, storagePath }: { fileId: string; storagePath: string }) =>
      groupsApi.deleteFile(fileId, storagePath),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-files", groupId] }),
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
    mutationFn: ({ content, replyToId }: { content: string; replyToId?: string }) =>
      groupsApi.sendMessage(groupId!, content, replyToId),
    onMutate: async ({ senderId, content, replyToId }: { senderId: string; content: string; replyToId?: string }) => {
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

// ── Reactions ─────────────────────────────────────────────────────────────────

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

// ── Reading progress ──────────────────────────────────────────────────────────

export function useGroupProgress(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group-progress", groupId],
    queryFn: () => groupsApi.getGroupProgress(groupId!),
    enabled: !!groupId,
    staleTime: 60_000,
  });
}
