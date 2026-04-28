import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { subscribeWithMonitor } from "../lib/realtime";
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
      });
    subscribeWithMonitor(ch, `group-members:${groupId}`, (status) => {
      if (status === "SUBSCRIBED") {
        qc.invalidateQueries({ queryKey: ["group-members", groupId] });
      }
    });
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
    mutationFn: ({ requestId, userId }: { requestId: string; userId: string }) =>
      groupsApi.approveJoinRequest(requestId, groupId!, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group-members", groupId] });
      qc.invalidateQueries({ queryKey: ["group", groupId] });
    },
  });
}

export function useDenyJoinRequest(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => groupsApi.denyJoinRequest(requestId),
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
      });
    subscribeWithMonitor(ch, `group-posts:${groupId}`, (status) => {
      if (status === "SUBSCRIBED") {
        qc.invalidateQueries({ queryKey: ["group-posts", groupId] });
      }
    });
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
      });
    subscribeWithMonitor(ch, `post-comments:${postId}`, (status) => {
      if (status === "SUBSCRIBED") {
        qc.invalidateQueries({ queryKey: ["post-comments", postId] });
      }
    });
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
      });
    subscribeWithMonitor(ch, `group-events:${groupId}`, (status) => {
      if (status === "SUBSCRIBED") {
        qc.invalidateQueries({ queryKey: ["group-events", groupId] });
      }
    });
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
