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
  excerpt?: string | null;
  is_featured?: boolean;
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
  const [excerpt, setExcerpt] = useState(editPost?.excerpt ?? "");
  const [customSlug, setCustomSlug] = useState(editPost?.slug ?? "");
  const [isFeatured, setIsFeatured] = useState(editPost?.is_featured ?? false);
  const [wordGoal, setWordGoal] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("nwt-writer-wordgoal") ?? "0") || 0; } catch { return 0; }
  });
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
    if (initialDraft.excerpt) setExcerpt(initialDraft.excerpt);
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
    const autoExcerpt = plainText.slice(0, 200) || title.trim();
    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      content: currentMarkdown,
      excerpt: excerpt.trim() || autoExcerpt,
      cover_url: coverUrl,
      tags,
      published: publish,
      read_time_minutes: readTime,
      is_featured: isFeatured,
      ...(postIdRef.current && customSlug.trim() ? { slug: customSlug.trim() } : {}),
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
  }, [title, subtitle, currentMarkdown, coverUrl, tags, readTime, selectedSeries, createPost, updatePost, excerpt, customSlug, isFeatured]);

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

  // Table of contents from headings
  const toc = blocks.filter(b => b.type === "h2" || b.type === "h3").map(b => ({ id: b.id, type: b.type, content: b.content }));

  const insertBlock = useCallback((type: Block["type"]) => {
    const id = Math.random().toString(36).slice(2);
    const meta = type === "callout" ? "info" : undefined;
    setBlocks(prev => [...prev, { id, type, content: "", meta }]);
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
            {saveStatus === "saved" && <><div className="writer-save-dot" />{t("writer.saved")}</>}
            {saveStatus === "saving" && t("writer.saving")}
            {saveStatus === "unsaved" && t("writer.unsaved")}
          </div>
        </div>
        <div className="writer-topbar-right">
          <button className="btn btn-sm" onClick={() => navigate("blog")}>{t("writer.cancel")}</button>
          <button className="btn btn-sm" onClick={() => doSave(false)}>{t("writer.saveDraft")}</button>
          <button className="btn btn-sm btn-primary" onClick={() => setShowPublishModal(true)}>{t("writer.publish")}</button>
        </div>
      </div>

      <div className="writer-body">
        {/* Left format bar */}
        <div className="writer-format-bar">
          {([
            { icon: "¶",  key: "fmtParagraph",  action: () => insertBlock("paragraph") },
            { icon: "H2", key: "fmtHeading",    action: () => insertBlock("h2") },
            { icon: "H3", key: "fmtSubheading", action: () => insertBlock("h3") },
          ] as const).map(({ icon, key, action }) => (
            <div key={icon} className="writer-fmt-wrap">
              <button className="writer-fmt-btn" title={t(`writer.${key}`)} onClick={action}>{icon}</button>
              <span className="writer-fmt-tip">{t(`writer.${key}`)}</span>
            </div>
          ))}
          <div className="writer-fmt-sep" />
          {([
            { icon: "•",  key: "fmtBullet",   action: () => insertBlock("bullet") },
            { icon: "1.", key: "fmtNumbered",  action: () => insertBlock("numbered") },
          ] as const).map(({ icon, key, action }) => (
            <div key={icon} className="writer-fmt-wrap">
              <button className="writer-fmt-btn" title={t(`writer.${key}`)} onClick={action}>{icon}</button>
              <span className="writer-fmt-tip">{t(`writer.${key}`)}</span>
            </div>
          ))}
          <div className="writer-fmt-sep" />
          {([
            { icon: "📖", key: "fmtBibleVerse",  action: () => insertBlock("bible-verse") },
            { icon: "❝",  key: "fmtBlockQuote",  action: () => insertBlock("pull-quote") },
            { icon: "💡", key: "fmtCallout",     action: () => insertBlock("callout") },
            { icon: "▶",  key: "fmtVideo",       action: () => insertBlock("video") },
            { icon: "🖼", key: "fmtImage",        action: () => insertBlock("image") },
            { icon: "─",  key: "fmtDivider",      action: () => insertBlock("divider") },
          ] as const).map(({ icon, key, action }) => (
            <div key={icon} className="writer-fmt-wrap">
              <button className="writer-fmt-btn" title={t(`writer.${key}`)} onClick={action}>{icon}</button>
              <span className="writer-fmt-tip">{t(`writer.${key}`)}</span>
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
                  ? <span className="writer-cover-hint">{t("writer.uploadingCover")}</span>
                  : (
                    <div className="writer-cover-options">
                      <label className="writer-cover-opt">
                        <span>{t("writer.uploadImage")}</span>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
                      </label>
                      <span className="writer-cover-or">{t("writer.or")}</span>
                      <input
                        className="writer-cover-url-input"
                        placeholder={t("writer.pasteImageUrl")}
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
              placeholder={t("writer.titlePlaceholder")}
              value={title}
              rows={1}
              onChange={e => setTitle(e.target.value)}
            />

            <textarea
              className="writer-subtitle"
              placeholder={t("writer.subtitlePlaceholder")}
              value={subtitle ?? ""}
              rows={1}
              onChange={e => setSubtitle(e.target.value)}
            />

            <div className="writer-mode-toggle">
              <button className={`writer-mode-btn${mode === "block" ? " active" : ""}`} onClick={() => handleModeSwitch("block")}>{t("writer.blockEditorMode")}</button>
              <button className={`writer-mode-btn${mode === "md" ? " active" : ""}`} onClick={() => handleModeSwitch("md")}>{t("writer.markdownMode")}</button>
            </div>

            {mode === "block"
              ? <BlockEditor blocks={blocks} onChange={setBlocks} onImageUpload={handleInlineImageUpload} />
              : (
                <textarea
                  className="writer-markdown"
                  value={markdown}
                  onChange={e => setMarkdown(e.target.value)}
                  placeholder={t("writer.markdownPlaceholder")}
                />
              )
            }
          </div>
        </div>

        {/* Right sidebar */}
        <div className="writer-sidebar">
          <div>
            <div className="writer-sidebar-label">{t("writer.readingTime")}</div>
            <div className="writer-readtime">
              <div>
                <div className="writer-readtime-num">{readTime}</div>
                <div className="writer-readtime-label">{t("writer.minRead")}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>~{wordCount} {t("writer.words")}</div>
            </div>
          </div>

          <div>
            <div className="writer-sidebar-label">{t("writer.tagsLabel", { max: MAX_TAGS })}</div>
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
                  placeholder={tags.length ? "" : t("writer.addTag")}
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
            <div className="writer-tags-hint">{t("writer.tagsHint")}</div>
          </div>

          <div>
            <div className="writer-sidebar-label">{t("writer.series")}</div>
            <select
              className="writer-select"
              value={selectedSeries}
              onChange={e => {
                if (e.target.value === "__new__") { handleCreateSeries(); }
                else setSelectedSeries(e.target.value);
              }}
            >
              <option value="">{t("writer.noSeries")}</option>
              {seriesList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              <option value="__new__">{t("writer.createSeries")}</option>
            </select>
          </div>

          <div>
            <div className="writer-sidebar-label">{t("writer.checklist")}</div>
            <div className="writer-checklist">
              {[
                { done: hasCover,     label: t("writer.checkCover") },
                { done: hasTag,       label: t("writer.checkTag") },
                { done: has300Words,  label: t("writer.check300") },
                { done: hasPullQuote, label: t("writer.checkPullQuote") },
                { done: hasVerseRef,  label: t("writer.checkVerse") },
              ].map(({ done, label }) => (
                <div key={label} className="writer-check-row">
                  <div className={`writer-check-icon${done ? " writer-check-icon--done" : " writer-check-icon--todo"}`}>
                    {done ? "✓" : ""}
                  </div>
                  <span style={{ textDecoration: done ? "line-through" : "none", opacity: done ? 0.6 : 1 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Word goal */}
          <div>
            <div className="writer-sidebar-label">{t("writer.wordGoal")}</div>
            <div className="writer-wordgoal">
              <input
                className="writer-wordgoal-input"
                type="number"
                min={0}
                placeholder="0"
                value={wordGoal || ""}
                onChange={e => {
                  const v = parseInt(e.target.value) || 0;
                  setWordGoal(v);
                  try { localStorage.setItem("nwt-writer-wordgoal", String(v)); } catch { /* ignore */ }
                }}
              />
              <span className="writer-wordgoal-of">{t("writer.wordGoalOf", { count: wordCount })}</span>
            </div>
            {wordGoal > 0 && (
              <div className="writer-progress-bar">
                <div
                  className={`writer-progress-fill${wordCount >= wordGoal ? " writer-progress-fill--done" : ""}`}
                  style={{ width: `${Math.min(100, Math.round((wordCount / wordGoal) * 100))}%` }}
                />
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <div className="writer-sidebar-label">{t("writer.excerptLabel")}</div>
            <textarea
              className="writer-excerpt-input"
              rows={3}
              placeholder={t("writer.excerptPlaceholder")}
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
            />
          </div>

          {/* Slug (only for existing posts) */}
          {postIdRef.current && (
            <div>
              <div className="writer-sidebar-label">{t("writer.slugLabel")}</div>
              <div className="writer-slug-wrap">
                <span className="writer-slug-prefix">/blog/</span>
                <input
                  className="writer-slug-input"
                  value={customSlug}
                  onChange={e => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))}
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {/* Featured toggle */}
          <div className="writer-featured-row">
            <div>
              <div className="writer-sidebar-label" style={{ marginBottom: 2 }}>{t("writer.featured")}</div>
              <div className="writer-featured-sub">{t("writer.featuredSub")}</div>
            </div>
            <button
              className={`writer-toggle${isFeatured ? " writer-toggle--on" : ""}`}
              onClick={() => setIsFeatured(v => !v)}
              aria-label={t("writer.featured")}
            >
              <span className="writer-toggle-knob" />
            </button>
          </div>

          {/* Table of contents */}
          {toc.length > 0 && (
            <div>
              <div className="writer-sidebar-label">{t("writer.toc")}</div>
              <div className="writer-toc">
                {toc.map(h => (
                  <button
                    key={h.id}
                    className={`writer-toc-item${h.type === "h3" ? " writer-toc-item--sub" : ""}`}
                    onClick={() => {
                      const el = Array.from(document.querySelectorAll<HTMLElement>(".be-h2, .be-h3"))
                        .find(node => node.innerText === h.content);
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                  >
                    {h.content || <em style={{ opacity: 0.4 }}>{t("writer.tocEmpty")}</em>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Publish modal — portalled to body so position:fixed works regardless of transforms */}
      {showPublishModal && createPortal(
        <div className="writer-modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="writer-modal" onClick={e => e.stopPropagation()}>
            <div className="writer-modal-icon">🚀</div>
            <h2>{t("writer.publishTitle")}</h2>
            <p className="writer-modal-subtitle">{t("writer.publishSubtitle")}</p>
            <div className="writer-modal-card">
              <div className="writer-modal-row"><strong>{title || t("writer.noTitle")}</strong></div>
              <div className="writer-modal-row">{readTime} {t("writer.minRead")} · {wordCount} {t("writer.words")}</div>
              {tags.length > 0 && <div className="writer-modal-row">🏷 {tags.join(", ")}</div>}
              {selectedSeries && (
                <div className="writer-modal-row">
                  📚 {seriesList.find(s => s.id === selectedSeries)?.title}
                </div>
              )}
            </div>
            <div className="writer-modal-actions">
              <button className="btn" onClick={() => setShowPublishModal(false)}>{t("writer.cancel")}</button>
              <button className="btn btn-primary" onClick={handlePublish}>{t("writer.publishNow")}</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
