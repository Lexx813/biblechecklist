import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "../api/notes";

export function useNotes(userId: string | undefined) {
  return useQuery({
    queryKey: ["notes", userId],
    queryFn: () => notesApi.list(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateNote(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note: Record<string, unknown>) => notesApi.create(userId!, note as any),
    onSuccess: (newNote) => {
      queryClient.setQueryData(["notes", userId], (prev: unknown[] = []) => [newNote, ...prev]);
    },
  });
}

export function useUpdateNote(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, updates }: { noteId: string; updates: Record<string, unknown> }) =>
      notesApi.update(noteId, updates),
    onSuccess: (updated: { id: string }) => {
      queryClient.setQueryData(["notes", userId], (prev: Array<{ id: string }> = []) =>
        prev.map(n => n.id === updated.id ? updated : n)
      );
    },
  });
}

export function useDeleteNote(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => notesApi.delete(noteId),
    onSuccess: (_, noteId) => {
      queryClient.setQueryData(["notes", userId], (prev: Array<{ id: string }> = []) =>
        prev.filter(n => n.id !== noteId)
      );
    },
  });
}
