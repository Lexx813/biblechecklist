import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { readingPlansApi } from "../api/readingPlans";
import { badgesApi } from "../api/badges";

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

export function useEnrollCustomPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config) => readingPlansApi.enrollCustom(config),
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

export function usePausePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId) => readingPlansApi.pause(planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-plans"] }),
  });
}

export function useResumePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan) => readingPlansApi.resume(plan),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-plans"] }),
  });
}

export function useCatchUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, completedCount }) => readingPlansApi.catchUp(planId, completedCount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-plans"] }),
  });
}

export function useMarkDay(planId, userId, totalDays) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dayNumber) => readingPlansApi.markDay(planId, dayNumber),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan-completions", planId] });
      if (userId && totalDays) {
        qc.fetchQuery({
          queryKey: ["plan-completions", planId],
          queryFn: () => readingPlansApi.getCompletions(planId),
          staleTime: 0,
        }).then((completions) => {
          if ((completions ?? []).length >= totalDays) {
            badgesApi.awardBadge(userId, "plan_complete");
          }
        }).catch(() => {});
      }
    },
  });
}

export function useUnmarkDay(planId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dayNumber) => readingPlansApi.unmarkDay(planId, dayNumber),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan-completions", planId] }),
  });
}
