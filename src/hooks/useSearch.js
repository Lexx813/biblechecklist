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

export function useSemanticSearch(query) {
  return useQuery({
    queryKey: ["semantic-search", query],
    queryFn: () => searchApi.semanticSearch(query),
    enabled: !!query && query.trim().length >= 3,
    staleTime: 5 * 60 * 1000,
  });
}
