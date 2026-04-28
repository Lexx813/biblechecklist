import { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import EmojiPickerPopup, { insertEmojiAtCursor } from "../../components/EmojiPickerPopup";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../../components/ConfirmModal";
import { supabase } from "../../lib/supabase";
import { LANGUAGES } from "../../i18n";
import { parseTranslationStream } from "../../lib/translateStream";
const RichTextEditor = lazy(() => import("../../components/RichTextEditor"));
import { useMyPosts, useCreatePost, useUpdatePost, useDeletePost } from "../../hooks/useBlog";
import { blogApi } from "../../api/blog";
import AppLayout from "../../components/AppLayout";
import "../../styles/blog.css";
import { formatDate } from "../../utils/formatters";

type Translation = { title: string; excerpt: string; content: string };
const EMPTY_FORM = { title: "", excerpt: "", content: "", cover_url: "", published: false, translations: {} as Record<string, Translation> };

// ── Translations tab ──────────────────────────────────────────────────────────
function TranslationsTab({ translations, onChange, primaryLang, postTitle, postExcerpt, postContent, disabled }: {
  translations: Record<string, Translation>;
  onChange: (t: Record<string, Translation>) => void;
  primaryLang: string;
  postTitle: string;
  postExcerpt: string;
  postContent: string;
  disabled: boolean;
}) {
  const availableLangs = LANGUAGES.filter(l => l.code !== primaryLang);
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const current: Translation = activeLang
    ? (translations[activeLang] ?? { title: "", excerpt: "", content: "" })
    : { title: "", excerpt: "", content: "" };

  function setField(field: keyof Translation, value: string) {
    if (!activeLang) return;
    onChange({ ...translations, [activeLang]: { ...current, [field]: value } });
  }

  function removeTranslation() {
    if (!activeLang) return;
    const next = { ...translations };
    delete next[activeLang];
    onChange(next);
    setActiveLang(null);
  }

  async function generate() {
    if (!activeLang) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setGenerating(true);
    setGenError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in required.");

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: postTitle,
          excerpt: postExcerpt,
          content: postContent,
          targetLang: activeLang,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) throw new Error(await res.text().catch(() => "Translation failed."));

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";
      let   accumulated = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const evt = JSON.parse(raw) as { type: string; delta?: { type: string; text: string } };
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
              accumulated += evt.delta.text;
              const parsed = parseTranslationStream(accumulated);
              onChange({ ...translations, [activeLang]: parsed });
            }
          } catch { /* skip malformed SSE chunks */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setGenError((err as Error).message || "Translation failed. Please try again.");
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="translations-tab">
      <div className="translations-lang-pills">
        {availableLangs.map(l => (
          <button
            key={l.code}
            type="button"
            className={[
              "translations-pill",
              activeLang === l.code ? "translations-pill--active" : "",
              translations[l.code] ? "translations-pill--done" : "",
            ].filter(Boolean).join(" ")}
            onClick={() => setActiveLang(l.code)}
          >
            {l.label}
            {translations[l.code] && <span className="translations-pill-dot" aria-hidden="true" />}
          </button>
        ))}
      </div>

      {!activeLang && (
        <p className="translations-empty">Select a language above to add or edit a translation.</p>
      )}

      {activeLang && (
        <div className="translations-editor">
          <div className="translations-generate-row">
            <button
              type="button"
              className="translations-generate-btn"
              onClick={generate}
              disabled={generating || disabled || !postTitle.trim()}
            >
              {generating ? "Generating…" : "Generate with AI"}
            </button>
            {generating && <span className="translations-generating-hint">Translating, fields will fill in as it streams…</span>}
          </div>
          {genError && <div className="blog-editor-error">{genError}</div>}

          <label className="blog-editor-label">Title</label>
          <input
            className="blog-editor-input"
            value={current.title}
            onChange={e => setField("title", e.target.value)}
            disabled={disabled}
            maxLength={150}
          />

          <label className="blog-editor-label">Excerpt</label>
          <textarea
            className="blog-editor-textarea blog-editor-textarea--sm"
            value={current.excerpt}
            onChange={e => setField("excerpt", e.target.value)}
            disabled={disabled}
            maxLength={300}
          />

          <label className="blog-editor-label">Content</label>
          <Suspense fallback={<div style={{ height: 200 }} />}>
            <RichTextEditor
              key={activeLang}
              content={current.content}
              onChange={html => setField("content", html)}
              disabled={disabled}
            />
          </Suspense>

          {translations[activeLang] && (
            <button
              type="button"
              className="translations-remove-btn"
              onClick={removeTranslation}
              disabled={disabled}
            >
              Remove {LANGUAGES.find(l => l.code === activeLang)?.label} translation
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Post editor ───────────────────────────────────────────────────────────────
function PostEditor({ userId, post, onDone }) {
  const { t, i18n } = useTranslation();
  const userLang = i18n?.language?.split("-")[0] ?? "en";

  const initialForm = post
    ? {
        title: post.title,
        excerpt: post.excerpt ?? "",
        content: post.content ?? "",
        cover_url: post.cover_url ?? "",
        published: post.published,
        translations: (post.translations as Record<string, Translation>) ?? {},
      }
    : EMPTY_FORM;

  const [form, setForm] = useState(initialForm);
  const [activeTab, setActiveTab] = useState<"content" | "translations">("content");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showExcerptEmoji, setShowExcerptEmoji] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const fileInputRef = useRef(null);
  const excerptRef = useRef(null);
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function handleBack() {
    if (isDirty) { setDiscardOpen(true); return; }
    onDone();
  }

  const insertExcerptEmoji = useCallback((em) => {
    const next = insertEmojiAtCursor(excerptRef.current, form.excerpt, em);
    set("excerpt", next.slice(0, 300));
    setShowExcerptEmoji(false);
    requestAnimationFrame(() => {
      const el = excerptRef.current;
      if (!el) return;
      const pos = (el.selectionStart ?? form.excerpt.length) + em.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }, [form.excerpt]);
  const createPost = useCreatePost(userId);
  const updatePost = useUpdatePost(userId);

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const url = await blogApi.uploadCover(userId, file);
      setForm(prev => ({ ...prev, cover_url: url }));
    } catch {
      setUploadError(t("blogDash.coverUploadError"));
    } finally {
      setUploading(false);
    }
  }

  const isPending = createPost.isPending || updatePost.isPending;

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave(publish) {
    setError("");
    if (!form.title.trim()) return setError(t("blogDash.errorTitleRequired"));
    const contentEmpty = !form.content || form.content === "<p></p>";
    if (contentEmpty) return setError(t("blogDash.errorContentRequired"));

    const payload = { ...form, published: publish, lang: post?.lang ?? userLang };
    if (post) {
      updatePost.mutate({ postId: post.id, updates: payload }, {
        onSuccess: onDone,
        onError: (e) => setError(e.message),
      });
    } else {
      createPost.mutate(payload, {
        onSuccess: onDone,
        onError: (e) => setError(e.message),
      });
    }
  }

  return (
    <div className="blog-editor">
      <div className="blog-editor-header">
        <button className="back-btn" onClick={handleBack}>{t("blogDash.editorBack")}</button>
        <h2>{post ? t("blogDash.editPostTitle") : t("blogDash.newPostTitle")}</h2>
      </div>

      <div className="blog-editor-tabs-bar">
        <button
          type="button"
          className={`blog-editor-tab${activeTab === "content" ? " blog-editor-tab--active" : ""}`}
          onClick={() => setActiveTab("content")}
        >
          Content
        </button>
        <button
          type="button"
          className={`blog-editor-tab${activeTab === "translations" ? " blog-editor-tab--active" : ""}`}
          onClick={() => setActiveTab("translations")}
        >
          Translations
          {Object.keys(form.translations ?? {}).length > 0 && (
            <span className="blog-editor-tab-badge">{Object.keys(form.translations).length}</span>
          )}
        </button>
      </div>

      {activeTab === "content" && (
        <div className="blog-editor-form">
          <label htmlFor="blog-title" className="blog-editor-label">{t("blogDash.titleLabel")}</label>
          <input
            id="blog-title"
            name="title"
            className="blog-editor-input"
            placeholder={t("blogDash.titlePlaceholder")}
            value={form.title}
            onChange={e => set("title", e.target.value)}
            disabled={isPending}
            maxLength={150}
          />

          <label htmlFor="blog-excerpt" className="blog-editor-label">{t("blogDash.excerptLabel")} <span className="blog-editor-hint">{t("blogDash.excerptHint")}</span></label>
          <div style={{ position: "relative" }}>
            <textarea
              ref={excerptRef}
              id="blog-excerpt"
              name="excerpt"
              className="blog-editor-textarea blog-editor-textarea--sm"
              placeholder={t("blogDash.excerptPlaceholder")}
              value={form.excerpt}
              onChange={e => set("excerpt", e.target.value)}
              disabled={isPending}
              maxLength={300}
            />
            <button
              type="button"
              className="textarea-emoji-btn"
              onClick={() => setShowExcerptEmoji(v => !v)}
              title="Emoji"
              aria-expanded={showExcerptEmoji}
            >😊</button>
            {showExcerptEmoji && (
              <EmojiPickerPopup onSelect={insertExcerptEmoji} onClose={() => setShowExcerptEmoji(false)} align="right" />
            )}
          </div>

          <label htmlFor="blog-cover-url" className="blog-editor-label">{t("blogDash.coverLabel")} <span className="blog-editor-hint">{t("blogDash.coverHint")}</span></label>
          <div className="blog-cover-upload-row">
            {form.cover_url && (
              <img src={form.cover_url} className="blog-cover-preview" alt="cover preview" />
            )}
            <div className="blog-cover-controls">
              <input
                ref={fileInputRef}
                id="blog-cover-upload"
                name="cover"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={handleCoverUpload}
              />
              <button
                type="button"
                className="blog-cover-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending || uploading}
              >
                {uploading ? t("blogDash.coverUploading") : t("blogDash.coverUploadBtn")}
              </button>
              <span className="blog-editor-hint">{t("blogDash.coverOrUrl")}</span>
              <input
                id="blog-cover-url"
                name="cover_url"
                className="blog-editor-input"
                placeholder={t("blogDash.coverPlaceholder")}
                value={form.cover_url}
                onChange={e => {
                  const val = e.target.value.trim();
                  if (!val) { set("cover_url", ""); return; }
                  try {
                    const url = new URL(val);
                    if (url.protocol === "https:") set("cover_url", val);
                  } catch {
                    // not a valid URL yet, allow partial typing only if it could become https://
                    if (val.startsWith("https://")) set("cover_url", val);
                  }
                }}
                disabled={isPending || uploading}
              />
              {uploadError && <div className="blog-editor-error" style={{ marginTop: 4 }}>{uploadError}</div>}
            </div>
          </div>

          <label className="blog-editor-label">{t("blogDash.contentLabel")}</label>
          <Suspense fallback={<div style={{ height: 200 }} />}>
            <RichTextEditor
              content={form.content}
              onChange={html => set("content", html)}
              placeholder={t("blogDash.contentPlaceholder")}
              disabled={isPending}
            />
          </Suspense>

          {error && <div className="blog-editor-error">{error}</div>}

          <div className="blog-editor-actions">
            <button
              className="blog-editor-btn blog-editor-btn--draft"
              onClick={() => handleSave(false)}
              disabled={isPending}
            >
              {isPending ? t("common.saving") : t("blogDash.saveDraft")}
            </button>
            <button
              className="blog-editor-btn blog-editor-btn--publish"
              onClick={() => handleSave(true)}
              disabled={isPending}
            >
              {isPending ? t("common.saving") : post?.published ? t("blogDash.saveKeepPublished") : t("blogDash.savePublish")}
            </button>
          </div>
        </div>
      )}

      {activeTab === "translations" && (
        <div className="blog-editor-form">
          <TranslationsTab
            translations={form.translations ?? {}}
            onChange={tl => set("translations", tl)}
            primaryLang={post?.lang ?? userLang}
            postTitle={form.title}
            postExcerpt={form.excerpt}
            postContent={form.content}
            disabled={isPending}
          />
          <div className="blog-editor-actions">
            <button
              className="blog-editor-btn blog-editor-btn--draft"
              onClick={() => handleSave(false)}
              disabled={isPending}
            >
              {isPending ? t("common.saving") : t("blogDash.saveDraft")}
            </button>
            <button
              className="blog-editor-btn blog-editor-btn--publish"
              onClick={() => handleSave(true)}
              disabled={isPending}
            >
              {isPending ? t("common.saving") : post?.published ? t("blogDash.saveKeepPublished") : t("blogDash.savePublish")}
            </button>
          </div>
        </div>
      )}
      {discardOpen && (
        <ConfirmModal
          message="You have unsaved changes. Leave anyway?"
          confirmLabel="Discard"
          onConfirm={() => { setDiscardOpen(false); onDone(); }}
          onCancel={() => setDiscardOpen(false)}
        />
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function BlogDashboard({ user, onBack, navigate, darkMode, setDarkMode, i18n, onLogout }) {
  const { data: posts = [], isLoading } = useMyPosts(user.id);
  const deletePost = useDeletePost(user.id);
  const [editing, setEditing] = useState(() => {
    try {
      const saved = sessionStorage.getItem("blog:editing");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    try {
      if (editing !== null) sessionStorage.setItem("blog:editing", JSON.stringify(editing));
      else sessionStorage.removeItem("blog:editing");
    } catch {}
  }, [editing]);

  // Upgrade restored post with fresh data once posts load
  useEffect(() => {
    if (!editing || editing === "new" || !posts.length) return;
    const fresh = posts.find(p => p.id === editing.id);
    if (fresh) setEditing(fresh);
  }, [posts]);
  const { t } = useTranslation();

  if (editing !== null) {
    return (
      <AppLayout navigate={navigate} user={user} currentPage="blog">
        <PostEditor
          userId={user.id}
          post={editing === "new" ? null : editing}
          onDone={() => setEditing(null)}
        />
      </AppLayout>
    );
  }

  const published = posts.filter(p => p.published).length;
  const drafts = posts.length - published;

  return (
    <AppLayout navigate={navigate} user={user} currentPage="blog">
    <div className="blog-dash-wrap">
      <header className="blog-dash-header">
        <h1>{t("blogDash.myPostsTitle")}</h1>
        <button className="blog-write-btn" onClick={() => setEditing("new")}>{t("blogDash.newPost")}</button>
      </header>

      <div className="blog-dash-content">
        {/* Stats */}
        <div className="blog-dash-stats">
          <div className="blog-dash-stat">
            <span className="blog-dash-stat-value">{posts.length}</span>
            <span className="blog-dash-stat-label">{t("blogDash.total")}</span>
          </div>
          <div className="blog-dash-stat">
            <span className="blog-dash-stat-value blog-dash-stat-value--green">{published}</span>
            <span className="blog-dash-stat-label">{t("blogDash.published")}</span>
          </div>
          <div className="blog-dash-stat">
            <span className="blog-dash-stat-value blog-dash-stat-value--muted">{drafts}</span>
            <span className="blog-dash-stat-label">{t("blogDash.drafts")}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="blog-dash-list">
            {[0,1,2,3].map(i => (
              <div key={i} className="blog-dash-row" style={{ pointerEvents: "none" }}>
                <div className="blog-dash-row-info">
                  <div className="skeleton" style={{ height: 15, width: "55%", borderRadius: 6 }} />
                  <div className="blog-dash-row-meta" style={{ marginTop: 6 }}>
                    <div className="skeleton" style={{ height: 11, width: 60, borderRadius: 10 }} />
                    <div className="skeleton" style={{ height: 11, width: 80, borderRadius: 6, marginLeft: 8 }} />
                  </div>
                </div>
                <div className="blog-dash-row-actions">
                  <div className="skeleton" style={{ height: 30, width: 50, borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 30, width: 60, borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="blog-empty">
            <div className="blog-empty-icon">✍️</div>
            <h3>{t("blogDash.noPosts")}</h3>
            <p>{t("blogDash.noPostsSub")}</p>
          </div>
        ) : (
          <div className="blog-dash-list">
            {posts.map(post => (
              <div key={post.id} className="blog-dash-row">
                <div className="blog-dash-row-info">
                  <div className="blog-dash-row-title">{post.title}</div>
                  <div className="blog-dash-row-meta">
                    <span className={`blog-status-badge ${post.published ? "blog-status-badge--pub" : "blog-status-badge--draft"}`}>
                      {post.published ? t("blogDash.statusPublished") : t("blogDash.statusDraft")}
                    </span>
                    <span className="blog-dash-row-date">{formatDate(post.updated_at)}</span>
                  </div>
                </div>
                <div className="blog-dash-row-actions">
                  <button className="blog-dash-action-btn" onClick={() => setEditing(post)}>{t("common.edit")}</button>
                  <button
                    className="blog-dash-action-btn blog-dash-action-btn--danger"
                    onClick={() => setConfirmDelete(post)}
                    disabled={deletePost.isPending}
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          message={t("blogDash.deleteConfirm", { title: confirmDelete.title })}
          onConfirm={() => { deletePost.mutate(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
    </AppLayout>
  );
}
