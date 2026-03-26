import { useQuery } from "@tanstack/react-query";

async function fetchFlags() {
  const res = await fetch("/api/flags");
  if (!res.ok) return {};
  return res.json();
}

/**
 * Returns feature flags from Vercel Edge Config.
 * Falls back to empty object if unavailable.
 *
 * Usage:
 *   const { maintenanceMode, newFeature } = useFeatureFlags();
 */
export function useFeatureFlags() {
  const { data = {} } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: fetchFlags,
    staleTime: Infinity,          // once fetched, never considered stale
    gcTime: 30 * 60_000,         // keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
  return data;
}
