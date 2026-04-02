// src/hooks/useBadges.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { badgesApi } from "../api/badges";
import { BADGES } from "../data/badges";

export function useBadges(userId: string | undefined) {
  return useQuery({
    queryKey: ["badges", userId],
    queryFn: () => badgesApi.getUserBadges(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useAwardBadge(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (badgeKey: string) => badgesApi.awardBadge(userId!, badgeKey),
    onSuccess: (result, badgeKey) => {
      if (!result?.alreadyEarned) {
        queryClient.invalidateQueries({ queryKey: ["badges", userId] });
        // Fire a custom event for the toast system to pick up
        const badge = BADGES.find((b) => b.key === badgeKey);
        if (badge && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("badge-earned", { detail: { badge } }));
        }
      }
    },
  });
}
