import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookmarksApi } from "../api/bookmarks";

export function useBookmarks(userId: string | undefined) {
  return useQuery({
    queryKey: ["bookmarks", userId],
    queryFn: bookmarksApi.list,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useBookmarkIds(userId: string | undefined) {
  return useQuery({
    queryKey: ["bookmarks", "ids", userId],
    queryFn: bookmarksApi.getIds,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useToggleBookmark(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options: Record<string, unknown>) => bookmarksApi.toggle(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks", userId] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks", "ids", userId] });
    },
  });
}
