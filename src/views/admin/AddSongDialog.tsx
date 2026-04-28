import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCreateSong } from "../../hooks/useAdminSongs";
import type { SongFormPrefill } from "../../hooks/useAIChat";

interface Props {
  onClose: () => void;
  onCreated?: (id: string) => void;
  /** Prefilled by the admin AI tool (prefill_song_form). */
  initialValues?: SongFormPrefill | null;
}

const LYRICS_TEMPLATE = `### [Intro]

(line)

### [Verse 1]

(lines)

### [Chorus]

(lines)`;

export function AddSongDialog({ onClose, onCreated, initialValues }: Props) {
  const create = useCreateSong();

  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [theme, setTheme] = useState(initialValues?.theme ?? "");
  const [scriptureRef, setScriptureRef] = useState(initialValues?.primary_scripture_ref ?? "");
  const [scriptureText, setScriptureText] = useState(initialValues?.primary_scripture_text ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [coverUrl, setCoverUrl] = useState("");
  const [durationStr, setDurationStr] = useState(String(initialValues?.duration_seconds ?? 240));
  const [linksText, setLinksText] = useState(
    initialValues?.jw_org_links ? JSON.stringify(initialValues.jw_org_links, null, 2) : "[]",
  );
  const [lyricsMd, setLyricsMd] = useState(initialValues?.lyrics_md ?? LYRICS_TEMPLATE);
  const [audio, setAudio] = useState<File | null>(null);
  const [publish, setPublish] = useState(initialValues?.publish === true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  function autoSlug(t: string): string {
    return t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  async function handleSubmit() {
    setError(null);
    if (!slug || !title || !theme || !scriptureRef || !scriptureText || !description) {
      return setError("All fields except cover URL and duration are required.");
    }
    if (!audio) return setError("Please pick an mp3 file.");
    let parsedLinks: { url: string; anchor: string }[] = [];
    if (linksText.trim()) {
      try {
        parsedLinks = JSON.parse(linksText);
        if (!Array.isArray(parsedLinks)) throw new Error("must be an array");
      } catch (e) {
        return setError(`jw_org_links: ${(e as Error).message}`);
      }
    }
    try {
      const { id } = await create.mutateAsync({
        meta: {
          slug, title, theme,
          primary_scripture_ref: scriptureRef,
          primary_scripture_text: scriptureText,
          description,
          cover_image_url: coverUrl || null,
          duration_seconds: Number(durationStr) || 240,
          jw_org_links: parsedLinks,
          published: publish,
        },
        lyricsMd,
        audio,
      });
      onCreated?.(id);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const busy = create.isPending;

  return createPortal(
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[80dvh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="text-base font-bold text-[var(--text-primary)]">Add a new song</h3>
          <button
            onClick={onClose}
            className="flex size-7 cursor-pointer items-center justify-center rounded-full border-none bg-[var(--hover-bg)] text-[var(--text-muted)] transition-colors hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2.5">
            <Row label="Title">
              <input
                className={inputClass}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slug) setSlug(autoSlug(e.target.value));
                }}
              />
            </Row>
            <Row label="Slug">
              <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from title" />
            </Row>
          </div>

          <div className="grid grid-cols-[1fr_100px] gap-2.5">
            <Row label="Theme">
              <input className={inputClass} value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="mercy, hope" />
            </Row>
            <Row label="Duration (s)">
              <input type="number" className={inputClass} value={durationStr} onChange={(e) => setDurationStr(e.target.value)} />
            </Row>
          </div>

          <Row label="Primary scripture ref">
            <input className={inputClass} value={scriptureRef} onChange={(e) => setScriptureRef(e.target.value)} placeholder="Psalm 51:1" />
          </Row>
          <Row label="Primary scripture text (NWT)">
            <textarea className={`${inputClass} min-h-16`} value={scriptureText} onChange={(e) => setScriptureText(e.target.value)} />
          </Row>

          <Row label="Description">
            <textarea className={`${inputClass} min-h-20`} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Row>

          <Row label="Cover image URL (optional)">
            <input className={inputClass} value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="/covers/..." />
          </Row>

          <Row label="Lyrics — markdown with ### [Section] headings">
            <textarea className={`${inputClass} min-h-40 font-mono text-xs leading-relaxed`} value={lyricsMd} onChange={(e) => setLyricsMd(e.target.value)} />
          </Row>

          <Row label="jw_org_links (JSON)">
            <textarea className={`${inputClass} min-h-16 font-mono text-xs leading-relaxed`} value={linksText} onChange={(e) => setLinksText(e.target.value)} />
          </Row>

          <Row label="Audio (mp3, ≤25MB)">
            <input
              type="file"
              accept="audio/mpeg,audio/mp3"
              onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
              className="text-xs text-[var(--text-primary)]"
            />
            {audio && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {audio.name} · {(audio.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </Row>

          <label className="flex items-center gap-2 pt-0.5">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            <span className="text-xs font-semibold text-[var(--text-primary)]">Publish immediately (otherwise draft)</span>
          </label>
        </div>

        {error && (
          <div className="mx-6 mb-3 shrink-0 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border)] px-6 py-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-md border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--hover-bg)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-60"
          >
            {busy ? "Uploading…" : "Create song"}
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
