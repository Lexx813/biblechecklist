import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserPosts, useCreatePost, useDeletePost } from "../../../hooks/usePosts";
import CreatePostModal from "../../../components/CreatePostModal";
import ConfirmModal from "../../../components/ConfirmModal";
import Button from "../../../components/ui/Button";

interface Props {
  profileId: string;
  isOwner: boolean;
}

/* ── PostsTab ───────────────────────────────────────────── */

export default function PostsTab({ profileId, isOwner }: Props) {
  const { t } = useTranslation();
  const { data: posts = [], isLoading } = useUserPosts(profileId, !isOwner);
  const createPost = useCreatePost(profileId);
  const deletePost = useDeletePost(profileId);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function handleCreate(content: string, visibility: "public" | "friends", imageUrl?: string) {
    createPost.mutate({ content, visibility, imageUrl }, { onSuccess: () => setShowModal(false) });
  }

  function formatPostDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {t("posts.sectionTitle")}
        </h2>
        {isOwner && (
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            + New Post
          </Button>
        )}
      </div>

      {/* Composer trigger (inline prompt) */}
      {isOwner && (
        <button
          type="button"
          className="mt-4 w-full cursor-pointer rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-left text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--hover-bg)]"
          onClick={() => setShowModal(true)}
        >
          {t("posts.placeholder")}
        </button>
      )}

      {/* Post list */}
      {isLoading ? (
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-[var(--radius)] border border-[var(--border)] p-4">
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton mt-2 h-4 w-4/5 rounded" />
              <div className="skeleton mt-3 h-3 w-20 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          {isOwner ? t("posts.emptyOwner") : t("posts.emptyOther")}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {posts.map((post: any) => (
            <div key={post.id} className="group rounded-[var(--radius)] border border-[var(--border)] p-4 transition-colors hover:border-[var(--border)]">
              {/* Content — render HTML from rich editor, or plain text */}
              <div
                className="text-sm leading-relaxed text-[var(--text-secondary)] [&_a]:text-[var(--accent)] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--accent)]/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[var(--text-muted)] [&_strong]:font-bold [&_strong]:text-[var(--text-primary)]"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt=""
                  className="mt-3 w-full rounded-lg border border-[var(--border)] object-contain"
                  style={{ maxHeight: 500 }}
                />
              )}
              {/* Footer */}
              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="text-xs text-[var(--text-muted)]">{formatPostDate(post.created_at)}</span>
                  {post.visibility === "friends" && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/10 px-1.5 py-px text-[10px] font-semibold text-green-400" title="Friends only">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      Friends
                    </span>
                  )}
                </span>
                {isOwner && (
                  <button
                    className="cursor-pointer rounded-md border-none bg-transparent p-1.5 text-[var(--text-muted)] opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                    onClick={() => setDeleteId(post.id)}
                    disabled={deletePost.isPending}
                    title={t("common.delete")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create post modal */}
      {showModal && (
        <CreatePostModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
          isPending={createPost.isPending}
          userId={profileId}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <ConfirmModal
          message={t("posts.deleteConfirm", { defaultValue: "Are you sure you want to delete this post? This action cannot be undone." })}
          onCancel={() => setDeleteId(null)}
          onConfirm={() => {
            deletePost.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
          }}
          confirmLabel={t("common.delete")}
          danger
        />
      )}
    </div>
  );
}
