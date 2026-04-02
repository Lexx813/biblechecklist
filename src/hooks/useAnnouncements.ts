import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { announcementsApi } from "../api/announcements";

export function useActiveAnnouncements() {
  return useQuery({
    queryKey: ["announcements", "active"],
    queryFn: announcementsApi.getActive,
    staleTime: 10 * 60_000,
  });
}

export function useAllAnnouncements() {
  return useQuery({
    queryKey: ["announcements", "all"],
    queryFn: announcementsApi.getAll,
    staleTime: 10 * 60_000,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ authorId, message, type }: { authorId: string; message: string; type: string }) =>
      announcementsApi.create(authorId, message, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

export function useToggleAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => announcementsApi.toggle(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => announcementsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });
}
