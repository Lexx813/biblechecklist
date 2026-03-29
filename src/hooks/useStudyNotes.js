import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studyNotesApi } from "../api/studyNotes";

export function useStudyNotes() {
  return useQuery({
    queryKey: ["study-notes"],
    queryFn: studyNotesApi.getMyNotes,
    staleTime: 30_000,
  });
}

export function usePublicNotes() {
  return useQuery({
    queryKey: ["study-notes-public"],
    queryFn: studyNotesApi.getPublicNotes,
    staleTime: 60_000,
  });
}

export function useToggleNoteLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId) => studyNotesApi.toggleLike(noteId),
    onMutate: async (noteId) => {
      await qc.cancelQueries({ queryKey: ["study-notes-public"] });
      const prev = qc.getQueryData(["study-notes-public"]);
      qc.setQueryData(["study-notes-public"], (old = []) =>
        old.map(n => n.id === noteId
          ? { ...n, user_has_liked: !n.user_has_liked, like_count: n.like_count + (n.user_has_liked ? -1 : 1) }
          : n
        )
      );
      return { prev };
    },
    onError: (_err, _noteId, ctx) => {
      if (ctx?.prev) qc.setQueryData(["study-notes-public"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["study-notes-public"] }),
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

// ── Folders ───────────────────────────────────────────────────────────────────

export function useNoteFolders() {
  return useQuery({
    queryKey: ["note-folders"],
    queryFn: studyNotesApi.getFolders,
    staleTime: 60_000,
  });
}

export function useCreateNoteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name) => studyNotesApi.createFolder(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["note-folders"] }),
  });
}

export function useRenameNoteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, name }) => studyNotesApi.renameFolder(folderId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["note-folders"] }),
  });
}

export function useDeleteNoteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (folderId) => studyNotesApi.deleteFolder(folderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["note-folders"] });
      qc.invalidateQueries({ queryKey: ["study-notes"] });
    },
  });
}
