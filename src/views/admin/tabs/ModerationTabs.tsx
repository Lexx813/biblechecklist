import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import ConfirmModal from "../../../components/ConfirmModal";
import {
  useAllBlogPosts, useAdminDeleteBlogPost,
  useAllForumThreads, useAdminDeleteForumThread, useAdminPinThread, useAdminLockThread,
  useAllComments, useAdminDeleteComment,
} from "../../../hooks/useAdmin";
import { useReports, useUpdateReport, useDeleteReport, useDeleteReportedContent } from "../../../hooks/useReports";
import { forumApi } from "../../../api/forum";
import { useCategories } from "../../../hooks/useForum";
import { formatDate } from "../../../utils/formatters";
import { AdminSkeleton } from "./UsersTab";

// ── Reports Tab ───────────────────────────────────────────────────────────────
export function ReportsTab({ navigate }: { navigate: (page: string) => void }) {
  const { t } = useTranslation();
  const { data: reports = [], isLoading } = useReports();
  const updateReport = useUpdateReport();
  const deleteReport = useDeleteReport();
  const deleteContent = useDeleteReportedContent();
  const [confirmDeleteContent, setConfirmDeleteContent] = useState<typeof reports[0] | null>(null);
  const [reportFilter, setReportFilter] = useState("pending");

  const sorted = reportFilter === "all"
    ? [...reports].sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1))
    : reportFilter === "resolved"
      ? reports.filter(r => r.status !== "pending")
      : reports.filter(r => r.status === "pending");

  function handleViewContent(r: typeof reports[0]) {
    if (r.content_type === "post")    navigate("blog");
    if (r.content_type === "comment") navigate("blog");
    if (r.content_type === "thread")  navigate("forum");
    if (r.content_type === "reply")   navigate("forum");
  }

  if (isLoading) return <AdminSkeleton />;

  return (
    <>
      <div className="admin-filter-pills" style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
        {["pending", "resolved", "all"].map(f => (
          <button key={f} className={`admin-filter-pill${reportFilter === f ? " admin-filter-pill--active" : ""}`} onClick={() => setReportFilter(f)}>
            {t(`adminReports.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
            {f === "pending" && reports.filter(r => r.status === "pending").length > 0 &&
              <span style={{ marginLeft: 4 }}>({reports.filter(r => r.status === "pending").length})</span>}
          </button>
        ))}
      </div>

      {sorted.length === 0 && <div className="admin-loading">{t("adminReports.empty")}</div>}

      <div className="admin-report-list">
        {sorted.map(r => (
          <div key={r.id} className={`admin-report-card${r.status !== "pending" ? " admin-report-card--reviewed" : ""}`}>
            <div className="admin-report-meta">
              <span className={`admin-report-type admin-report-type--${r.content_type}`}>{r.content_type}</span>
              <span className={`admin-report-status admin-report-status--${r.status}`}>{r.status}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>{formatDate(r.created_at)}</span>
            </div>
            {r.content_preview && (
              <div className="admin-report-preview">"{r.content_preview}"</div>
            )}
            <div className="admin-report-reason">
              {r.reason ? <><strong>{t("adminReports.reason")}</strong> {r.reason}</> : t("adminReports.noReason")}
            </div>
            <div className="admin-report-reporter">
              {t("adminReports.reportedBy")}: {r.profiles?.display_name || r.profiles?.email || "Unknown"}
            </div>
            <div className="admin-report-actions" style={{ marginTop: 10 }}>
              {r.status === "pending" && (
                <>
                  <button
                    className="admin-action-btn"
                    onClick={() => updateReport.mutate({ reportId: r.id, status: "reviewed" })}
                    disabled={updateReport.isPending}
                  >
                    {t("adminReports.markReviewed")}
                  </button>
                  <button
                    className="admin-action-btn"
                    onClick={() => updateReport.mutate({ reportId: r.id, status: "dismissed" })}
                    disabled={updateReport.isPending}
                  >
                    {t("adminReports.dismiss")}
                  </button>
                </>
              )}
              {r.content_id && (
                <>
                  <button
                    className="admin-action-btn"
                    onClick={() => handleViewContent(r)}
                  >
                    {t("adminReports.viewContent")}
                  </button>
                  <button
                    className="admin-action-btn admin-action-btn--danger"
                    onClick={() => setConfirmDeleteContent(r)}
                    disabled={deleteContent.isPending}
                  >
                    {t("adminReports.deleteContent")}
                  </button>
                </>
              )}
              <button
                className="admin-action-btn admin-action-btn--danger"
                onClick={() => deleteReport.mutate(r.id)}
                disabled={deleteReport.isPending}
              >
                {t("adminReports.delete")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmDeleteContent && (
        <ConfirmModal
          message={`${t("adminReports.deleteContent")}? "${confirmDeleteContent.content_preview ?? ""}". This will permanently remove the content and dismiss the report.`}
          onConfirm={() => {
            deleteContent.mutate({
              reportId: confirmDeleteContent.id,
              contentType: confirmDeleteContent.content_type,
              contentId: confirmDeleteContent.content_id,
            });
            setConfirmDeleteContent(null);
          }}
          onCancel={() => setConfirmDeleteContent(null)}
        />
      )}
    </>
  );
}

// ── Blog Tab ──────────────────────────────────────────────────────────────────
export function BlogTab({ navigate }: { navigate: (page: string) => void }) {
  const { t } = useTranslation();
  const { data: posts = [], isLoading } = useAllBlogPosts();
  const deletePost = useAdminDeleteBlogPost();
  const [confirmDelete, setConfirmDelete] = useState<typeof posts[0] | null>(null);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? posts.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()) || p.profiles?.display_name?.toLowerCase().includes(search.toLowerCase()))
    : posts;

  if (isLoading) return <AdminSkeleton />;

  return (
    <>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
        <input className="admin-input admin-search-input" type="search" placeholder={t("admin.searchUsers")} aria-label={t("admin.searchUsers")} value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? <div className="admin-loading">{t("adminBlog.noPosts")}</div> : (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Date</th>
              <th>{t("admin.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(post => (
              <tr key={post.id}>
                <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {post.title}
                </td>
                <td>{post.profiles?.display_name || "—"}</td>
                <td>
                  <span className={`admin-sub-badge admin-sub-badge--${post.published ? "active" : "none"}`}>
                    {post.published ? t("adminBlog.published") : t("adminBlog.draft")}
                  </span>
                </td>
                <td className="admin-date">{formatDate(post.created_at)}</td>
                <td>
                  <div className="admin-actions">
                    <button className="admin-action-btn" onClick={() => navigate("blog")}>
                      {t("adminReports.viewContent")}
                    </button>
                    <button
                      className="admin-action-btn admin-action-btn--danger"
                      onClick={() => setConfirmDelete(post)}
                      disabled={deletePost.isPending}
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={t("adminBlog.deleteConfirm", { title: confirmDelete.title })}
          onConfirm={() => { deletePost.mutate(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}

// ── Forum Tab ─────────────────────────────────────────────────────────────────
export function ForumTab({ navigate }: { navigate: (page: string) => void }) {
  const { t } = useTranslation();
  const { data: threads = [], isLoading } = useAllForumThreads();
  const deleteThread = useAdminDeleteForumThread();
  const pinThread = useAdminPinThread();
  const lockThread = useAdminLockThread();
  const [confirmDelete, setConfirmDelete] = useState<typeof threads[0] | null>(null);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? threads.filter(th => th.title?.toLowerCase().includes(search.toLowerCase()) || th.profiles?.display_name?.toLowerCase().includes(search.toLowerCase()))
    : threads;

  if (isLoading) return <AdminSkeleton />;

  return (
    <>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
        <input className="admin-input admin-search-input" type="search" placeholder={t("admin.searchUsers")} aria-label={t("admin.searchUsers")} value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? <div className="admin-loading">{t("adminForum.noThreads")}</div> : (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Replies</th>
              <th>Date</th>
              <th>{t("admin.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(thread => (
              <tr key={thread.id}>
                <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {thread.pinned && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label={t("adminForum.pinned")} style={{display:"inline",marginRight:4,flexShrink:0}} aria-hidden="true"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/></svg>}
                  {thread.locked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label={t("adminForum.locked")} style={{display:"inline",marginRight:4,flexShrink:0}} aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                  {thread.title}
                </td>
                <td>{thread.profiles?.display_name || "—"}</td>
                <td>{thread.forum_replies?.[0]?.count ?? 0}</td>
                <td className="admin-date">{formatDate(thread.created_at)}</td>
                <td>
                  <div className="admin-actions">
                    <button className="admin-action-btn" onClick={() => navigate("forum")}>
                      {t("adminReports.viewContent")}
                    </button>
                    <button
                      className={`admin-action-btn ${thread.pinned ? "admin-action-btn--active" : ""}`}
                      onClick={() => pinThread.mutate({ threadId: thread.id, value: !thread.pinned })}
                      disabled={pinThread.isPending}
                    >
                      {thread.pinned ? t("adminForum.unpin") : t("adminForum.pin")}
                    </button>
                    <button
                      className={`admin-action-btn ${thread.locked ? "admin-action-btn--active" : ""}`}
                      onClick={() => lockThread.mutate({ threadId: thread.id, value: !thread.locked })}
                      disabled={lockThread.isPending}
                    >
                      {thread.locked ? t("adminForum.unlock") : t("adminForum.lock")}
                    </button>
                    <button
                      className="admin-action-btn admin-action-btn--danger"
                      onClick={() => setConfirmDelete(thread)}
                      disabled={deleteThread.isPending}
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={t("adminForum.deleteConfirm", { title: confirmDelete.title })}
          onConfirm={() => { deleteThread.mutate(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}

// ── Forum Categories Tab ──────────────────────────────────────────────────────
export function ForumCategoriesTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading } = useCategories();
  const [form, setForm] = useState({ icon: "", name: "", description: "", sort_order: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<typeof categories[0] | null>(null);

  function resetForm() { setForm({ icon: "", name: "", description: "", sort_order: "" }); setEditId(null); setError(""); }

  function startEdit(cat: typeof categories[0]) {
    setEditId(cat.id);
    setForm({ icon: cat.icon ?? "", name: cat.name ?? "", description: cat.description ?? "", sort_order: String(cat.sort_order ?? "") });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    setSaving(true);
    try {
      const payload = { icon: form.icon.trim(), name: form.name.trim(), description: form.description.trim(), sort_order: Number(form.sort_order) || 0 };
      if (editId) await forumApi.updateCategory(editId, payload);
      else await forumApi.createCategory(payload.icon, payload.name, payload.description, payload.sort_order);
      queryClient.invalidateQueries({ queryKey: ["forum", "categories"] });
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(catId: string) {
    setSaving(true);
    try {
      await forumApi.deleteCategory(catId);
      queryClient.invalidateQueries({ queryKey: ["forum", "categories"] });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  }

  if (isLoading) return <AdminSkeleton />;

  return (
    <>
      <div className="admin-forum-cats">
        <form className="admin-cat-form" onSubmit={handleSave}>
          <h3 className="admin-cat-form-title">{editId ? t("admin.editCategory") : t("admin.createCategory")}</h3>
          <div className="admin-cat-form-row">
            <input className="admin-input" placeholder="Icon (emoji)" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} style={{ width: 80 }} aria-label="Category icon" />
            <input className="admin-input" placeholder={t("admin.categoryName")} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ flex: 1 }} required aria-label="Category name" />
            <input className="admin-input" placeholder={t("admin.categoryOrder")} aria-label={t("admin.categoryOrder")} type="number" inputMode="numeric" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} style={{ width: 80 }} />
          </div>
          <input className="admin-input" placeholder={t("admin.categoryDescription")} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} aria-label="Category description" />
          {error && <div className="admin-error">{error}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="admin-save-btn" type="submit" disabled={saving}>{saving ? t("common.saving") : editId ? t("common.save") : t("admin.createCategory")}</button>
            {editId && <button type="button" className="admin-cancel-btn" onClick={resetForm}>{t("common.cancel")}</button>}
          </div>
        </form>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Icon</th><th>Name</th><th>Description</th><th>Order</th><th>Threads</th><th>{t("admin.colActions")}</th></tr></thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td style={{ fontSize: 20 }}>{cat.icon}</td>
                  <td>{cat.name}</td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.description}</td>
                  <td>{cat.sort_order}</td>
                  <td>{cat.forum_threads?.[0]?.count ?? 0}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-action-btn" onClick={() => startEdit(cat)}>{t("common.edit")}</button>
                      <button className="admin-action-btn admin-action-btn--danger" onClick={() => setConfirmDelete(cat)} disabled={saving}>{t("common.delete")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          message={`Delete category "${confirmDelete.name}"? All threads in it will also be deleted.`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}

// ── Blog Comments Tab ─────────────────────────────────────────────────────────
export function BlogCommentsTab() {
  const { t } = useTranslation();
  const { data: comments = [], isLoading } = useAllComments();
  const deleteComment = useAdminDeleteComment();
  const [confirmDelete, setConfirmDelete] = useState<typeof comments[0] | null>(null);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? comments.filter(c =>
        c.content?.toLowerCase().includes(search.toLowerCase()) ||
        c.profiles?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.blog_posts?.title?.toLowerCase().includes(search.toLowerCase())
      )
    : comments;

  if (isLoading) return <AdminSkeleton />;

  return (
    <>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
        <input className="admin-input admin-search-input" type="search" placeholder={t("admin.searchUsers")} aria-label={t("admin.searchUsers")} value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <div className="admin-loading">{t("adminComments.noComments")}</div>
      ) : (
        <div className="admin-report-list">
          {filtered.map(c => (
            <div key={c.id} className="admin-report-card">
              <div className="admin-report-meta">
                <span className="admin-report-type admin-report-type--comment">{t("adminComments.comment")}</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {c.profiles?.display_name || "Unknown"} {t("adminComments.on")} <em>{c.blog_posts?.title || "—"}</em>
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>{formatDate(c.created_at)}</span>
              </div>
              <div className="admin-report-preview">"{c.content?.slice(0, 200)}"</div>
              <div className="admin-report-actions" style={{ marginTop: 8 }}>
                <button
                  className="admin-action-btn admin-action-btn--danger"
                  onClick={() => setConfirmDelete(c)}
                  disabled={deleteComment.isPending}
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={t("adminComments.deleteConfirm")}
          onConfirm={() => { deleteComment.mutate(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
