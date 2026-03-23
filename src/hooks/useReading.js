import { useQuery } from "@tanstack/react-query";
import { readingApi } from "../api/reading";

export function useReadingStats(userId) {
  return useQuery({
    queryKey: ["reading", "stats", userId],
    queryFn: () => readingApi.getStats(userId),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });
}
