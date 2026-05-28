import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { ONLINE_THRESHOLD_MS } from "./useOnlineMembers";

const RECENT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export interface CommunityMember {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  last_active_at: string | null;
  created_at: string | null;
}

export type CommunityFilter = "online" | "all";

interface UseCommunityMembersArgs {
  page: number;
  pageSize: number;
  filter: CommunityFilter;
  search: string;
}

interface CommunityPage {
  rows: CommunityMember[];
  total: number;
  usedFallback: boolean;
}

const baseSelect = "id, display_name, avatar_url, last_active_at, created_at";

export function useCommunityMembers({ page, pageSize, filter, search }: UseCommunityMembersArgs) {
  const trimmed = search.trim();
  return useQuery<CommunityPage>({
    queryKey: ["communityMembers", page, pageSize, filter, trimmed.toLowerCase()],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const now = Date.now();
      const sinceWindow = new Date(now - RECENT_WINDOW_MS).toISOString();
      const sinceOnline = new Date(now - ONLINE_THRESHOLD_MS).toISOString();

      const applySearch = <T extends { ilike: (col: string, pattern: string) => T }>(q: T): T =>
        trimmed ? q.ilike("display_name", `%${trimmed}%`) : q;

      if (filter === "online") {
        const q = supabase
          .from("profiles")
          .select(baseSelect, { count: "exact" })
          .eq("show_online", true)
          .gte("last_active_at", sinceOnline)
          .order("last_active_at", { ascending: false, nullsFirst: false })
          .range(from, to);
        const { data, error, count } = await applySearch(q);
        if (error) throw new Error(error.message);
        return { rows: (data ?? []) as CommunityMember[], total: count ?? 0, usedFallback: false };
      }

      const primary = supabase
        .from("profiles")
        .select(baseSelect, { count: "exact" })
        .eq("show_online", true)
        .gte("last_active_at", sinceWindow)
        .order("last_active_at", { ascending: false, nullsFirst: false })
        .range(from, to);
      const { data, error, count } = await applySearch(primary);
      if (error) throw new Error(error.message);

      if ((count ?? 0) > 0) {
        return { rows: (data ?? []) as CommunityMember[], total: count ?? 0, usedFallback: false };
      }

      const fallback = supabase
        .from("profiles")
        .select(baseSelect, { count: "exact" })
        .eq("show_online", true)
        .order("created_at", { ascending: false })
        .range(from, to);
      const { data: fData, error: fErr, count: fCount } = await applySearch(fallback);
      if (fErr) throw new Error(fErr.message);
      return { rows: (fData ?? []) as CommunityMember[], total: fCount ?? 0, usedFallback: true };
    },
    staleTime: 60_000,
    placeholderData: previous => previous,
  });
}

export function useOnlineCount() {
  return useQuery<number>({
    queryKey: ["communityOnlineCount"],
    queryFn: async () => {
      const since = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("show_online", true)
        .gte("last_active_at", since);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    staleTime: 60_000,
  });
}
