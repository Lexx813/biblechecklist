import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reactionsApi, type ReactionMap, type ReactionTarget } from "../api/reactions";

export function useBulkReactions(targets: ReactionTarget[]) {
  const key = targets.map(t => `${t.type}:${t.id}`).sort().join("|");
  return useQuery({
    queryKey: ["reactions", "bulk", key],
    queryFn: () => reactionsApi.bulk(targets),
    enabled: targets.length > 0,
    staleTime: 30_000,
  });
}

export function useToggleReaction(bulkKeys: string[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ targetType, targetId, emoji }: { targetType: string; targetId: string; emoji: string }) =>
      reactionsApi.toggle(targetType, targetId, emoji),
    onMutate: async ({ targetType, targetId, emoji }) => {
      const targetKey = `${targetType}:${targetId}`;
      const snapshots: Array<[string, ReactionMap | undefined]> = [];
      for (const k of bulkKeys) {
        const queryKey = ["reactions", "bulk", k];
        await qc.cancelQueries({ queryKey });
        const prev = qc.getQueryData<ReactionMap>(queryKey);
        snapshots.push([k, prev]);
        if (!prev || !prev[targetKey]) continue;
        const current = prev[targetKey];
        const isMine = current.mine.includes(emoji);
        const nextCounts = { ...current.counts };
        nextCounts[emoji] = (nextCounts[emoji] ?? 0) + (isMine ? -1 : 1);
        if (nextCounts[emoji] <= 0) delete nextCounts[emoji];
        const nextMine = isMine ? current.mine.filter(e => e !== emoji) : [...current.mine, emoji];
        qc.setQueryData<ReactionMap>(queryKey, {
          ...prev,
          [targetKey]: { counts: nextCounts, mine: nextMine },
        });
      }
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      for (const [k, snap] of ctx.snapshots) {
        qc.setQueryData(["reactions", "bulk", k], snap);
      }
    },
    onSettled: () => {
      for (const k of bulkKeys) {
        qc.invalidateQueries({ queryKey: ["reactions", "bulk", k] });
      }
    },
  });
}
