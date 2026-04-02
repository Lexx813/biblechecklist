// @ts-nocheck
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

export function getMondayOfWeek(d = new Date()) {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

export function formatWeekLabel(weekStart) {
  const d = new Date(weekStart + "T00:00:00");
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const fmt = (date) => date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(d)} – ${fmt(end)}`;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useMeetingWeek(weekStart) {
  return useQuery({
    queryKey: ["meetingWeek", weekStart],
    queryFn: () => getMeetingWeek(weekStart),
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

export function usePrepForWeek(userId, weekStart) {
  return useQuery({
    queryKey: ["prep", userId, weekStart],
    queryFn: () => getPrepForWeek(userId, weekStart),
    enabled: !!userId && !!weekStart,
    staleTime: 30_000,
  });
}

export function usePrepHistory(userId) {
  return useQuery({
    queryKey: ["prepHistory", userId],
    queryFn: () => getPrepHistory(userId, 12),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function usePrepStreak(userId) {
  return useQuery({
    queryKey: ["prepStreak", userId],
    queryFn: () => getPrepStreak(userId),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useUpdatePrep(userId, weekStart) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (updates) => upsertPrep(userId, weekStart, updates),
    onMutate: async (updates) => {
      const key = ["prep", userId, weekStart];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) => ({ ...old, ...updates }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
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
