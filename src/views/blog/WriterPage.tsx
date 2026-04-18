import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import BlockEditor, { Block, blocksToMarkdown, markdownToBlocks } from "./BlockEditor";
import { blogApi } from "../../api/blog";
import { useCreatePost, useUpdatePost, useSeriesList, useCreateSeries, useTagSuggestions } from "../../hooks/useBlog";
import { toast } from "../../lib/toast";
import "../../styles/writer.css";

const MAX_TAGS = 5;

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
}

export default function WriterPage({ user, navigate, editPost }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(editPost?.title ?? "");
  const [subtitle, setSubtitle] = useState(editPost?.subtitle ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(editPost?.cover_url ?? null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [tags, setTags] = useState<string[]>(editPost?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [showTagSugg, setShowTagSugg] = useState(false);
  const [mode, setMode] = useState<"block" | "md">("block");
  const [blocks, setBlocks] = useState<Block[]>(() => markdownToBlocks(editPost?.content ?? ""));
  const [markdown, setMarkdown] = useState(editPost?.content ?? "");
  const [selectedSeries, setSelectedSeries] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postIdRef = useRef<string | null>(editPost?.id ?? null);
  const postSlugRef = useRef<string | null>(editPost?.slug ?? null);

  const createPost = useCreatePost(user.id);
  const updatePost = useUpdatePost(user.id);
  const { data: seriesList = [] } = useSeriesList(user.id);
  const createSeries = useCreateSeries(user.id);
  const { data: tagSuggestions = [] } = useTagSuggestions();

  const currentMarkdown = mode === "block" ? blocksToMarkdown(blocks) : markdown;
  const readTime = computeReadTime(title + " " + currentMarkdown);
  const wordCount = (title + " " + currentMarkdown).trim().split(/\s+/).filter(Boolean).length;

  const hasCover = !!coverUrl;
  const hasTag = tags.length > 0;
  const has300Words = wordCount >= 300;
  const hasPullQuote = currentMarkdown.includes("\n> ") || currentMarkdown.startsWith("> ");
  const hasVerseRef = /\[[A-Z][a-zA-Z\s]+\d+:\d+\]/.test(currentMarkdown);

  const doSave = useCallback(async (publish = false) => {
    if (!title.trim()) return;
    setSaveStatus("saving");
    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      content: currentMarkdown,
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
    } catch (err: unknown) {
      setSaveStatus("unsaved");
      toast.error(err instanceof Error ? err.message : "Save failed");
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
    await doSave(true);
    setShowPublishModal(false);
    navigate("blog");
    toast.success(t("blog.published", "Published!"));
  };

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
            { icon: "¶", label: "Paragraph" },
            { icon: "H", label: "Heading" },
            { icon: "B", label: "Bold" },
            { icon: "I", label: "Italic" },
          ] as const).map(({ icon, label }) => (
            <div key={icon} className="writer-fmt-wrap">
              <button className="writer-fmt-btn" title={label}>{icon}</button>
              <span className="writer-fmt-tip">{label}</span>
            </div>
          ))}
          <div className="writer-fmt-sep" />
          {([
            { icon: "📖", label: "Bible verse" },
            { icon: "❝", label: "Block quote" },
            { icon: "•", label: "Bullet list" },
          ] as const).map(({ icon, label }) => (
            <div key={icon} className="writer-fmt-wrap">
              <button className="writer-fmt-btn" title={label}>{icon}</button>
              <span className="writer-fmt-tip">{label}</span>
            </div>
          ))}
          <div className="writer-fmt-sep" />
          {([
            { icon: "🖼", label: "Image" },
            { icon: "🔗", label: "Link" },
          ] as const).map(({ icon, label }) => (
            <div key={icon} className="writer-fmt-wrap">
              <button className="writer-fmt-btn" title={label}>{icon}</button>
              <span className="writer-fmt-tip">{label}</span>
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="writer-editor">
          <div className="writer-editor-inner">
            {/* Cover zone */}
            <label className="writer-cover-zone">
              {coverUrl && <img src={coverUrl} alt="cover" />}
              {!coverUrl && (
                <span className="writer-cover-hint">
                  {coverUploading ? "Uploading…" : "🖼️ Click to add cover image"}
                </span>
              )}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
            </label>

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
              ? <BlockEditor blocks={blocks} onChange={setBlocks} />
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

      {/* Publish modal */}
      {showPublishModal && (
        <div className="writer-modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="writer-modal" onClick={e => e.stopPropagation()}>
            <h2>Ready to publish?</h2>
            <div className="writer-modal-row"><strong>{title || "(No title)"}</strong></div>
            <div className="writer-modal-row">Read time: {readTime} min · {wordCount} words</div>
            {tags.length > 0 && <div className="writer-modal-row">Tags: {tags.join(", ")}</div>}
            {selectedSeries && (
              <div className="writer-modal-row">
                Series: {seriesList.find(s => s.id === selectedSeries)?.title}
              </div>
            )}
            <div className="writer-modal-actions">
              <button className="btn btn-sm" onClick={() => setShowPublishModal(false)}>Cancel</button>
              <button className="btn btn-sm btn-primary" onClick={handlePublish}>Publish now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
