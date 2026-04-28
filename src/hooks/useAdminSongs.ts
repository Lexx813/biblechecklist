import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminSongsApi, type SongPatch, type SongCreateMeta } from "../api/adminSongs";

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["admin", "song-stats"] });
  qc.invalidateQueries({ queryKey: ["songs"] });
}

export function useUpdateSong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: SongPatch }) => adminSongsApi.patch(id, patch),
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteSong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminSongsApi.delete(id),
    onSuccess: () => invalidate(qc),
  });
}

export function useUploadSongAudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => adminSongsApi.uploadAudio(id, file),
    onSuccess: () => invalidate(qc),
  });
}

export function useCreateSong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      meta,
      lyricsMd,
      audio,
      lyricsEsMd,
    }: {
      meta: SongCreateMeta;
      lyricsMd: string;
      audio: File;
      lyricsEsMd?: string;
    }) => adminSongsApi.create(meta, lyricsMd, audio, lyricsEsMd),
    onSuccess: () => invalidate(qc),
  });
}
