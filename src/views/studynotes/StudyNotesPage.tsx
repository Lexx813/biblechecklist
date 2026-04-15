import { useState, useMemo, useRef, useEffect, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../../components/ConfirmModal";
import NoteTemplatePicker from "../../components/NoteTemplatePicker";
import CustomSelect from "../../components/CustomSelect";
const RichTextEditor = lazy(() => import("../../components/RichTextEditor"));
import { useAISkill } from "../../hooks/useAISkill";
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
  useToggleNoteLike,
} from "../../hooks/useStudyNotes";
import "../../styles/study-notes.css";
import { formatDate, stripHtml } from "../../utils/formatters";
import { sanitizeRich } from "../../lib/sanitize";

// ── Helpers ───────────────────────────────────────────────────────────────────

function passageLabel(note) {
  if (note.book_index == null) return null;
  const book = BOOKS[note.book_index]?.name ?? "Unknown";
  let label = book;
  if (note.chapter) label += ` ${note.chapter}`;
  if (note.verse) label += `:${note.verse}`;
  return label;
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
            <button type="button" className="sn-tag-remove" onClick={() => remove(tag)} aria-label="Remove tag">×</button>
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
          aria-label="Add tag"
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
      <div className="ait-inline-header" onClick={() => setOpen(o => !o)} role="button" tabIndex={0} aria-expanded={open}>
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

function NoteEditor({ note, initialContent = "", folders, onSave, onCancel, saving, isAdmin }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(note ?? { ...EMPTY_NOTE, content: initialContent });
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
        <button type="button" className="back-btn" onClick={onCancel}>{t("common.back")}</button>
        <h2 className="sn-editor-title">{note ? t("studyNotes.editNote") : t("studyNotes.newNoteTitle")}</h2>
        {note && (
          <div className="sn-editor-export">
            <button type="button" className="sn-export-btn" onClick={() => exportAsMarkdown(note)} title={t("studyNotes.exportMarkdown")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              .md
            </button>
            <button type="button" className="sn-export-btn" onClick={() => exportAsPrint(note)} title={t("studyNotes.exportPdf")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              PDF
            </button>
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
              aria-label="Verse reference"
            />
          )}
        </div>

        <label className="sn-label">{t("studyNotes.fieldTags")}</label>
        <TagInput tags={form.tags ?? []} onChange={val => set("tags", val)} />

        <label className="sn-label">{t("studyNotes.fieldContent")}</label>
        <div className="sn-editor-rich">
          <Suspense fallback={<div style={{ height: 160 }} />}>
            <RichTextEditor
              content={form.content}
              onChange={val => set("content", val)}
              placeholder={t("studyNotes.contentPlaceholder")}
            />
          </Suspense>
        </div>

        {isAdmin && (
          <EnhanceNoteWidget
            noteContent={form.content}
            passage={passageLabel(form) ?? undefined}
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

function NoteCard({ note, onClick, onDelete = null, onExportMd = null, onExportPdf = null, showAuthor = false, onLike = null }: { note: any; onClick: any; onDelete?: any; onExportMd?: any; onExportPdf?: any; showAuthor?: any; onLike?: any }) {
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
          aria-label={t("common.delete")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>
      {showAuthor && note.author && (
        <span className="sn-card-author">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{display:"inline",verticalAlign:"middle",marginRight:4}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {note.author.display_name}
        </span>
      )}
      {passage && (
        <span className="sn-card-passage">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{display:"inline",verticalAlign:"middle",marginRight:4}}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          {passage}
        </span>
      )}
      {preview && <p className="sn-card-preview">{preview}{preview.length >= 140 ? "…" : ""}</p>}
      <div className="sn-card-footer">
        <div className="sn-card-tags">
          {(note.tags ?? []).slice(0, 4).map(tag => (
            <span key={tag} className="sn-tag-chip">#{tag}</span>
          ))}
        </div>
        <div className="sn-card-actions">
          {onLike && (
            <button
              className={`sn-like-btn${note.user_has_liked ? " sn-like-btn--liked" : ""}`}
              onClick={e => { e.stopPropagation(); onLike(note.id); }}
              aria-label={note.user_has_liked ? "Unlike" : "Like"}
            >
              {note.user_has_liked ? "♥" : "♡"}{note.like_count > 0 ? ` ${note.like_count}` : ""}
            </button>
          )}
          {onExportMd && (
            <button className="sn-card-export-btn" onClick={e => { e.stopPropagation(); onExportMd(note); }} title={t("studyNotes.exportMarkdown")} aria-label={t("studyNotes.exportMarkdown")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
          )}
          <span className="sn-card-date">{formatDate(note.updated_at)}</span>
        </div>
      </div>
      {note.is_public && <span className="sn-public-badge">{t("studyNotes.public")}</span>}
    </div>
  );
}

// ── Community note view modal ─────────────────────────────────────────────────

function NoteViewModal({ note, userId, onClose, onLike, onDelete }) {
  const { t } = useTranslation();
  const passage = passageLabel(note);
  const isOwner = note.user_id === userId;

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="sn-view-overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}>
      <div className="sn-view-modal">
        <div className="sn-view-header">
          <div className="sn-view-meta">
            {note.author && (
              <span className="sn-view-author">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{display:"inline",verticalAlign:"middle",marginRight:4}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {note.author.display_name}
              </span>
            )}
            {passage && (
              <span className="sn-view-passage">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{display:"inline",verticalAlign:"middle",marginRight:4}}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                {passage}
              </span>
            )}
          </div>
          <button className="sn-view-close" onClick={onClose} aria-label={t("common.close")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <h2 className="sn-view-title">{note.title || t("studyNotes.untitled")}</h2>

        {(note.tags ?? []).length > 0 && (
          <div className="sn-view-tags">
            {note.tags.map(tag => <span key={tag} className="sn-tag-chip">#{tag}</span>)}
          </div>
        )}

        <div
          className="sn-view-content rich-content"
          dangerouslySetInnerHTML={{ __html: sanitizeRich(note.content) }}
        />

        <div className="sn-view-footer">
          <button
            className={`sn-like-btn${note.user_has_liked ? " sn-like-btn--liked" : ""}`}
            onClick={() => onLike(note.id)}
            aria-label={note.user_has_liked ? "Unlike" : "Like"}
          >
            {note.user_has_liked ? "♥" : "♡"}{note.like_count > 0 ? ` ${note.like_count}` : ""}
          </button>
          <span className="sn-card-date">{formatDate(note.updated_at)}</span>
          {isOwner && (
            <button
              className="sn-view-delete"
              onClick={() => { onDelete(note.id); onClose(); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              {t("common.delete")}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
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
            aria-label="Folder name"
          />
          <button type="submit" className="sn-folder-save-btn" aria-label="Save">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
          <button type="button" className="sn-folder-cancel-btn" onClick={() => setCreating(false)} aria-label="Cancel">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </form>
      )}

      <button
        className={`sn-folder-item${activeFolder === null ? " sn-folder-item--active" : ""}`}
        onClick={() => onSelect(null)}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{display:"inline",verticalAlign:"middle",marginRight:5}}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        {t("studyNotes.allNotes")}
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
                aria-label="Rename folder"
              />
              <button type="submit" className="sn-folder-save-btn" aria-label="Save">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <button type="button" className="sn-folder-cancel-btn" onClick={() => setRenamingId(null)} aria-label="Cancel">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </form>
          ) : (
            <>
              <button
                className={`sn-folder-item${activeFolder === f.id ? " sn-folder-item--active" : ""}`}
                onClick={() => onSelect(f.id)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{display:"inline",verticalAlign:"middle",marginRight:5}}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                {f.name}
              </button>
              <button className="sn-folder-edit-btn" onClick={() => { setRenamingId(f.id); setRenameVal(f.name); }} title={t("common.edit")} aria-label={t("common.edit")}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button className="sn-folder-del-btn" onClick={() => onDelete(f.id)} title={t("common.delete")} aria-label={t("common.delete")}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
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
      <div className="confirm-modal" role="dialog" aria-modal="true" aria-label="Enter value" onClick={e => e.stopPropagation()}>
        <form className="confirm-body" onSubmit={handleSubmit}>
          <div className="confirm-title">{label}</div>
          <input
            ref={inputRef}
            className="sn-prompt-input"
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder={label}
            aria-label="Enter value"
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

// ── Seed / placeholder public notes ──────────────────────────────────────────

const SEED_PUBLIC_NOTES = [
  {
    id: "seed-1",
    title: "The sermon on the mount — beatitudes",
    content: "<p>Matthew 5 opens with qualities that seem upside-down to the world: the meek, the mourning, the merciful. Studying the Greek behind \"meek\" (praus) was eye-opening — it describes a horse that's powerful but trained. Meekness isn't weakness, it's strength under control.</p>",
    tags: ["sermon-on-the-mount", "beatitudes", "character"],
    book_index: 39, // Matthew
    chapter: 5,
    verse: "3-12",
    is_public: true,
    like_count: 31,
    user_has_liked: false,
    updated_at: "2026-03-28T11:00:00Z",
    author: { display_name: "David O." },
  },
  {
    id: "seed-2",
    title: "Isaiah's prophecy of restoration",
    content: "<p>Isaiah 40:28-31 never gets old. The image of \"mounting up with wings like eagles\" is so vivid. What I appreciate is the context: it comes right after God asks \"do you not know? Have you not heard?\" — a gentle correction that exhaustion doesn't mean abandonment.</p>",
    tags: ["prophecy", "comfort", "strength"],
    book_index: 22, // Isaiah
    chapter: 40,
    verse: "28-31",
    is_public: true,
    like_count: 22,
    user_has_liked: false,
    updated_at: "2026-03-26T08:45:00Z",
    author: { display_name: "Renata V." },
  },
  {
    id: "seed-3",
    title: "Psalm 23 — more than a funeral verse",
    content: "<p>We quote Psalm 23 at funerals, but it's really about present-tense provision. \"He causes me to lie down in green pastures\" — sheep only lie down when they feel safe. It's a picture of rest that has to be given, not achieved. Still sitting with that.</p>",
    tags: ["psalms", "trust", "comfort"],
    book_index: 18, // Psalms
    chapter: 23,
    verse: null,
    is_public: true,
    like_count: 28,
    user_has_liked: false,
    updated_at: "2026-03-25T09:10:00Z",
    author: { display_name: "Amara J." },
  },
  {
    id: "seed-4",
    title: "The patience of Job",
    content: "<p>What struck me re-reading Job is how he never actually cursed God — he questioned, he grieved, but he held on. Job 1:21 sums it up: \"Jehovah himself has given, and Jehovah himself has taken away. Let the name of Jehovah continue to be praised.\" A reminder that faith isn't the absence of pain.</p>",
    tags: ["faith", "suffering", "hope"],
    book_index: 17, // Job
    chapter: 1,
    verse: "21",
    is_public: true,
    like_count: 14,
    user_has_liked: false,
    updated_at: "2026-03-23T10:00:00Z",
    author: { display_name: "Marcus T." },
  },
  {
    id: "seed-5",
    title: "Romans 8 — no condemnation",
    content: "<p>Romans 8:1 is one of the most freeing verses in all of scripture: \"There is now no condemnation for those in union with Christ Jesus.\" Paul spends the rest of the chapter unpacking why — the spirit, adoption, intercession, and the unbreakable love of God. I keep coming back to verse 38: nothing can separate us.</p>",
    tags: ["romans", "grace", "assurance"],
    book_index: 44, // Romans
    chapter: 8,
    verse: "1",
    is_public: true,
    like_count: 41,
    user_has_liked: false,
    updated_at: "2026-03-22T13:20:00Z",
    author: { display_name: "Sofia M." },
  },
  {
    id: "seed-6",
    title: "Proverbs on words",
    content: "<p>Proverbs has so much to say about speech. \"The tongue of the wise makes knowledge appealing, but the mouth of the stupid blurts out foolishness\" (15:2). I've been making a mental note before responding when I'm frustrated — does this build up or tear down?</p>",
    tags: ["wisdom", "speech", "proverbs"],
    book_index: 19, // Proverbs
    chapter: 15,
    verse: "2",
    is_public: true,
    like_count: 9,
    user_has_liked: false,
    updated_at: "2026-03-21T14:30:00Z",
    author: { display_name: "Lena K." },
  },
  {
    id: "seed-7",
    title: "Genesis 1 — \"it was good\"",
    content: "<p>Reading the creation account slowly, I noticed God evaluates each day with \"it was good\" — but day 2 (the expanse) gets no such evaluation. Scholars think it's because the separation of waters isn't finished until day 3. The point: God doesn't call something good until it's complete. That hit differently.</p>",
    tags: ["genesis", "creation", "observation"],
    book_index: 0, // Genesis
    chapter: 1,
    verse: null,
    is_public: true,
    like_count: 19,
    user_has_liked: false,
    updated_at: "2026-03-19T07:30:00Z",
    author: { display_name: "Theo B." },
  },
  {
    id: "seed-8",
    title: "John 11 — the shortest verse",
    content: "<p>\"Jesus wept\" (John 11:35) is famous for being the shortest verse, but the context makes it profound. Jesus already knew he was about to raise Lazarus. He wept anyway. Not from despair but from compassion — he entered into the grief of those he loved. That's the kind of God worth serving.</p>",
    tags: ["john", "compassion", "resurrection"],
    book_index: 42, // John
    chapter: 11,
    verse: "35",
    is_public: true,
    like_count: 37,
    user_has_liked: false,
    updated_at: "2026-03-17T15:00:00Z",
    author: { display_name: "Priya N." },
  },
  {
    id: "seed-9",
    title: "Daniel in Babylon — uncompromised",
    content: "<p>Daniel 1 sets the tone for the whole book: four young men in a foreign empire, offered the king's food, and they quietly ask for an alternative. No dramatic protest — just a clear, respectful boundary. Their faithfulness in small things preceded their faithfulness in large ones.</p>",
    tags: ["daniel", "integrity", "faithfulness"],
    book_index: 26, // Daniel
    chapter: 1,
    verse: null,
    is_public: true,
    like_count: 16,
    user_has_liked: false,
    updated_at: "2026-03-14T12:00:00Z",
    author: { display_name: "Carlos E." },
  },
  {
    id: "seed-10",
    title: "Ecclesiastes — vanity and meaning",
    content: "<p>Ecclesiastes gets a bad rap for being depressing, but I think the Preacher is doing something important: he's exhausting every worldly avenue — pleasure, work, wisdom — to show they all fall short. The conclusion in 12:13 isn't nihilism, it's clarity: fear God and keep his commandments. Everything else is vapor.</p>",
    tags: ["ecclesiastes", "meaning", "wisdom"],
    book_index: 20, // Ecclesiastes
    chapter: 12,
    verse: "13",
    is_public: true,
    like_count: 12,
    user_has_liked: false,
    updated_at: "2026-03-12T10:45:00Z",
    author: { display_name: "Yuki S." },
  },
  {
    id: "seed-11",
    title: "Luke 15 — three parables, one point",
    content: "<p>The lost sheep, the lost coin, the prodigal son — they're all the same story at different scales. What I noticed: in each case the one who lost something goes looking. The sheep can't find itself. The coin can't find itself. And the son comes home to a father who was already watching. The initiative is always with the one who loves.</p>",
    tags: ["luke", "parables", "grace"],
    book_index: 41, // Luke
    chapter: 15,
    verse: null,
    is_public: true,
    like_count: 44,
    user_has_liked: false,
    updated_at: "2026-03-08T09:00:00Z",
    author: { display_name: "Nadia R." },
  },
  {
    id: "seed-12",
    title: "Revelation — letters to the congregations",
    content: "<p>The seven letters in Revelation 2–3 each follow a pattern: commendation, correction, counsel. I found it striking that even the faithful congregation in Smyrna gets no criticism — just encouragement to endure. A good model for how to give feedback.</p>",
    tags: ["revelation", "congregation", "endurance"],
    book_index: 65, // Revelation
    chapter: 2,
    verse: null,
    is_public: true,
    like_count: 17,
    user_has_liked: false,
    updated_at: "2026-03-05T16:20:00Z",
    author: { display_name: "Yuki S." },
  },
];

// ── Main page ─────────────────────────────────────────────────────────────────

const SORT_OPTIONS = ["updated", "created", "title"];

export default function StudyNotesPage({ user, navigate, initialTab = "mine", ...sharedNav }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] ?? "en";
  const { data: notes = [], isLoading } = useStudyNotes();
  const { data: publicNotes = [], isLoading: loadingPublic } = usePublicNotes(lang);
  const { data: folders = [] } = useNoteFolders();
  const toggleLike = useToggleNoteLike();
  const createNote = useCreateStudyNote(user?.id);
  const updateNote = useUpdateStudyNote();
  const deleteNote = useDeleteStudyNote();
  const createFolder = useCreateNoteFolder();
  const renameFolder = useRenameNoteFolder();
  const deleteFolder = useDeleteNoteFolder();
  const [tab, setTab] = useState(initialTab); // "mine" | "public"
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templateContent, setTemplateContent] = useState("");
  const [editing, setEditing] = useState(() => {
    try {
      const saved = sessionStorage.getItem("sn:editing");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [search, setSearch] = useState("");
  const [viewingNote, setViewingNote] = useState(null);
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

  const allTags = useMemo<string[]>(() => {
    const set = new Set<string>();
    notes.forEach(n => (n.tags ?? []).forEach((t: string) => set.add(t)));
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
    if (sortBy === "created") list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === "title") list = [...list].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
    return list;
  }, [notes, search, activeTag, activeFolder, sortBy]);

  const displayedPublic = publicNotes.length > 0 ? publicNotes : SEED_PUBLIC_NOTES;

  const filteredPublic = useMemo(() => {
    if (!search.trim()) return displayedPublic;
    const q = search.toLowerCase();
    return displayedPublic.filter(n =>
      (n.title ?? "").toLowerCase().includes(q) ||
      stripHtml(n.content).toLowerCase().includes(q) ||
      (n.tags ?? []).some(t => t.includes(q))
    );
  }, [displayedPublic, search]);

  function handleSave(form) {
    const payload = {
      title: form.title.trim() || null,
      content: form.content || null,
      tags: form.tags ?? [],
      book_index: form.book_index,
      chapter: form.chapter,
      lang,
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

  function handleTemplateSelect(content) {
    setTemplateContent(content);
    setShowTemplatePicker(false);
    setEditing("new");
  }

  if (editing) {
    return (
      <div className="sn-page">

        <NoteEditor
          note={editing === "new" ? null : editing}
          initialContent={editing === "new" ? templateContent : ""}
          folders={folders}
          onSave={handleSave}
          onCancel={() => { setEditing(null); setTemplateContent(""); }}
          saving={createNote.isPending || updateNote.isPending}
          isAdmin={true}
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
          <button className="sn-new-btn" onClick={() => setShowTemplatePicker(true)}>{t("studyNotes.newNote")}</button>
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
          aria-label="Search notes"
        />
        {tab === "mine" && (
          <CustomSelect
            value={sortBy}
            onChange={(v) => setSortBy(String(v))}
            options={SORT_OPTIONS.map(s => ({ value: s, label: t(`studyNotes.sort_${s}`) }))}
          />
        )}
      </div>

      {tab === "mine" && allTags.length > 0 && (
        <div className="sn-tag-filter">
          <button
            className={`sn-filter-chip${!activeTag ? " sn-filter-chip--active" : ""}`}
            onClick={() => { setActiveTag(null); setSearch(""); setActiveFolder(null); }}
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
                    <button className="sn-new-btn" onClick={() => setShowTemplatePicker(true)}>{t("studyNotes.emptyBtn")}</button>
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
                    onClick={() => setViewingNote(note)}
                    showAuthor
                    onLike={(id) => toggleLike.mutate(id)}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {viewingNote && (
        <NoteViewModal
          note={viewingNote}
          userId={user?.id}
          onClose={() => setViewingNote(null)}
          onLike={(id) => {
            toggleLike.mutate(id);
            setViewingNote(n => n ? {
              ...n,
              user_has_liked: !n.user_has_liked,
              like_count: n.like_count + (n.user_has_liked ? -1 : 1),
            } : n);
          }}
          onDelete={(id) => setNoteToDelete(id)}
        />
      )}

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
      {showTemplatePicker && (
        <NoteTemplatePicker
          userId={user?.id}
          onSelect={handleTemplateSelect}
          onDismiss={() => setShowTemplatePicker(false)}
        />
      )}
    </div>
  );
}
