import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import BlockEditor, { Block, blocksToMarkdown, markdownToBlocks } from "./BlockEditor";
import { blogApi } from "../../api/blog";
import { useCreatePost, useUpdatePost, useSeriesList, useCreateSeries, useTagSuggestions } from "../../hooks/useBlog";
import { toast } from "../../lib/toast";
import "../../styles/writer.css";

const MAX_TAGS = 5;
const DRAFT_KEY = "blog_writer_draft";

function loadLocalDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) as { title: string; subtitle: string; content: string; tags: string[] } : null;
  } catch { return null; }
}
function saveLocalDraft(data: { title: string; subtitle: string; content: string; tags: string[] }) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}
function clearLocalDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

function computeReadTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

interface EditPost {
  id: string;
  title: string;
  subtitle?: string | null;
  content: string;
  cover_url?: string | null;
  tags?: string[];
  published: boolean;
  slug: string;
}

interface Props {
  user: { id: string };
  navigate: (page: string, params?: Record<string, unknown>) => void;
  editPost?: EditPost | null;
  initialDraft?: { title: string; content: string; excerpt: string } | null;
  onDraftConsumed?: () => void;
}

export default function WriterPage({ user, navigate, editPost, initialDraft, onDraftConsumed }: Props) {
  const { t } = useTranslation();
  const isNew = !editPost;
  const local = isNew ? loadLocalDraft() : null;
  const [title, setTitle] = useState(editPost?.title ?? local?.title ?? "");
  const [subtitle, setSubtitle] = useState(editPost?.subtitle ?? local?.subtitle ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(editPost?.cover_url ?? null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [tags, setTags] = useState<string[]>(editPost?.tags ?? local?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [showTagSugg, setShowTagSugg] = useState(false);
  const [mode, setMode] = useState<"block" | "md">("block");
  const [blocks, setBlocks] = useState<Block[]>(() => markdownToBlocks(editPost?.content ?? local?.content ?? ""));
  const [markdown, setMarkdown] = useState(editPost?.content ?? local?.content ?? "");
  const [selectedSeries, setSelectedSeries] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postIdRef = useRef<string | null>(editPost?.id ?? null);
  const postSlugRef = useRef<string | null>(editPost?.slug ?? null);

  // Internal copy so animation survives initialDraft prop going null
  const [animatingDraft, setAnimatingDraft] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    if (!initialDraft) return;
    setTitle(initialDraft.title);
    setMode("block");
    setAnimatingDraft({ title: initialDraft.title, content: initialDraft.content });
    onDraftConsumed?.();
  }, [initialDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!animatingDraft) return;
    const content = animatingDraft.content;
    const CHUNK = 12;
    const DELAY = 16;
    let i = 0;
    const id = setInterval(() => {
      i += CHUNK;
      const partial = content.slice(0, i);
      setBlocks(markdownToBlocks(partial));
      setMarkdown(partial);
      if (i >= content.length) {
        setBlocks(markdownToBlocks(content));
        setMarkdown(content);
        clearInterval(id);
        setAnimatingDraft(null);
      }
    }, DELAY);
    return () => clearInterval(id);
  }, [animatingDraft]);

  const createPost = useCreatePost(user.id);
  const updatePost = useUpdatePost(user.id);
  const { data: seriesList = [] } = useSeriesList(user.id);
  const createSeries = useCreateSeries(user.id);
  const { data: tagSuggestions = [] } = useTagSuggestions();

  const currentMarkdown = mode === "block" ? blocksToMarkdown(blocks) : markdown;

  // Auto-save draft to localStorage for new posts
  useEffect(() => {
    if (!isNew) return;
    saveLocalDraft({ title, subtitle, content: currentMarkdown, tags });
  }, [isNew, title, subtitle, currentMarkdown, tags]);
  const readTime = computeReadTime(title + " " + currentMarkdown);
  const wordCount = (title + " " + currentMarkdown).trim().split(/\s+/).filter(Boolean).length;

  const hasCover = !!coverUrl;
  const hasTag = tags.length > 0;
  const has300Words = wordCount >= 300;
  const hasPullQuote = currentMarkdown.includes("\n> ") || currentMarkdown.startsWith("> ");
  const hasVerseRef = /\[[A-Z][a-zA-Z\s]+\d+:\d+\]/.test(currentMarkdown);

  const doSave = useCallback(async (publish = false): Promise<boolean> => {
    if (!title.trim()) return false;
    setSaveStatus("saving");
    const plainText = currentMarkdown.replace(/[#>*\-\[\]]/g, "").replace(/\s+/g, " ").trim();
    const excerpt = plainText.slice(0, 200) || title.trim();
    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      content: currentMarkdown,
      excerpt,
      cover_url: coverUrl,
      tags,
      published: publish,
      read_time_minutes: readTime,
    };
    try {
      if (postIdRef.current) {
        await updatePost.mutateAsync({ postId: postIdRef.current, updates: payload });
      } else {
        const created = await createPost.mutateAsync(payload);
        postIdRef.current = created.id;
        postSlugRef.current = created.slug;
        if (!publish) window.history.replaceState(null, "", `/blog/${created.slug}/edit`);
      }
      if (selectedSeries && postIdRef.current) {
        await blogApi.addToSeries(selectedSeries, postIdRef.current, 0);
      }
      setSaveStatus("saved");
      if (isNew) clearLocalDraft();
      return true;
    } catch (err: unknown) {
      setSaveStatus("unsaved");
      toast.error(err instanceof Error ? err.message : "Save failed");
      return false;
    }
  }, [title, subtitle, currentMarkdown, coverUrl, tags, readTime, selectedSeries, createPost, updatePost]);

  // Auto-save debounce — only fires when title is non-empty
  useEffect(() => {
    if (!title.trim()) return;
    setSaveStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(false), 3000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, subtitle, currentMarkdown, coverUrl, tags]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleModeSwitch = (next: "block" | "md") => {
    if (next === "md" && mode === "block") setMarkdown(blocksToMarkdown(blocks));
    if (next === "block" && mode === "md") setBlocks(markdownToBlocks(markdown));
    setMode(next);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const url = await blogApi.uploadCover(user.id, file);
      setCoverUrl(url);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleInlineImageUpload = useCallback(async (file: File): Promise<string> => {
    try {
      return await blogApi.uploadCover(user.id, file);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
      throw err;
    }
  }, [user.id]);

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase();
    if (!clean || tags.includes(clean) || tags.length >= MAX_TAGS) return;
    setTags([...tags, clean]);
    setTagInput("");
    setShowTagSugg(false);
  };

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
    if (e.key === "Backspace" && !tagInput) setTags(tags.slice(0, -1));
  };

  const handleCreateSeries = async () => {
    const name = window.prompt("Series name:");
    if (!name?.trim()) return;
    try {
      const series = await createSeries.mutateAsync(name.trim());
      setSelectedSeries(series.id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create series");
    }
  };

  const filteredSugg = tagSuggestions.filter((s: string) => s.includes(tagInput) && !tags.includes(s));

  const handlePublish = async () => {
    // Cancel any pending auto-save so it can't overwrite published=true with published=false
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
    const ok = await doSave(true);
    if (!ok) return;
    setShowPublishModal(false);
    navigate("blog");
    toast.success(t("blog.published", "Published!"));
  };

  const insertBlock = useCallback((type: Block["type"]) => {
    const id = Math.random().toString(36).slice(2);
    setBlocks(prev => [...prev, { id, type, content: "" }]);
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-block-id="${id}"]`) ??
        Array.from(document.querySelectorAll<HTMLElement>(".be-para, .be-h2, .be-h3, .be-verse-ref, .be-pullquote")).at(-1);
      el?.focus();
    }, 60);
  }, []);

  return (
    <div className="writer-wrap">
      {/* Top bar */}
      <div className="writer-topbar">
        <div className="writer-topbar-left">
          <span className="writer-logo">✍️ JW Study</span>
          <div className="writer-save-status">
            {saveStatus === "saved" && <><div className="writer-save-dot" />Saved</>}
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "unsaved" && "Unsaved"}
          </div>
        </div>
        <div className="writer-topbar-right">
          <button className="btn btn-sm" onClick={() => navigate("blog")}>Cancel</button>
          <button className="btn btn-sm" onClick={() => doSave(false)}>Save Draft</button>
          <button className="btn btn-sm btn-primary" onClick={() => setShowPublishModal(true)}>Publish →</button>
        </div>
      </div>

      <div className="writer-body">
        {/* Left format bar */}
        <div className="writer-format-bar">
          {([
            { icon: "¶",  label: "Paragraph",  action: () => insertBlock("paragraph") },
            { icon: "H2", label: "Heading",    action: () => insertBlock("h2") },
            { icon: "H3", label: "Subheading", action: () => insertBlock("h3") },
          ] as const).map(({ icon, label, action }) => (
            <div key={icon} className="writer-fmt-wrap">
              <button className="writer-fmt-btn" title={label} onClick={action}>{icon}</button>
              <span className="writer-fmt-tip">{label}</span>
            </div>
          ))}
          <div className="writer-fmt-sep" />
          {([
            { icon: "•",  label: "Bullet list",   action: () => insertBlock("bullet") },
            { icon: "1.", label: "Numbered list",  action: () => insertBlock("numbered") },
          ] as const).map(({ icon, label, action }) => (
            <div key={icon} className="writer-fmt-wrap">
              <button className="writer-fmt-btn" title={label} onClick={action}>{icon}</button>
              <span className="writer-fmt-tip">{label}</span>
            </div>
          ))}
          <div className="writer-fmt-sep" />
          {([
            { icon: "📖", label: "Bible verse",  action: () => insertBlock("bible-verse") },
            { icon: "❝",  label: "Block quote",  action: () => insertBlock("pull-quote") },
            { icon: "🖼", label: "Image",         action: () => insertBlock("image") },
            { icon: "─",  label: "Divider",       action: () => insertBlock("divider") },
          ] as const).map(({ icon, label, action }) => (
            <div key={icon} className="writer-fmt-wrap">
              <button className="writer-fmt-btn" title={label} onClick={action}>{icon}</button>
              <span className="writer-fmt-tip">{label}</span>
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="writer-editor">
          <div className="writer-editor-inner">
            {/* Cover zone */}
            <div className="writer-cover-zone">
              {coverUrl
                ? <img src={coverUrl} alt="cover" onClick={() => setCoverUrl(null)} title="Click to remove" />
                : coverUploading
                  ? <span className="writer-cover-hint">Uploading…</span>
                  : (
                    <div className="writer-cover-options">
                      <label className="writer-cover-opt">
                        <span>⬆️ Upload image</span>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
                      </label>
                      <span className="writer-cover-or">or</span>
                      <input
                        className="writer-cover-url-input"
                        placeholder="Paste image URL…"
                        onPaste={e => {
                          const url = e.clipboardData.getData("text").trim();
                          if (url.startsWith("http")) { e.preventDefault(); setCoverUrl(url); }
                        }}
                        onChange={e => {
                          const url = e.target.value.trim();
                          if (url.startsWith("http")) setCoverUrl(url);
                        }}
                      />
                    </div>
                  )
              }
            </div>

            <textarea
              className="writer-title"
              placeholder="Your title here…"
              value={title}
              rows={1}
              onChange={e => setTitle(e.target.value)}
            />

            <textarea
              className="writer-subtitle"
              placeholder="Add a subtitle (optional)…"
              value={subtitle ?? ""}
              rows={1}
              onChange={e => setSubtitle(e.target.value)}
            />

            <div className="writer-mode-toggle">
              <button className={`writer-mode-btn${mode === "block" ? " active" : ""}`} onClick={() => handleModeSwitch("block")}>✦ Block Editor</button>
              <button className={`writer-mode-btn${mode === "md" ? " active" : ""}`} onClick={() => handleModeSwitch("md")}>⌨ Markdown</button>
            </div>

            {mode === "block"
              ? <BlockEditor blocks={blocks} onChange={setBlocks} onImageUpload={handleInlineImageUpload} />
              : (
                <textarea
                  className="writer-markdown"
                  value={markdown}
                  onChange={e => setMarkdown(e.target.value)}
                  placeholder={"Write in Markdown.\nUse [John 3:16] for verse references, > for pull quotes."}
                />
              )
            }
          </div>
        </div>

        {/* Right sidebar */}
        <div className="writer-sidebar">
          <div>
            <div className="writer-sidebar-label">Reading Time</div>
            <div className="writer-readtime">
              <div>
                <div className="writer-readtime-num">{readTime}</div>
                <div className="writer-readtime-label">min read</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>~{wordCount} words</div>
            </div>
          </div>

          <div>
            <div className="writer-sidebar-label">Tags (up to {MAX_TAGS})</div>
            <div
              className="writer-tags-wrap"
              onClick={() => document.querySelector<HTMLInputElement>(".writer-tags-input")?.focus()}
            >
              {tags.map(tag => (
                <span key={tag} className="writer-tag-chip">
                  {tag}
                  <span className="writer-tag-x" onClick={() => setTags(tags.filter(t => t !== tag))}>×</span>
                </span>
              ))}
              {tags.length < MAX_TAGS && (
                <input
                  className="writer-tags-input"
                  value={tagInput}
                  onChange={e => { setTagInput(e.target.value); setShowTagSugg(true); }}
                  onKeyDown={handleTagKey}
                  onBlur={() => setTimeout(() => setShowTagSugg(false), 150)}
                  placeholder={tags.length ? "" : "Add tag…"}
                />
              )}
            </div>
            {showTagSugg && filteredSugg.length > 0 && (
              <div className="writer-tag-suggestions">
                {filteredSugg.slice(0, 6).map((s: string) => (
                  <div key={s} className="writer-tag-opt" onMouseDown={() => addTag(s)}>{s}</div>
                ))}
              </div>
            )}
            <div className="writer-tags-hint">Press Enter or comma to add</div>
          </div>

          <div>
            <div className="writer-sidebar-label">Series</div>
            <select
              className="writer-select"
              value={selectedSeries}
              onChange={e => {
                if (e.target.value === "__new__") { handleCreateSeries(); }
                else setSelectedSeries(e.target.value);
              }}
            >
              <option value="">— No series —</option>
              {seriesList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              <option value="__new__">+ Create new series…</option>
            </select>
          </div>

          <div>
            <div className="writer-sidebar-label">Pre-publish checklist</div>
            <div className="writer-checklist">
              {([
                { done: hasCover,     label: "Cover image added" },
                { done: hasTag,       label: "At least 1 tag" },
                { done: has300Words,  label: "300+ words" },
                { done: hasPullQuote, label: "Pull quote added" },
                { done: hasVerseRef,  label: "Bible reference" },
              ] as const).map(({ done, label }) => (
                <div key={label} className="writer-check-row">
                  <div className={`writer-check-icon${done ? " writer-check-icon--done" : " writer-check-icon--todo"}`}>
                    {done ? "✓" : ""}
                  </div>
                  <span style={{ textDecoration: done ? "line-through" : "none", opacity: done ? 0.6 : 1 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Publish modal — portalled to body so position:fixed works regardless of transforms */}
      {showPublishModal && createPortal(
        <div className="writer-modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="writer-modal" onClick={e => e.stopPropagation()}>
            <div className="writer-modal-icon">🚀</div>
            <h2>Ready to publish?</h2>
            <p className="writer-modal-subtitle">Your article will be visible to the community.</p>
            <div className="writer-modal-card">
              <div className="writer-modal-row"><strong>{title || "(No title)"}</strong></div>
              <div className="writer-modal-row">{readTime} min read · {wordCount} words</div>
              {tags.length > 0 && <div className="writer-modal-row">🏷 {tags.join(", ")}</div>}
              {selectedSeries && (
                <div className="writer-modal-row">
                  📚 {seriesList.find(s => s.id === selectedSeries)?.title}
                </div>
              )}
            </div>
            <div className="writer-modal-actions">
              <button className="btn" onClick={() => setShowPublishModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePublish}>🚀 Publish now</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
