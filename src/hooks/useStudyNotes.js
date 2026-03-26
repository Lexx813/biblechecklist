import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studyNotesApi } from "../api/studyNotes";

export function useStudyNotes() {
  return useQuery({
    queryKey: ["study-notes"],
    queryFn: studyNotesApi.getMyNotes,
    staleTime: 30_000,
  });
}

export function useCreateStudyNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note) => studyNotesApi.createNote(note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study-notes"] }),
  });
}

export function useUpdateStudyNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, updates }) => studyNotesApi.updateNote(noteId, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study-notes"] }),
  });
}

export function useDeleteStudyNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId) => studyNotesApi.deleteNote(noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study-notes"] }),
  });
}
