// @ts-nocheck
import { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import EmojiPickerPopup, { insertEmojiAtCursor } from "../../components/EmojiPickerPopup";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../../components/ConfirmModal";
const RichTextEditor = lazy(() => import("../../components/RichTextEditor"));
import LoadingSpinner from "../../components/LoadingSpinner";
import { useMyPosts, useCreatePost, useUpdatePost, useDeletePost } from "../../hooks/useBlog";
import { blogApi } from "../../api/blog";
import AppLayout from "../../components/AppLayout";
import "../../styles/blog.css";
import { formatDate } from "../../utils/formatters";

const EMPTY_FORM = { title: "", excerpt: "", content: "", cover_url: "", published: false };

// ── Post editor ───────────────────────────────────────────────────────────────
function PostEditor({ userId, post, onDone }) {
  const initialForm = post
    ? { title: post.title, excerpt: post.excerpt, content: post.content, cover_url: post.cover_url ?? "", published: post.published }
    : EMPTY_FORM;
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showExcerptEmoji, setShowExcerptEmoji] = useState(false);
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
    if (isDirty && !window.confirm("You have unsaved changes. Leave anyway?")) return;
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
  const { t, i18n } = useTranslation();
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

    const userLang = i18n?.language?.split("-")[0] ?? "en";
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
                  // not a valid URL yet — allow partial typing only if it could become https://
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
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function BlogDashboard({ user, onBack, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
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
          <LoadingSpinner />
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
