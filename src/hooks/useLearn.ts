import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { learnApi, type UpsertLearnLessonInput } from "../api/learn";

export function useMyLearnProgress(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["learn", "mine", userId],
    queryFn: () => learnApi.listMine(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useUpsertLearnLesson(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertLearnLessonInput) => learnApi.upsert(userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learn", "mine", userId] });
    },
  });
}

export function useDeleteLearnLesson(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lessonId: string) => learnApi.remove(userId!, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learn", "mine", userId] });
    },
  });
}

export function useAdminLearnStats() {
  return useQuery({
    queryKey: ["admin", "learnStats"],
    queryFn: learnApi.getAdminStats,
    staleTime: 5 * 60_000,
  });
}
