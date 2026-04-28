import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useUpdateSong, useUploadSongAudio } from "../../hooks/useAdminSongs";
import type { JwOrgLink } from "../../api/songs";

export interface EditableSong {
  id: string;
  slug: string;
  title: string;
  title_es: string | null;
  description: string;
  description_es: string | null;
  primary_scripture_ref: string;
  primary_scripture_text: string;
  primary_scripture_text_es: string | null;
  theme: string;
  cover_image_url: string | null;
  duration_seconds: number;
  jw_org_links: JwOrgLink[];
  published: boolean;
}

interface Props {
  song: EditableSong;
  onClose: () => void;
}

export function SongEditModal({ song, onClose }: Props) {
  const update = useUpdateSong();
  const upload = useUploadSongAudio();

  const [form, setForm] = useState<EditableSong>(song);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [linksText, setLinksText] = useState(() => JSON.stringify(song.jw_org_links, null, 2));
  const [linksError, setLinksError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  function field<K extends keyof EditableSong>(key: K, value: EditableSong[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setLinksError(null);
    let parsedLinks: JwOrgLink[] = form.jw_org_links;
    if (linksText.trim()) {
      try {
        parsedLinks = JSON.parse(linksText);
        if (!Array.isArray(parsedLinks)) throw new Error("must be an array");
      } catch (e) {
        setLinksError(`Invalid JSON: ${(e as Error).message}`);
        return;
      }
    }

    try {
      if (audioFile) {
        await upload.mutateAsync({ id: form.id, file: audioFile });
        setAudioFile(null);
      }
      await update.mutateAsync({
        id: form.id,
        patch: {
          title: form.title,
          title_es: form.title_es,
          description: form.description,
          description_es: form.description_es,
          primary_scripture_ref: form.primary_scripture_ref,
          primary_scripture_text: form.primary_scripture_text,
          primary_scripture_text_es: form.primary_scripture_text_es,
          theme: form.theme,
          cover_image_url: form.cover_image_url,
          duration_seconds: form.duration_seconds,
          jw_org_links: parsedLinks,
          published: form.published,
        },
      });
      setSavedAt(Date.now());
    } catch (e) {
      // Mutations expose error via mutation state; nothing to do here.
      console.error(e);
    }
  }

  const busy = update.isPending || upload.isPending;
  const error = update.error?.message || upload.error?.message || linksError;

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="my-8 w-full max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Edit song</h3>
            <p className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">{form.slug}</p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full border-none bg-[var(--hover-bg)] text-[var(--text-muted)] transition-colors hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <Row label="Title">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => field("title", e.target.value)}
            />
          </Row>
          <Row label="Title (Spanish)">
            <input
              className={inputClass}
              value={form.title_es ?? ""}
              placeholder="optional"
              onChange={(e) => field("title_es", e.target.value || null)}
            />
          </Row>

          <Row label="Theme">
            <input
              className={inputClass}
              value={form.theme}
              onChange={(e) => field("theme", e.target.value)}
            />
          </Row>

          <Row label="Cover image URL">
            <input
              className={inputClass}
              value={form.cover_image_url ?? ""}
              placeholder="/covers/wash-me-clean.svg"
              onChange={(e) => field("cover_image_url", e.target.value || null)}
            />
          </Row>

          <Row label="Duration (seconds)">
            <input
              type="number"
              className={inputClass}
              value={form.duration_seconds}
              onChange={(e) => field("duration_seconds", Number(e.target.value) || 0)}
            />
          </Row>

          <Row label="Primary scripture ref">
            <input
              className={inputClass}
              value={form.primary_scripture_ref}
              onChange={(e) => field("primary_scripture_ref", e.target.value)}
            />
          </Row>

          <Row label="Primary scripture text">
            <textarea
              className={`${inputClass} min-h-[80px]`}
              value={form.primary_scripture_text}
              onChange={(e) => field("primary_scripture_text", e.target.value)}
            />
          </Row>

          <Row label="Description">
            <textarea
              className={`${inputClass} min-h-[100px]`}
              value={form.description}
              onChange={(e) => field("description", e.target.value)}
            />
          </Row>

          <Row label="Description (Spanish)">
            <textarea
              className={`${inputClass} min-h-[80px]`}
              value={form.description_es ?? ""}
              placeholder="optional"
              onChange={(e) => field("description_es", e.target.value || null)}
            />
          </Row>

          <Row label="jw_org_links (JSON)">
            <textarea
              className={`${inputClass} min-h-[120px] font-mono text-xs`}
              value={linksText}
              onChange={(e) => { setLinksText(e.target.value); setLinksError(null); }}
            />
          </Row>

          <Row label="Replace audio (mp3, ≤25MB)">
            <input
              type="file"
              accept="audio/mpeg,audio/mp3"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              className="text-sm text-[var(--text-primary)]"
            />
            {audioFile && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {audioFile.name} · {(audioFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </Row>

          <label className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => field("published", e.target.checked)}
            />
            <span className="text-sm font-semibold text-[var(--text-primary)]">Published</span>
          </label>
        </div>

        {error && (
          <div className="mx-5 mb-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}
        {savedAt && !error && !busy && (
          <div className="mx-5 mb-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            Saved.
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--hover-bg)]"
            disabled={busy}
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={busy}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const inputClass =
  "w-full rounded-md border border-[var(--border)] bg-[var(--input-bg,transparent)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</label>
      {children}
    </div>
  );
}
