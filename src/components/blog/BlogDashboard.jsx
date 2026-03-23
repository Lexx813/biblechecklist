import { useState } from "react";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../ConfirmModal";
import { useMyPosts, useCreatePost, useUpdatePost, useDeletePost } from "../../hooks/useBlog";
import "../../styles/blog.css";

const EMPTY_FORM = { title: "", excerpt: "", content: "", cover_url: "", published: false };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ── Post editor ───────────────────────────────────────────────────────────────
function PostEditor({ userId, post, onDone }) {
  const [form, setForm] = useState(post
    ? { title: post.title, excerpt: post.excerpt, content: post.content, cover_url: post.cover_url ?? "", published: post.published }
    : EMPTY_FORM
  );
  const [error, setError] = useState("");
  const { t } = useTranslation();
  const createPost = useCreatePost(userId);
  const updatePost = useUpdatePost(userId);

  const isPending = createPost.isPending || updatePost.isPending;

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave(publish) {
    setError("");
    if (!form.title.trim()) return setError(t("blogDash.errorTitleRequired"));
    if (!form.content.trim()) return setError(t("blogDash.errorContentRequired"));

    const payload = { ...form, published: publish };
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
        <button className="blog-back-btn" onClick={onDone}>{t("blogDash.editorBack")}</button>
        <h2>{post ? t("blogDash.editPostTitle") : t("blogDash.newPostTitle")}</h2>
      </div>

      <div className="blog-editor-form">
        <label className="blog-editor-label">{t("blogDash.titleLabel")}</label>
        <input
          className="blog-editor-input"
          placeholder={t("blogDash.titlePlaceholder")}
          value={form.title}
          onChange={e => set("title", e.target.value)}
          disabled={isPending}
        />

        <label className="blog-editor-label">{t("blogDash.excerptLabel")} <span className="blog-editor-hint">{t("blogDash.excerptHint")}</span></label>
        <textarea
          className="blog-editor-textarea blog-editor-textarea--sm"
          placeholder={t("blogDash.excerptPlaceholder")}
          value={form.excerpt}
          onChange={e => set("excerpt", e.target.value)}
          disabled={isPending}
        />

        <label className="blog-editor-label">{t("blogDash.coverLabel")} <span className="blog-editor-hint">{t("blogDash.coverHint")}</span></label>
        <input
          className="blog-editor-input"
          placeholder={t("blogDash.coverPlaceholder")}
          value={form.cover_url}
          onChange={e => set("cover_url", e.target.value)}
          disabled={isPending}
        />

        <label className="blog-editor-label">{t("blogDash.contentLabel")}</label>
        <textarea
          className="blog-editor-textarea blog-editor-textarea--lg"
          placeholder={t("blogDash.contentPlaceholder")}
          value={form.content}
          onChange={e => set("content", e.target.value)}
          disabled={isPending}
        />

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
export default function BlogDashboard({ user, onBack }) {
  const { data: posts = [], isLoading } = useMyPosts(user.id);
  const deletePost = useDeletePost(user.id);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { t } = useTranslation();

  if (editing !== null) {
    return (
      <PostEditor
        userId={user.id}
        post={editing === "new" ? null : editing}
        onDone={() => setEditing(null)}
      />
    );
  }

  const published = posts.filter(p => p.published).length;
  const drafts = posts.length - published;

  return (
    <div className="blog-dash-wrap">
      <header className="blog-dash-header">
        <button className="blog-back-btn" onClick={onBack}>{t("common.back")}</button>
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
          <div className="blog-loading"><div className="blog-spinner" /></div>
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
  );
}
