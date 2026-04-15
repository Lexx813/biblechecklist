import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import CustomSelect from "../../../components/CustomSelect";
import ConfirmModal from "../../../components/ConfirmModal";
import RichTextEditor from "../../../components/RichTextEditor";
import Button from "../../../components/ui/Button";
import { BOOKS } from "../../../data/books";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "../../../hooks/useNotes";
import { sanitizeRich } from "../../../lib/sanitize";
import { formatDate } from "../../../utils/formatters";

const OT_COUNT = 39;

interface Props {
  userId: string;
}

/* ── Note Form ──────────────────────────────────────────── */

function NoteForm({ userId, initial = null, onDone }: { userId: string; initial?: any; onDone: () => void }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] ?? "en";
  const [bookIndex, setBookIndex] = useState(initial?.book_index ?? 0);
  const [chapter, setChapter] = useState(initial?.chapter ?? 1);
  const [verse, setVerse] = useState(initial?.verse ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  const createNote = useCreateNote(userId);
  const updateNote = useUpdateNote(userId);
  const busy = createNote.isPending || updateNote.isPending;
  const maxChapter = BOOKS[bookIndex]?.chapters ?? 1;

  function handleBookChange(val: number | string) {
    setBookIndex(Number(val));
    setChapter(1);
  }

  function handleSubmit() {
    // Strip HTML tags to check if content is empty
    const stripped = content.replace(/<[^>]*>/g, "").trim();
    if (!stripped) return;
    const payload = { book_index: bookIndex, chapter, verse: verse.trim() || null, content, lang };
    if (initial) {
      updateNote.mutate({ noteId: initial.id, updates: payload }, { onSuccess: onDone });
    } else {
      createNote.mutate(payload, { onSuccess: onDone });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Book / Chapter / Verse selectors */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 max-[480px]:grid-cols-1">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {t("profile.bookLabel")}
          </label>
          <CustomSelect
            value={bookIndex}
            onChange={handleBookChange}
            options={BOOKS.map((b, i) => ({ value: i, label: t(`bookNames.${i}`, b.name) }))}
            searchable
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {t("profile.chapterLabel")}
          </label>
          <CustomSelect
            value={chapter}
            onChange={setChapter}
            options={Array.from({ length: maxChapter }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
            className="cs-wrap--sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {t("profile.verseLabel")} <span className="font-normal normal-case text-[var(--text-muted)] opacity-60">({t("profile.verseOptional")})</span>
          </label>
          <input
            name="verse"
            className="h-[38px] w-[72px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
            type="text"
            placeholder="—"
            value={verse}
            onChange={e => setVerse(e.target.value)}
          />
        </div>
      </div>

      {/* Rich text editor */}
      <RichTextEditor
        content={content}
        onChange={setContent}
        placeholder={t("profile.notePlaceholder")}
        minimal
        compact
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          {t("common.cancel")}
        </Button>
        <Button variant="primary" size="sm" onClick={handleSubmit} loading={busy} disabled={busy}>
          {initial ? t("profile.updateNote") : t("profile.saveNote")}
        </Button>
      </div>
    </div>
  );
}

/* ── Note Card ──────────────────────────────────────────── */

function NoteCard({ note, userId }: { note: any; userId: string }) {
  const [editing, setEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const deleteNote = useDeleteNote(userId);
  const { t } = useTranslation();
  const isOT = note.book_index < OT_COUNT;
  const bookName = t(`bookNames.${note.book_index}`, BOOKS[note.book_index]?.name);

  if (editing) {
    return (
      <div className="rounded-[var(--radius)] border border-[var(--accent)]/30 bg-[var(--card-bg)] p-4">
        <NoteForm userId={userId} initial={note} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className={`group rounded-[var(--radius)] border p-4 transition-colors ${
      isOT
        ? "border-amber-500/20 bg-amber-500/[0.03]"
        : "border-blue-500/20 bg-blue-500/[0.03]"
    }`}>
      {/* Header: book badge + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            isOT
              ? "bg-amber-500/15 text-amber-400"
              : "bg-blue-500/15 text-blue-400"
          }`}>
            {bookName}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {t("profile.chAbbr")} {note.chapter}
            {note.verse ? ` · ${t("profile.verseAbbr")} ${note.verse}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            className="cursor-pointer rounded-md border-none bg-transparent p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
            onClick={() => setEditing(true)}
            title={t("common.edit")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button
            className="cursor-pointer rounded-md border-none bg-transparent p-1.5 text-[var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-400"
            onClick={() => setShowConfirm(true)}
            title={t("common.delete")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="mt-2.5 text-sm leading-relaxed text-[var(--text-secondary)] [&_a]:text-[var(--accent)] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--accent)]/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[var(--text-muted)] [&_strong]:font-bold [&_strong]:text-[var(--text-primary)]"
        dangerouslySetInnerHTML={{ __html: sanitizeRich(note.content) }}
      />

      {/* Date */}
      <div className="mt-2 text-xs text-[var(--text-muted)]">
        {formatDate(note.created_at)}
      </div>

      {showConfirm && (
        <ConfirmModal
          message={t("profile.deleteNoteConfirm")}
          onConfirm={() => { deleteNote.mutate(note.id); setShowConfirm(false); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

/* ── Main NotesTab ──────────────────────────────────────── */

export default function NotesTab({ userId }: Props) {
  const { t } = useTranslation();
  const { data: notes = [], isLoading } = useNotes(userId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterBook, setFilterBook] = useState("all");
  const [search, setSearch] = useState("");

  const booksWithNotes = useMemo(
    () => [...new Set(notes.map((n: any) => n.book_index))].sort((a: number, b: number) => a - b),
    [notes]
  );

  const filtered = useMemo(() => notes.filter((n: any) => {
    if (filterBook !== "all" && n.book_index !== Number(filterBook)) return false;
    if (search) {
      const plain = n.content.replace(/<[^>]*>/g, "").toLowerCase();
      if (!plain.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [notes, filterBook, search]);

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          {t("profile.myNotes")}
        </h2>
        <Button
          variant={showAddForm ? "ghost" : "primary"}
          size="sm"
          onClick={() => setShowAddForm(v => !v)}
        >
          {showAddForm ? t("common.cancel") : `+ ${t("profile.addNote")}`}
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] p-4">
          <NoteForm userId={userId} onDone={() => setShowAddForm(false)} />
        </div>
      )}

      {/* Filters */}
      <div className="mt-4 flex items-center gap-2">
        <div className="w-[180px]">
          <CustomSelect
            value={filterBook}
            onChange={(v: string | number) => setFilterBook(String(v))}
            options={[
              { value: "all", label: t("profile.allBooks") },
              ...BOOKS.map((b, i) => ({ value: i, label: t(`bookNames.${i}`, b.name) })),
            ]}
          />
        </div>
        <input
          name="q"
          className="h-[38px] flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
          type="text"
          placeholder={t("profile.searchNotes")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search notes"
        />
      </div>

      {/* Notes list */}
      {isLoading ? (
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-[var(--radius)] border border-[var(--border)] p-4">
              <div className="flex gap-2">
                <div className="skeleton h-5 w-20 rounded-full" />
                <div className="skeleton h-4 w-16 rounded" />
              </div>
              <div className="skeleton mt-3 h-4 w-full rounded" />
              <div className="skeleton mt-2 h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
          {notes.length === 0 ? t("profile.noNotes") : t("profile.noNotesFilter")}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {filtered.map((note: any) => (
            <NoteCard key={note.id} note={note} userId={userId} />
          ))}
        </div>
      )}
    </div>
  );
}
