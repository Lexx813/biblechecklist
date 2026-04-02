import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { friendsApi } from "../api/friends";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FriendProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  last_active_at: string | null;
  friendship_id: string;
  sponsored_by: string | null;
  friendship_created_at: string;
}

export interface IncomingRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at: string;
  sender: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface OutgoingRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: string;
  created_at: string;
  recipient: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export type FriendStatus = "friends" | "pending_sent" | "pending_received" | "none";

// ── Query hooks ───────────────────────────────────────────────────────────────

export function useFriends(userId: string) {
  return useQuery<FriendProfile[]>({
    queryKey: ["friends", userId],
    queryFn: () => friendsApi.getFriends() as unknown as Promise<FriendProfile[]>,
    enabled: !!userId,
    staleTime: 2 * 60_000,
  });
}

export function useFriendRequests(userId: string) {
  const incoming = useQuery<IncomingRequest[]>({
    queryKey: ["friendRequests", "incoming", userId],
    queryFn: () => friendsApi.getIncoming(),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const outgoing = useQuery<OutgoingRequest[]>({
    queryKey: ["friendRequests", "outgoing", userId],
    queryFn: () => friendsApi.getOutgoing(),
    enabled: !!userId,
    staleTime: 30_000,
  });

  return { incoming, outgoing };
}

export function useFriendStatus(userId: string, targetId: string) {
  return useQuery<FriendStatus>({
    queryKey: ["friendStatus", userId, targetId],
    queryFn: () => friendsApi.getStatus(targetId),
    enabled: !!userId && !!targetId && userId !== targetId,
    staleTime: 60_000,
  });
}

export function useInviteToken(userId: string) {
  return useQuery<string>({
    queryKey: ["inviteToken", userId],
    queryFn: () => friendsApi.getOrCreateToken(),
    enabled: !!userId,
    staleTime: Infinity,
  });
}

// ── Mutation hooks ────────────────────────────────────────────────────────────

export function useSendFriendRequest(userId: string, targetId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => friendsApi.sendRequest(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendStatus", userId, targetId] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests", "outgoing", userId] });
    },
  });
}

export function useCancelFriendRequest(userId: string, targetId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => friendsApi.cancelRequest(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendStatus", userId, targetId] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests", "outgoing", userId] });
    },
  });
}

export function useAcceptFriendRequest(userId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (fromUserId: string) => friendsApi.acceptRequest(fromUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests", "incoming", userId] });
      queryClient.invalidateQueries({ queryKey: ["friends", userId] });
    },
  });
}

export function useDeclineFriendRequest(userId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (fromUserId: string) => friendsApi.declineRequest(fromUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests", "incoming", userId] });
    },
  });
}

export function useRemoveFriend(userId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (friendshipId: string) => friendsApi.removeFriend(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", userId] });
    },
  });
}
