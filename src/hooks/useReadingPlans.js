import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { readingPlansApi } from "../api/readingPlans";

export function useMyPlans() {
  return useQuery({
    queryKey: ["reading-plans"],
    queryFn: readingPlansApi.getMyPlans,
    staleTime: 30_000,
  });
}

export function usePlanCompletions(planId) {
  return useQuery({
    queryKey: ["plan-completions", planId],
    queryFn: () => readingPlansApi.getCompletions(planId),
    enabled: !!planId,
    staleTime: 10_000,
  });
}

export function useEnrollPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateKey) => readingPlansApi.enroll(templateKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-plans"] }),
  });
}

export function useUnenrollPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId) => readingPlansApi.unenroll(planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-plans"] }),
  });
}

export function useMarkDay(planId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dayNumber) => readingPlansApi.markDay(planId, dayNumber),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan-completions", planId] }),
  });
}

export function useUnmarkDay(planId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dayNumber) => readingPlansApi.unmarkDay(planId, dayNumber),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan-completions", planId] }),
  });
}
