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
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
  return data;
}
