import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMeetingWeek,
  getRecentMeetingWeeks,
  getPrepForWeek,
  upsertPrep,
  getPrepHistory,
  getPrepStreak,
} from "../api/meetingPrep";

// ── Utility ───────────────────────────────────────────────────────────────────

export function getMondayOfWeek(d = new Date()): string {
  const day = d.getDay(); // 0=Sun, local time
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  // Use local date parts — NOT toISOString() which returns UTC and can shift the date
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const fmt = (date: Date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(d)} – ${fmt(end)}`;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useMeetingWeek(weekStart: string | undefined) {
  return useQuery({
    queryKey: ["meetingWeek", weekStart],
    queryFn: () => getMeetingWeek(weekStart!),
    staleTime: 1000 * 60 * 60 * 24, // 24h — scraped content rarely changes
    enabled: !!weekStart,
  });
}

export function useRecentMeetingWeeks() {
  return useQuery({
    queryKey: ["meetingWeeks"],
    queryFn: () => getRecentMeetingWeeks(8),
    staleTime: 1000 * 60 * 60,
  });
}

export function usePrepForWeek(userId: string | undefined, weekStart: string | undefined) {
  return useQuery({
    queryKey: ["prep", userId, weekStart],
    queryFn: () => getPrepForWeek(userId!, weekStart!),
    enabled: !!userId && !!weekStart,
    staleTime: 30_000,
  });
}

export function usePrepHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ["prepHistory", userId],
    queryFn: () => getPrepHistory(userId!, 12),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function usePrepStreak(userId: string | undefined) {
  return useQuery({
    queryKey: ["prepStreak", userId],
    queryFn: () => getPrepStreak(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useUpdatePrep(userId: string | undefined, weekStart: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (updates: any) => upsertPrep(userId!, weekStart!, updates),
    onMutate: async (updates: any) => {
      const key = ["prep", userId, weekStart];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old: Record<string, unknown> | undefined) => ({ ...old, ...updates }));
      return { prev };
    },
    onError: (_err: unknown, _vars: unknown, ctx: { prev: unknown } | undefined) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(["prep", userId, weekStart], ctx.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["prep", userId, weekStart] });
      qc.invalidateQueries({ queryKey: ["prepStreak", userId] });
      qc.invalidateQueries({ queryKey: ["prepHistory", userId] });
    },
  });
}
