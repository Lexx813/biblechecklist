import { useState, useMemo } from "react";
import PageNav from "../PageNav";
import RichTextEditor from "../RichTextEditor";
import AICompanion from "../AICompanion";
import { useFullProfile } from "../../hooks/useAdmin";
import { BOOKS } from "../../data/books";
import {
  useStudyNotes,
  useCreateStudyNote,
  useUpdateStudyNote,
  useDeleteStudyNote,
} from "../../hooks/useStudyNotes";
import "../../styles/study-notes.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function passageLabel(note) {
  if (note.book_index == null) return null;
  const book = BOOKS[note.book_index]?.name ?? "Unknown";
  let label = book;
  if (note.chapter) label += ` ${note.chapter}`;
  if (note.verse) label += `:${note.verse}`;
  return label;
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const EMPTY_NOTE = { title: "", content: "", tags: [], book_index: null, chapter: null, verse: "", is_public: false };

// ── Tag input ─────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState("");

  function add() {
    const val = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (!val || tags.includes(val)) { setInput(""); return; }
    onChange([...tags, val]);
    setInput("");
  }

  function remove(tag) {
    onChange(tags.filter(t => t !== tag));
  }

  return (
    <div className="sn-tag-input">
      <div className="sn-tag-pills">
        {tags.map(tag => (
          <span key={tag} className="sn-tag-pill">
            #{tag}
            <button type="button" className="sn-tag-remove" onClick={() => remove(tag)}>×</button>
          </span>
        ))}
      </div>
      <div className="sn-tag-row">
        <input
          className="sn-tag-field"
          placeholder="Add tag…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          maxLength={30}
        />
        <button type="button" className="sn-tag-add-btn" onClick={add}>Add</button>
      </div>
    </div>
  );
}

// ── Note editor ───────────────────────────────────────────────────────────────

function NoteEditor({ note, onSave, onCancel, saving, isAdmin }) {
  const [form, setForm] = useState(note ?? EMPTY_NOTE);
  const maxChapter = form.book_index != null ? (BOOKS[form.book_index]?.chapters ?? 1) : 1;

  function set(field, val) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() && !stripHtml(form.content)) return;
    onSave(form);
  }

  return (
    <form className="sn-editor" onSubmit={handleSubmit}>
      <div className="sn-editor-header">
        <button type="button" className="sn-back-btn" onClick={onCancel}>← Back</button>
        <h2 className="sn-editor-title">{note ? "Edit Note" : "New Note"}</h2>
      </div>

      <div className="sn-editor-body">
        <label className="sn-label">Title</label>
        <input
          className="sn-input"
          placeholder="Note title…"
          value={form.title}
          onChange={e => set("title", e.target.value)}
          maxLength={120}
        />

        <label className="sn-label">Passage <span className="sn-optional">(optional)</span></label>
        <div className="sn-passage-row">
          <select
            className="sn-select"
            value={form.book_index ?? ""}
            onChange={e => {
              const bi = e.target.value === "" ? null : Number(e.target.value);
              setForm(prev => ({ ...prev, book_index: bi, chapter: bi != null ? 1 : null }));
            }}
          >
            <option value="">— Book —</option>
            {BOOKS.map((b, i) => <option key={i} value={i}>{b.name}</option>)}
          </select>

          {form.book_index != null && (
            <select
              className="sn-select sn-select--sm"
              value={form.chapter ?? 1}
              onChange={e => set("chapter", Number(e.target.value))}
            >
              {Array.from({ length: maxChapter }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          )}

          {form.book_index != null && (
            <input
              className="sn-select sn-select--xs"
              placeholder="Verse"
              value={form.verse ?? ""}
              onChange={e => set("verse", e.target.value)}
              maxLength={10}
            />
          )}
        </div>

        <label className="sn-label">Tags</label>
        <TagInput tags={form.tags ?? []} onChange={val => set("tags", val)} />

        <label className="sn-label">Content</label>
        <div className="sn-editor-rich">
          <RichTextEditor
            content={form.content}
            onChange={val => set("content", val)}
            placeholder="Write your study note here…"
          />
        </div>

        {isAdmin && form.book_index != null && (
          <AICompanion
            reference={passageLabel(form)}
            passage={`${BOOKS[form.book_index]?.name ?? ""} chapter ${form.chapter ?? 1}${form.verse ? ` verse ${form.verse}` : ""}`}
            className="sn-ai-companion"
          />
        )}

        <div className="sn-editor-footer">
          <label className="sn-public-toggle">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={e => set("is_public", e.target.checked)}
            />
            <span>Make public</span>
          </label>
          <div className="sn-editor-actions">
            <button type="button" className="sn-cancel-btn" onClick={onCancel}>Cancel</button>
            <button
              type="submit"
              className="sn-save-btn"
              disabled={saving || (!form.title.trim() && !stripHtml(form.content))}
            >
              {saving ? "Saving…" : "Save Note"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

// ── Note card ─────────────────────────────────────────────────────────────────

function NoteCard({ note, onClick, onDelete }) {
  const passage = passageLabel(note);
  const preview = stripHtml(note.content).slice(0, 140);

  return (
    <div className="sn-card" onClick={onClick}>
      <div className="sn-card-header">
        <h3 className="sn-card-title">{note.title || "Untitled Note"}</h3>
        <button
          className="sn-card-delete"
          onClick={e => { e.stopPropagation(); onDelete(note.id); }}
          title="Delete"
        >✕</button>
      </div>
      {passage && <span className="sn-card-passage">📖 {passage}</span>}
      {preview && <p className="sn-card-preview">{preview}{preview.length >= 140 ? "…" : ""}</p>}
      <div className="sn-card-footer">
        <div className="sn-card-tags">
          {(note.tags ?? []).slice(0, 4).map(tag => (
            <span key={tag} className="sn-tag-chip">#{tag}</span>
          ))}
        </div>
        <span className="sn-card-date">{formatDate(note.updated_at)}</span>
      </div>
      {note.is_public && <span className="sn-public-badge">Public</span>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StudyNotesPage({ user, navigate, ...sharedNav }) {
  const { data: notes = [], isLoading } = useStudyNotes();
  const createNote = useCreateStudyNote();
  const updateNote = useUpdateStudyNote();
  const deleteNote = useDeleteStudyNote();
  const { data: profile } = useFullProfile(user?.id);
  const isAdmin = profile?.is_admin;

  const [editing, setEditing] = useState(null); // null | "new" | note object
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);

  const allTags = useMemo(() => {
    const set = new Set();
    notes.forEach(n => (n.tags ?? []).forEach(t => set.add(t)));
    return [...set].sort();
  }, [notes]);

  const filtered = useMemo(() => {
    let list = notes;
    if (activeTag) list = list.filter(n => (n.tags ?? []).includes(activeTag));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(n =>
        (n.title ?? "").toLowerCase().includes(q) ||
        stripHtml(n.content).toLowerCase().includes(q) ||
        (n.tags ?? []).some(t => t.includes(q))
      );
    }
    return list;
  }, [notes, search, activeTag]);

  function handleSave(form) {
    const payload = {
      title: form.title.trim() || null,
      content: form.content || null,
      tags: form.tags ?? [],
      book_index: form.book_index,
      chapter: form.chapter,
      verse: form.verse?.trim() || null,
      is_public: form.is_public,
    };

    if (editing && editing !== "new") {
      updateNote.mutate({ noteId: editing.id, updates: payload }, { onSuccess: () => setEditing(null) });
    } else {
      createNote.mutate(payload, { onSuccess: () => setEditing(null) });
    }
  }

  function handleDelete(noteId) {
    if (!confirm("Delete this note?")) return;
    deleteNote.mutate(noteId);
  }

  if (editing) {
    return (
      <div className="sn-page">
        <PageNav {...sharedNav} user={user} navigate={navigate} />
        <NoteEditor
          note={editing === "new" ? null : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={createNote.isPending || updateNote.isPending}
          isAdmin={isAdmin}
        />
      </div>
    );
  }

  return (
    <div className="sn-page">
      <PageNav {...sharedNav} user={user} navigate={navigate} />

      <div className="sn-header">
        <button className="sn-nav-back" onClick={() => navigate("home")}>← Home</button>
        <div className="sn-header-row">
          <div>
            <h1 className="sn-title">Study Notes</h1>
            <p className="sn-subtitle">Your personal Bible study library</p>
          </div>
          <button className="sn-new-btn" onClick={() => setEditing("new")}>+ New Note</button>
        </div>
      </div>

      <div className="sn-controls">
        <input
          className="sn-search"
          type="search"
          placeholder="Search notes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {allTags.length > 0 && (
          <div className="sn-tag-filter">
            <button
              className={`sn-filter-chip${!activeTag ? " sn-filter-chip--active" : ""}`}
              onClick={() => setActiveTag(null)}
            >All</button>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`sn-filter-chip${activeTag === tag ? " sn-filter-chip--active" : ""}`}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="sn-content">
        {isLoading ? (
          <p className="sn-empty">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="sn-empty-state">
            <span className="sn-empty-icon">📝</span>
            {notes.length === 0 ? (
              <>
                <p>You haven't written any study notes yet.</p>
                <button className="sn-new-btn" onClick={() => setEditing("new")}>Write Your First Note</button>
              </>
            ) : (
              <p>No notes match your search.</p>
            )}
          </div>
        ) : (
          <div className="sn-grid">
            {filtered.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => setEditing(note)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
