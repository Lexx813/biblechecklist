import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studyNotesApi } from "../api/studyNotes";
import { badgesApi } from "../api/badges";

interface StudyNotePublic {
  id: string;
  user_has_liked: boolean;
  like_count: number;
  [key: string]: unknown;
}

export function useStudyNotes() {
  return useQuery({
    queryKey: ["study-notes"],
    queryFn: studyNotesApi.getMyNotes,
    staleTime: 30_000,
  });
}

export function usePublicNotes(lang?: string) {
  return useQuery({
    queryKey: ["study-notes-public", lang],
    queryFn: () => studyNotesApi.getPublicNotes(lang),
    staleTime: 60_000,
  });
}

export function useToggleNoteLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => studyNotesApi.toggleLike(noteId),
    onMutate: async (noteId: string) => {
      await qc.cancelQueries({ queryKey: ["study-notes-public"] });
      const prev = qc.getQueryData(["study-notes-public"]);
      qc.setQueryData(["study-notes-public"], (old: StudyNotePublic[] = []) =>
        old.map(n => n.id === noteId
          ? { ...n, user_has_liked: !n.user_has_liked, like_count: n.like_count + (n.user_has_liked ? -1 : 1) }
          : n
        )
      );
      return { prev };
    },
    onError: (_err: unknown, _noteId: string, ctx: { prev: unknown } | undefined) => {
      if (ctx?.prev) qc.setQueryData(["study-notes-public"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["study-notes-public"] }),
  });
}

export function useCreateStudyNote(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: Record<string, unknown>) => studyNotesApi.createNote(note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-notes"] });
      if (userId) badgesApi.awardBadge(userId, "first_note");
    },
  });
}

export function useUpdateStudyNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, updates }: { noteId: string; updates: Record<string, unknown> }) =>
      studyNotesApi.updateNote(noteId, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study-notes"] }),
  });
}

export function useDeleteStudyNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => studyNotesApi.deleteNote(noteId),
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
    mutationFn: (name: string) => studyNotesApi.createFolder(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["note-folders"] }),
  });
}

export function useRenameNoteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, name }: { folderId: string; name: string }) =>
      studyNotesApi.renameFolder(folderId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["note-folders"] }),
  });
}

export function useDeleteNoteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (folderId: string) => studyNotesApi.deleteFolder(folderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["note-folders"] });
      qc.invalidateQueries({ queryKey: ["study-notes"] });
    },
  });
}
