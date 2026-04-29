import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useMyPosts, useDeletePost } from "../../hooks/useBlog";
import { formatDate } from "../../utils/formatters";
import "../../styles/my-posts.css";

const COVER_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6",
];
function hashId(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
function coverColor(id: string) {
  return COVER_COLORS[hashId(id) % COVER_COLORS.length];
}

const PAGE_SIZE = 10;

interface Props {
  user: { id: string };
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function MyPostsPage({ user, navigate }: Props) {
  const { t } = useTranslation();
  const { data: posts = [], isLoading } = useMyPosts(user.id);
  const deletePost = useDeletePost(user.id);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "published" | "drafts">("all");
  const [page, setPage] = useState(1);

  const filtered = posts.filter(p => {
    if (filter === "published") return p.published;
    if (filter === "drafts") return !p.published;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const published = posts.filter(p => p.published).length;
  const drafts = posts.filter(p => !p.published).length;

  function handleFilterChange(f: "all" | "published" | "drafts") {
    setFilter(f);
    setPage(1);
  }

  async function handleDelete(id: string) {
    await deletePost.mutateAsync(id);
    setConfirmId(null);
    if (paginated.length === 1 && page > 1) setPage(p => p - 1);
  }

  return (
    <div className="mpp-wrap">
      <div className="mpp-header">
        <div className="mpp-header-top">
          <h1 className="mpp-title">{t("blog.myPosts")}</h1>
          <button className="mpp-new-btn" onClick={() => navigate("blogNew")}>{t("blog.newPost")}</button>
        </div>
        <div className="mpp-stats">
          <span className="mpp-stat">{t("blog.totalCount", { count: posts.length })}</span>
          <span className="mpp-stat mpp-stat--pub">{t("blog.publishedCount", { count: published })}</span>
          <span className="mpp-stat mpp-stat--draft">{t("blog.draftsCount", { count: drafts })}</span>
        </div>
        <div className="mpp-filters">
          {(["all", "published", "drafts"] as const).map(f => (
            <button
              key={f}
              className={`mpp-filter${filter === f ? " active" : ""}`}
              onClick={() => handleFilterChange(f)}
            >
              {f === "all" ? t("blog.filterAll") : f === "published" ? t("blog.filterPublished") : t("blog.filterDrafts")}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mpp-empty">{t("blog.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="mpp-empty">
          {filter === "all"
            ? t("blog.noneYet")
            : filter === "drafts"
            ? t("blog.noDraftsSaved")
            : t("blog.noPublished")}
          {filter !== "published" && (
            <button className="mpp-new-btn mpp-new-btn--inline" onClick={() => navigate("blogNew")}>
              {t("blog.writeFirst")}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mpp-list">
            {paginated.map(post => (
              <div key={post.id} className="mpp-card">
                <div
                  className="mpp-card-cover"
                  style={
                    post.cover_url
                      ? { backgroundImage: `url(${post.cover_url})` }
                      : { background: coverColor(post.id) }
                  }
                />
                <div className="mpp-card-body">
                  <div className="mpp-card-top">
                    <span className={`mpp-badge ${post.published ? "mpp-badge--pub" : "mpp-badge--draft"}`}>
                      {post.published ? t("blog.published") : t("blog.draft")}
                    </span>
                    <span className="mpp-card-date">{formatDate(post.created_at, "short")}</span>
                  </div>
                  <h2 className="mpp-card-title">{post.title}</h2>
                  {post.excerpt && <p className="mpp-card-excerpt">{post.excerpt}</p>}
                  <div className="mpp-card-actions">
                    {post.published && (
                      <button
                        className="mpp-action mpp-action--view"
                        onClick={() => navigate("blog", { slug: post.slug })}
                      >
                        {t("blog.viewBtnLabel")}
                      </button>
                    )}
                    <button
                      className="mpp-action mpp-action--edit"
                      onClick={() => navigate("blogEdit", { slug: post.slug })}
                    >
                      {t("blog.editBtn")}
                    </button>
                    <button
                      className="mpp-action mpp-action--delete"
                      onClick={() => setConfirmId(post.id)}
                    >
                      {t("blog.deleteBtn")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mpp-pagination">
              <button
                className="mpp-page-btn"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                {t("blog.prevPage")}
              </button>
              <span className="mpp-page-info">{t("blog.pageOf", { page, total: totalPages })}</span>
              <button
                className="mpp-page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                {t("blog.nextPage")}
              </button>
            </div>
          )}
        </>
      )}

      {confirmId && createPortal(
        <div className="mpp-overlay" onClick={() => setConfirmId(null)}>
          <div className="mpp-confirm" onClick={e => e.stopPropagation()}>
            <p>{t("blog.deletePostConfirm")}</p>
            <div className="mpp-confirm-actions">
              <button className="mpp-action mpp-action--edit" onClick={() => setConfirmId(null)}>{t("common.cancel")}</button>
              <button className="mpp-action mpp-action--delete" onClick={() => handleDelete(confirmId)}>{t("common.delete")}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
