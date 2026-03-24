import { useQuery } from "@tanstack/react-query";
import { searchApi } from "../api/search";

export function useSearch(query) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchApi.search(query),
    enabled: !!query && query.trim().length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}
