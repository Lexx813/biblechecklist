import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export const ONLINE_THRESHOLD_MS = 10 * 60 * 1000;

export interface OnlineMember {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  last_active_at: string | null;
}

export function splitByOnlineStatus(
  members: OnlineMember[],
  now: number = Date.now()
): { onlineNow: OnlineMember[]; recentlyActive: OnlineMember[] } {
  const onlineNow = members.filter(
    m => m.last_active_at != null &&
      now - new Date(m.last_active_at).getTime() < ONLINE_THRESHOLD_MS
  );
  const onlineSet = new Set(onlineNow.map(m => m.id));
  const recentlyActive = members.filter(
    m => !onlineSet.has(m.id) && m.last_active_at != null
  );
  return { onlineNow, recentlyActive };
}

export function useOnlineMembers(limit = 50) {
  const { data = [], isLoading } = useQuery<OnlineMember[]>({
    queryKey: ["onlineMembers", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, last_active_at")
        .eq("show_online", true)
        .order("last_active_at", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []) as OnlineMember[];
    },
    staleTime: 60_000,
  });

  const { onlineNow, recentlyActive } = splitByOnlineStatus(data);
  return { onlineNow, recentlyActive, totalOnline: onlineNow.length, isLoading };
}
