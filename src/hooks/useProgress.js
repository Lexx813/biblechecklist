import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { progressApi } from "../api/progress";

export function useProgress(userId) {
  return useQuery({
    queryKey: ["progress", userId],
    queryFn: () => progressApi.load(userId),
    enabled: !!userId,
    staleTime: Infinity,
  });
}

export function useSaveProgress(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (progress) => progressApi.save(userId, progress),
    onMutate: (progress) => {
      // Optimistically update the cache so the UI never rolls back
      queryClient.setQueryData(["progress", userId], progress);
    },
  });
}
