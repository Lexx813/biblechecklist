import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "../api/notes";

export function useNotes(userId) {
  return useQuery({
    queryKey: ["notes", userId],
    queryFn: () => notesApi.list(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateNote(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note) => notesApi.create(userId, note),
    onSuccess: (newNote) => {
      queryClient.setQueryData(["notes", userId], (prev = []) => [newNote, ...prev]);
    },
  });
}

export function useUpdateNote(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, updates }) => notesApi.update(noteId, updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(["notes", userId], (prev = []) =>
        prev.map(n => n.id === updated.id ? updated : n)
      );
    },
  });
}

export function useDeleteNote(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId) => notesApi.delete(noteId),
    onSuccess: (_, noteId) => {
      queryClient.setQueryData(["notes", userId], (prev = []) =>
        prev.filter(n => n.id !== noteId)
      );
    },
  });
}
