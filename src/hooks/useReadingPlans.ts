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

export function usePlanCompletions(planId: string | undefined) {
  return useQuery({
    queryKey: ["plan-completions", planId],
    queryFn: () => readingPlansApi.getCompletions(planId!),
    enabled: !!planId,
    staleTime: 10_000,
  });
}

export function useEnrollPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateKey: string) => readingPlansApi.enroll(templateKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-plans"] }),
  });
}

export function useEnrollCustomPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: Record<string, unknown>) => readingPlansApi.enrollCustom(config as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-plans"] }),
  });
}

export function useUnenrollPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => readingPlansApi.unenroll(planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-plans"] }),
  });
}

export function usePausePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => readingPlansApi.pause(planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-plans"] }),
  });
}

export function useResumePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: Record<string, unknown>) => readingPlansApi.resume(plan as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-plans"] }),
  });
}

export function useCatchUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, completedCount }: { planId: string; completedCount: number }) =>
      readingPlansApi.catchUp(planId, completedCount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reading-plans"] }),
  });
}

export function useMarkDay(planId: string | undefined, userId: string | undefined, totalDays: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dayNumber: number) => readingPlansApi.markDay(planId!, dayNumber),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan-completions", planId] });
      if (userId && totalDays) {
        qc.fetchQuery({
          queryKey: ["plan-completions", planId],
          queryFn: () => readingPlansApi.getCompletions(planId!),
          staleTime: 0,
        }).then((completions: unknown[]) => {
          if ((completions ?? []).length >= totalDays!) {
            badgesApi.awardBadge(userId, "plan_complete");
          }
        }).catch(() => {});
      }
    },
  });
}

export function useUnmarkDay(planId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dayNumber: number) => readingPlansApi.unmarkDay(planId!, dayNumber),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan-completions", planId] }),
  });
}
