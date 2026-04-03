import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blocksApi } from "../api/blocks";
import { buildBlockedSet } from "../utils/blocks";

export { buildBlockedSet };

/** Returns a Set of user IDs that are blocked (in either direction). */
export function useBlocks(userId: string | undefined) {
  return useQuery({
    queryKey: ["blocks", userId],
    queryFn: () => blocksApi.getBlocks(userId!),
    enabled: !!userId,
    staleTime: 60_000,
    select: (rows) => buildBlockedSet(rows, userId!),
  });
}

/** Returns only the users that the current user has blocked (with profile info). */
export function useMyBlocks(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-blocks", userId],
    queryFn: () => blocksApi.getMyBlocks(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blockedId: string) => blocksApi.blockUser(blockedId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocks"] });
      qc.invalidateQueries({ queryKey: ["my-blocks"] });
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blockedId: string) => blocksApi.unblockUser(blockedId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocks"] });
      qc.invalidateQueries({ queryKey: ["my-blocks"] });
    },
  });
}
