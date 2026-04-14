import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useUserPosts, useCreatePost, useDeletePost } from "../../../hooks/usePosts";
import { postsApi } from "../../../api/posts";
import RichTextEditor from "../../../components/RichTextEditor";
import Button from "../../../components/ui/Button";

interface Props {
  profileId: string;
  isOwner: boolean;
}

/* ── Create Post Modal ──────────────────────────────────── */

function CreatePostModal({ onClose, onSubmit, isPending, userId }: {
  onClose: () => void;
  onSubmit: (content: string, visibility: "public" | "friends", imageUrl?: string) => void;
  isPending: boolean;
  userId: string;
}) {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "friends">("public");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const stripped = content.replace(/<[^>]*>/g, "").trim();
  const isEmpty = !stripped && !imageFile;

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit() {
    if (isEmpty) return;
    let imageUrl: string | undefined;
    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await postsApi.uploadImage(userId, imageFile);
      } catch {
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    onSubmit(content, visibility, imageUrl);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[560px] flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Create Post</h3>
          <button
            className="flex size-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
            onClick={onClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Editor */}
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder={t("posts.placeholder")}
          minimal
        />

        {/* Image preview */}
        {imagePreview && (
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="max-h-[200px] rounded-lg border border-[var(--border)] object-cover" />
            <button
              type="button"
              className="absolute right-2 top-2 flex size-7 cursor-pointer items-center justify-center rounded-full border-none bg-black/60 text-white transition-colors hover:bg-black/80"
              onClick={removeImage}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageSelect} />

        {/* Footer: image + visibility + submit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex size-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-[var(--text-muted)] transition-colors hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
              onClick={() => fileRef.current?.click()}
              title="Add image"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
            <button
              type="button"
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                visibility === "public"
                  ? "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-green-500/30 bg-green-500/10 text-green-400"
              }`}
              onClick={() => setVisibility(v => v === "public" ? "friends" : "public")}
              title={visibility === "public" ? "Visible to everyone" : "Visible to friends only"}
            >
              {visibility === "public" ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              )}
              {visibility === "public" ? "Public" : "Friends only"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              loading={isPending || uploading}
              disabled={isEmpty || isPending || uploading}
            >
              {t("posts.share")}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── PostsTab ───────────────────────────────────────────── */

export default function PostsTab({ profileId, isOwner }: Props) {
  const { t } = useTranslation();
  const { data: posts = [], isLoading } = useUserPosts(profileId, !isOwner);
  const createPost = useCreatePost(profileId);
  const deletePost = useDeletePost(profileId);
  const [showModal, setShowModal] = useState(false);

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
                  className="mt-3 max-h-[400px] w-full rounded-lg border border-[var(--border)] object-cover"
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
                    onClick={() => deletePost.mutate(post.id)}
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
    </div>
  );
}
