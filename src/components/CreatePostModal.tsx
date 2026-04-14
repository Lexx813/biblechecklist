import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { postsApi } from "../api/posts";
import RichTextEditor from "./RichTextEditor";
import Button from "./ui/Button";

interface CreatePostModalProps {
  onClose: () => void;
  onSubmit: (content: string, visibility: "public" | "friends", imageUrl?: string) => void;
  isPending: boolean;
  userId: string;
  avatarUrl?: string | null;
  displayName?: string;
}

export default function CreatePostModal({ onClose, onSubmit, isPending, userId, avatarUrl, displayName }: CreatePostModalProps) {
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

  const initials = displayName ? displayName[0].toUpperCase() : "?";

  return createPortal(
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[560px] flex-col rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Create post</h3>
          <button
            className="flex size-8 cursor-pointer items-center justify-center rounded-full border-none bg-[var(--hover-bg)] text-[var(--text-muted)] transition-colors hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
            onClick={onClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Author row */}
        <div className="flex items-center gap-3 px-5 pt-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-10 rounded-full object-cover" />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-sm font-bold text-white">{initials}</div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--text-primary)]">{displayName || "You"}</span>
            <button
              type="button"
              className={`mt-0.5 flex w-fit cursor-pointer items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                visibility === "public"
                  ? "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "border-green-500/30 bg-green-500/10 text-green-400"
              }`}
              onClick={() => setVisibility(v => v === "public" ? "friends" : "public")}
            >
              {visibility === "public" ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              )}
              {visibility === "public" ? "Public" : "Friends only"}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="px-5 py-3">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder={t("posts.placeholder")}
            minimal
          />
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className="relative px-5 pb-2">
            <img src={imagePreview} alt="Preview" className="w-full rounded-lg border border-[var(--border)] object-contain" style={{ maxHeight: 260 }} />
            <button
              type="button"
              className="absolute right-7 top-2 flex size-7 cursor-pointer items-center justify-center rounded-full border-none bg-black/60 text-white transition-colors hover:bg-black/80"
              onClick={removeImage}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImageSelect} />

        {/* Add to your post bar */}
        <div className="mx-5 mb-3 flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-2.5">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Add to your post</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex size-9 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-green-400 transition-colors hover:bg-green-500/10"
              onClick={() => fileRef.current?.click()}
              title="Photo"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="px-5 pb-4">
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={isPending || uploading}
            disabled={isEmpty || isPending || uploading}
            className="w-full"
          >
            Post
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
