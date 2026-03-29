import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../../components/PageNav";
import ConfirmModal from "../../components/ConfirmModal";
import CustomSelect from "../../components/CustomSelect";
import RichTextEditor from "../../components/RichTextEditor";
import AICompanion from "../../components/AICompanion";
import { useAISkill } from "../../hooks/useAISkill";
import { useSubscription } from "../../hooks/useSubscription";
import { BOOKS } from "../../data/books";
import "../../styles/ai-tools.css";
import {
  useStudyNotes,
  usePublicNotes,
  useCreateStudyNote,
  useUpdateStudyNote,
  useDeleteStudyNote,
  useNoteFolders,
  useCreateNoteFolder,
  useRenameNoteFolder,
  useDeleteNoteFolder,
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

const EMPTY_NOTE = { title: "", content: "", tags: [], book_index: null, chapter: null, verse: "", is_public: false, folder_id: null };

// ── Export helpers ────────────────────────────────────────────────────────────

function exportAsMarkdown(note) {
  const passage = passageLabel(note);
  const lines = [];
  if (note.title) lines.push(`# ${note.title}`, "");
  if (passage) lines.push(`**Passage:** ${passage}`, "");
  if (note.tags?.length) lines.push(`**Tags:** ${note.tags.map(t => `#${t}`).join(" ")}`, "");
  if (note.content) lines.push(stripHtml(note.content));
  lines.push("", `*Updated: ${formatDate(note.updated_at)}*`);
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(note.title || "note").replace(/[^a-z0-9]/gi, "_")}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportAsPrint(note) {
  const passage = passageLabel(note);
  const win = window.open("", "_blank");
  win.document.write(`<!DOCTYPE html><html><head><title>${note.title || "Note"}</title>
  <style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#111}
  h1{font-size:1.6em;margin-bottom:4px}
  .meta{color:#666;font-size:.9em;margin-bottom:16px}
  .tags span{background:#eee;padding:2px 8px;border-radius:12px;font-size:.8em;margin-right:4px}
  .content{line-height:1.7;margin-top:16px}
  @media print{body{margin:20px}}</style></head><body>
  ${note.title ? `<h1>${note.title}</h1>` : ""}
  <div class="meta">${[passage, formatDate(note.updated_at)].filter(Boolean).join(" · ")}</div>
  ${note.tags?.length ? `<div class="tags">${note.tags.map(t => `<span>#${t}</span>`).join("")}</div>` : ""}
  <div class="content">${note.content || ""}</div>
  </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

// ── Tag input ─────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }) {
  const { t } = useTranslation();
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
          placeholder={t("studyNotes.addTag")}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
          maxLength={30}
        />
        <button type="button" className="sn-tag-add-btn" onClick={add}>{t("studyNotes.add")}</button>
      </div>
    </div>
  );
}

// ── AI Enhance Note widget ────────────────────────────────────────────────────

function EnhanceNoteWidget({ noteContent, passage }) {
  const { text, loading, error, run, reset } = useAISkill();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (ref.current && text) ref.current.scrollTop = ref.current.scrollHeight; }, [text]);

  function handleEnhance() {
    const note = noteContent?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!note) return;
    run("enhance_note", { note: note.slice(0, 1000), passage: passage || undefined });
  }

  return (
    <div className="ait-inline">
      <div className="ait-inline-header" onClick={() => setOpen(o => !o)}>
        <span className="ait-inline-title">✨ Enhance Note with AI</span>
        <span className={`ait-inline-chevron${open ? " ait-inline-chevron--open" : ""}`}>▼</span>
      </div>
      {open && (
        <div className="ait-inline-body">
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted,#888)", margin: "0 0 0.75rem" }}>
            AI will enrich your note with scriptural context, original word meanings, and application questions.
          </p>
          <button
            className="ait-submit-btn"
            onClick={handleEnhance}
            disabled={loading || !noteContent?.replace(/<[^>]+>/g, "").trim()}
          >
            {loading ? "Enhancing…" : "✦ Enhance My Note"}
          </button>
          {(loading || text || error) && (
            <div className="ait-result" style={{ marginTop: "0.75rem" }}>
              <div className="ait-result-header">
                <span className="ait-result-label">AI Enhancement</span>
                {!loading && (text || error) && <button className="ait-result-clear" onClick={reset}>Clear</button>}
              </div>
              <div className="ait-result-body" ref={ref}>
                {loading && !text && (
                  <div className="ait-loading">
                    <span className="ait-dot" /><span className="ait-dot" /><span className="ait-dot" />
                    <span className="ait-loading-label">Thinking…</span>
                  </div>
                )}
                {error && <div className="ait-error">{error}</div>}
                {text && <div className="ait-response-text">{text}{loading && <span className="ait-cursor" />}</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Note editor ───────────────────────────────────────────────────────────────

function NoteEditor({ note, folders, onSave, onCancel, saving, isAdmin }) {
  const { t } = useTranslation();
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
        <button type="button" className="sn-back-btn" onClick={onCancel}>{t("common.back")}</button>
        <h2 className="sn-editor-title">{note ? t("studyNotes.editNote") : t("studyNotes.newNoteTitle")}</h2>
        {note && (
          <div className="sn-editor-export">
            <button type="button" className="sn-export-btn" onClick={() => exportAsMarkdown(note)} title={t("studyNotes.exportMarkdown")}>⬇ .md</button>
            <button type="button" className="sn-export-btn" onClick={() => exportAsPrint(note)} title={t("studyNotes.exportPdf")}>🖨 PDF</button>
          </div>
        )}
      </div>

      <div className="sn-editor-body">
        <label className="sn-label">{t("studyNotes.fieldTitle")}</label>
        <input
          className="sn-input"
          placeholder="Note title…"
          value={form.title}
          onChange={e => set("title", e.target.value)}
          maxLength={120}
        />

        {folders.length > 0 && (
          <>
            <label className="sn-label">{t("studyNotes.folder")}</label>
            <CustomSelect
              value={form.folder_id ?? ""}
              onChange={v => set("folder_id", v || null)}
              options={[
                { value: "", label: t("studyNotes.noFolder") },
                ...folders.map(f => ({ value: f.id, label: f.name })),
              ]}
            />
          </>
        )}

        <label className="sn-label">{t("studyNotes.fieldPassage")} <span className="sn-optional">{t("studyNotes.fieldPassageOptional")}</span></label>
        <div className="sn-passage-row">
          <CustomSelect
            value={form.book_index}
            onChange={bi => setForm(prev => ({ ...prev, book_index: bi, chapter: bi != null ? 1 : null }))}
            options={[{ value: null, label: t("studyNotes.fieldBook") }, ...BOOKS.map((b, i) => ({ value: i, label: b.name }))]}
            placeholder={t("studyNotes.fieldBook")}
            searchable
          />

          {form.book_index != null && (
            <CustomSelect
              value={form.chapter ?? 1}
              onChange={val => set("chapter", val)}
              options={Array.from({ length: maxChapter }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
              className="cs-wrap--sm"
            />
          )}

          {form.book_index != null && (
            <input
              className="sn-verse-input"
              placeholder={t("studyNotes.fieldVerse")}
              value={form.verse ?? ""}
              onChange={e => set("verse", e.target.value)}
              maxLength={10}
            />
          )}
        </div>

        <label className="sn-label">{t("studyNotes.fieldTags")}</label>
        <TagInput tags={form.tags ?? []} onChange={val => set("tags", val)} />

        <label className="sn-label">{t("studyNotes.fieldContent")}</label>
        <div className="sn-editor-rich">
          <RichTextEditor
            content={form.content}
            onChange={val => set("content", val)}
            placeholder={t("studyNotes.contentPlaceholder")}
          />
        </div>

        <EnhanceNoteWidget
          noteContent={form.content}
          passage={passageLabel(form) ?? undefined}
        />

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
            <span>{t("studyNotes.makePublic")}</span>
          </label>
          <div className="sn-editor-actions">
            <button type="button" className="sn-cancel-btn" onClick={onCancel}>{t("common.cancel")}</button>
            <button
              type="submit"
              className="sn-save-btn"
              disabled={saving || (!form.title.trim() && !stripHtml(form.content))}
            >
              {saving ? t("common.saving") : t("studyNotes.saveNote")}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

// ── Note card ─────────────────────────────────────────────────────────────────

function NoteCard({ note, onClick, onDelete, onExportMd, onExportPdf, showAuthor }) {
  const { t } = useTranslation();
  const passage = passageLabel(note);
  const preview = stripHtml(note.content).slice(0, 140);

  return (
    <div className="sn-card" onClick={onClick}>
      <div className="sn-card-header">
        <h3 className="sn-card-title">{note.title || t("studyNotes.untitled")}</h3>
        {onDelete && (
          <button
            className="sn-card-delete"
            onClick={e => { e.stopPropagation(); onDelete(note.id); }}
            title={t("common.delete")}
          >✕</button>
        )}
      </div>
      {showAuthor && note.author && (
        <span className="sn-card-author">👤 {note.author.display_name}</span>
      )}
      {passage && <span className="sn-card-passage">📖 {passage}</span>}
      {preview && <p className="sn-card-preview">{preview}{preview.length >= 140 ? "…" : ""}</p>}
      <div className="sn-card-footer">
        <div className="sn-card-tags">
          {(note.tags ?? []).slice(0, 4).map(tag => (
            <span key={tag} className="sn-tag-chip">#{tag}</span>
          ))}
        </div>
        <div className="sn-card-actions">
          {onExportMd && (
            <button className="sn-card-export-btn" onClick={e => { e.stopPropagation(); onExportMd(note); }} title={t("studyNotes.exportMarkdown")}>⬇</button>
          )}
          <span className="sn-card-date">{formatDate(note.updated_at)}</span>
        </div>
      </div>
      {note.is_public && <span className="sn-public-badge">{t("studyNotes.public")}</span>}
    </div>
  );
}

// ── Folder sidebar ────────────────────────────────────────────────────────────

function FolderSidebar({ folders, activeFolder, onSelect, onCreate, onRename, onDelete }) {
  const { t } = useTranslation();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");

  function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreate(newName.trim());
    setNewName("");
    setCreating(false);
  }

  function handleRename(e, folderId) {
    e.preventDefault();
    if (!renameVal.trim()) { setRenamingId(null); return; }
    onRename(folderId, renameVal.trim());
    setRenamingId(null);
  }

  return (
    <div className="sn-folders">
      <div className="sn-folder-header">
        <span className="sn-folder-title">{t("studyNotes.folders")}</span>
        <button className="sn-folder-add-btn" onClick={() => setCreating(v => !v)} title={t("studyNotes.newFolder")}>+</button>
      </div>

      {creating && (
        <form className="sn-folder-create" onSubmit={handleCreate}>
          <input
            className="sn-folder-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={t("studyNotes.folderName")}
            autoFocus
            maxLength={40}
          />
          <button type="submit" className="sn-folder-save-btn">✓</button>
          <button type="button" className="sn-folder-cancel-btn" onClick={() => setCreating(false)}>✕</button>
        </form>
      )}

      <button
        className={`sn-folder-item${activeFolder === null ? " sn-folder-item--active" : ""}`}
        onClick={() => onSelect(null)}
      >
        📁 {t("studyNotes.allNotes")}
      </button>

      {folders.map(f => (
        <div key={f.id} className="sn-folder-row">
          {renamingId === f.id ? (
            <form className="sn-folder-rename" onSubmit={e => handleRename(e, f.id)}>
              <input
                className="sn-folder-input"
                value={renameVal}
                onChange={e => setRenameVal(e.target.value)}
                autoFocus
                maxLength={40}
              />
              <button type="submit" className="sn-folder-save-btn">✓</button>
              <button type="button" className="sn-folder-cancel-btn" onClick={() => setRenamingId(null)}>✕</button>
            </form>
          ) : (
            <>
              <button
                className={`sn-folder-item${activeFolder === f.id ? " sn-folder-item--active" : ""}`}
                onClick={() => onSelect(f.id)}
              >
                📂 {f.name}
              </button>
              <button className="sn-folder-edit-btn" onClick={() => { setRenamingId(f.id); setRenameVal(f.name); }} title={t("common.edit")}>✎</button>
              <button className="sn-folder-del-btn" onClick={() => onDelete(f.id)} title={t("common.delete")}>✕</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Styled prompt modal ───────────────────────────────────────────────────────

function PromptModal({ label, onConfirm, onCancel }) {
  const [val, setVal] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  function handleSubmit(e) {
    e.preventDefault();
    if (val.trim()) onConfirm(val.trim());
  }
  return createPortal(
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <form className="confirm-body" onSubmit={handleSubmit}>
          <div className="confirm-title">{label}</div>
          <input
            ref={inputRef}
            className="sn-prompt-input"
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder={label}
          />
        </form>
        <div className="confirm-actions">
          <button className="confirm-cancel-btn" type="button" onClick={onCancel}>Cancel</button>
          <button
            className="confirm-ok-btn"
            type="button"
            disabled={!val.trim()}
            onClick={() => val.trim() && onConfirm(val.trim())}
          >OK</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const SORT_OPTIONS = ["updated", "created", "title"];

export default function StudyNotesPage({ user, navigate, ...sharedNav }) {
  const { t } = useTranslation();
  const { data: notes = [], isLoading } = useStudyNotes();
  const { data: publicNotes = [], isLoading: loadingPublic } = usePublicNotes();
  const { data: folders = [] } = useNoteFolders();
  const createNote = useCreateStudyNote();
  const updateNote = useUpdateStudyNote();
  const deleteNote = useDeleteStudyNote();
  const createFolder = useCreateNoteFolder();
  const renameFolder = useRenameNoteFolder();
  const deleteFolder = useDeleteNoteFolder();
  const { isPremium } = useSubscription(user?.id);

  const [tab, setTab] = useState("mine"); // "mine" | "public"
  const [editing, setEditing] = useState(() => {
    try {
      const saved = sessionStorage.getItem("sn:editing");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [search, setSearch] = useState("");
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [sortBy, setSortBy] = useState("updated");
  const [showFolderPrompt, setShowFolderPrompt] = useState(false);

  // Persist editor state across reloads
  useEffect(() => {
    try {
      if (editing !== null) {
        sessionStorage.setItem("sn:editing", JSON.stringify(editing));
      } else {
        sessionStorage.removeItem("sn:editing");
      }
    } catch {}
  }, [editing]);

  // Upgrade restored note stub with fresh data once notes load
  useEffect(() => {
    if (!editing || editing === "new" || !notes.length) return;
    const fresh = notes.find(n => n.id === editing.id);
    if (fresh) setEditing(fresh);
  }, [notes]);

  const allTags = useMemo(() => {
    const set = new Set();
    notes.forEach(n => (n.tags ?? []).forEach(t => set.add(t)));
    return [...set].sort();
  }, [notes]);

  const filtered = useMemo(() => {
    let list = notes;
    if (activeFolder !== undefined && activeFolder !== null) {
      list = list.filter(n => n.folder_id === activeFolder);
    }
    if (activeTag) list = list.filter(n => (n.tags ?? []).includes(activeTag));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(n =>
        (n.title ?? "").toLowerCase().includes(q) ||
        stripHtml(n.content).toLowerCase().includes(q) ||
        (n.tags ?? []).some(t => t.includes(q))
      );
    }
    if (sortBy === "created") list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortBy === "title") list = [...list].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    return list;
  }, [notes, search, activeTag, activeFolder, sortBy]);

  const filteredPublic = useMemo(() => {
    if (!search.trim()) return publicNotes;
    const q = search.toLowerCase();
    return publicNotes.filter(n =>
      (n.title ?? "").toLowerCase().includes(q) ||
      stripHtml(n.content).toLowerCase().includes(q) ||
      (n.tags ?? []).some(t => t.includes(q))
    );
  }, [publicNotes, search]);

  function handleSave(form) {
    const payload = {
      title: form.title.trim() || null,
      content: form.content || null,
      tags: form.tags ?? [],
      book_index: form.book_index,
      chapter: form.chapter,
      verse: form.verse?.trim() || null,
      is_public: form.is_public,
      folder_id: form.folder_id ?? null,
    };

    if (editing && editing !== "new") {
      updateNote.mutate({ noteId: editing.id, updates: payload }, { onSuccess: () => setEditing(null) });
    } else {
      createNote.mutate(payload, { onSuccess: () => setEditing(null) });
    }
  }

  if (editing) {
    return (
      <div className="sn-page">
        
        <NoteEditor
          note={editing === "new" ? null : editing}
          folders={folders}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={createNote.isPending || updateNote.isPending}
          isAdmin={isPremium}
        />
      </div>
    );
  }

  return (
    <div className="sn-page">
      

      <div className="sn-header">
        <button className="sn-nav-back" onClick={() => navigate("home")}>{t("common.back")}</button>
        <div className="sn-header-row">
          <div>
            <h1 className="sn-title">{t("studyNotes.title")}</h1>
            <p className="sn-subtitle">{t("studyNotes.subtitle")}</p>
          </div>
          <button className="sn-new-btn" onClick={() => setEditing("new")}>{t("studyNotes.newNote")}</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sn-tabs">
        <button className={`sn-tab${tab === "mine" ? " sn-tab--active" : ""}`} onClick={() => setTab("mine")}>
          {t("studyNotes.myNotes")}
          {notes.length > 0 && <span className="sn-tab-count">{notes.length}</span>}
        </button>
        <button className={`sn-tab${tab === "public" ? " sn-tab--active" : ""}`} onClick={() => setTab("public")}>
          {t("studyNotes.communityNotes")}
        </button>
      </div>

      <div className="sn-controls">
        <input
          className="sn-search"
          type="search"
          placeholder={t("studyNotes.search")}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {tab === "mine" && (
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS.map(s => ({ value: s, label: t(`studyNotes.sort_${s}`) }))}
          />
        )}
      </div>

      {tab === "mine" && allTags.length > 0 && (
        <div className="sn-tag-filter">
          <button
            className={`sn-filter-chip${!activeTag ? " sn-filter-chip--active" : ""}`}
            onClick={() => setActiveTag(null)}
          >{t("studyNotes.all")}</button>
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

      <div className="sn-body">
        {tab === "mine" && folders.length > 0 && (
          <FolderSidebar
            folders={folders}
            activeFolder={activeFolder}
            onSelect={setActiveFolder}
            onCreate={(name) => createFolder.mutate(name)}
            onRename={(folderId, name) => renameFolder.mutate({ folderId, name })}
            onDelete={(folderId) => deleteFolder.mutate(folderId)}
          />
        )}

        {tab === "mine" && folders.length === 0 && (
          <div className="sn-folder-create-hint">
            <button className="sn-folder-hint-btn" onClick={() => setShowFolderPrompt(true)}>
              + {t("studyNotes.newFolder")}
            </button>
          </div>
        )}

        <div className="sn-content">
          {tab === "mine" && (
            isLoading ? (
              <div className="sn-spinner-wrap"><div className="sn-spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className="sn-empty-state">
                <span className="sn-empty-icon">📝</span>
                {notes.length === 0 ? (
                  <>
                    <h3>{t("studyNotes.emptyTitle")}</h3>
                    <p>{t("studyNotes.emptyDesc")}</p>
                    <button className="sn-new-btn" onClick={() => setEditing("new")}>{t("studyNotes.emptyBtn")}</button>
                  </>
                ) : (
                  <>
                    <h3>{t("studyNotes.noMatchTitle")}</h3>
                    <p>{t("studyNotes.noMatchDesc")}</p>
                  </>
                )}
              </div>
            ) : (
              <div className="sn-grid">
                {filtered.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => setEditing(note)}
                    onDelete={(id) => setNoteToDelete(id)}
                    onExportMd={exportAsMarkdown}
                  />
                ))}
              </div>
            )
          )}

          {tab === "public" && (
            loadingPublic ? (
              <div className="sn-spinner-wrap"><div className="sn-spinner" /></div>
            ) : filteredPublic.length === 0 ? (
              <div className="sn-empty-state">
                <span className="sn-empty-icon">🌐</span>
                <h3>{t("studyNotes.noPublicNotes")}</h3>
                <p>{t("studyNotes.noPublicNotesDesc")}</p>
              </div>
            ) : (
              <div className="sn-grid">
                {filteredPublic.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => {}}
                    showAuthor
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {noteToDelete && (
        <ConfirmModal
          message={t("studyNotes.deleteConfirm")}
          onConfirm={() => { deleteNote.mutate(noteToDelete); setNoteToDelete(null); }}
          onCancel={() => setNoteToDelete(null)}
        />
      )}
      {showFolderPrompt && (
        <PromptModal
          label={t("studyNotes.folderName")}
          onConfirm={(name) => { createFolder.mutate(name); setShowFolderPrompt(false); }}
          onCancel={() => setShowFolderPrompt(false)}
        />
      )}
    </div>
  );
}
