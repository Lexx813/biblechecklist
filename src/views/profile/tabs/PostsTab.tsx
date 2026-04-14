import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import EmojiPickerPopup, { insertEmojiAtCursor } from "../../../components/EmojiPickerPopup";
import { useUserPosts, useCreatePost, useDeletePost } from "../../../hooks/usePosts";

const MAX_POST = 500;

interface Props {
  profileId: string;
  isOwner: boolean;
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="pf-infotip" tabIndex={0} aria-label={text} title={text}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    </span>
  );
}

export default function PostsTab({ profileId, isOwner }: Props) {
  const { t } = useTranslation();
  const { data: posts = [], isLoading } = useUserPosts(profileId);
  const createPost = useCreatePost(profileId);
  const deletePost = useDeletePost(profileId);
  const [draft, setDraft] = useState("");
  const [showPostEmoji, setShowPostEmoji] = useState(false);
  const postRef = useRef<HTMLTextAreaElement>(null);

  const insertPostEmoji = useCallback((em: string) => {
    const next = insertEmojiAtCursor(postRef.current, draft, em).slice(0, MAX_POST);
    setDraft(next);
    setShowPostEmoji(false);
    requestAnimationFrame(() => {
      const el = postRef.current;
      if (!el) return;
      const pos = Math.min((el.selectionStart ?? draft.length) + em.length, MAX_POST);
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }, [draft]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || trimmed.length > MAX_POST) return;
    createPost.mutate(trimmed, { onSuccess: () => setDraft("") });
  }

  function formatPostDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-5">
      <div className="pf-section-header">
        <h2>💬 {t("posts.sectionTitle")} <InfoTip text={t("profile.postsTip")} /></h2>
      </div>

      {isOwner && (
        <form className="post-composer" onSubmit={handleSubmit}>
          <div style={{ position: "relative" }}>
            <textarea
              ref={postRef}
              id="post-composer"
              name="content"
              className="post-composer-input"
              placeholder={t("posts.placeholder")}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              maxLength={MAX_POST}
              rows={3}
            />
            <button type="button" className="textarea-emoji-btn" onClick={() => setShowPostEmoji(v => !v)} title="Emoji">😊</button>
            {showPostEmoji && <EmojiPickerPopup onSelect={insertPostEmoji} onClose={() => setShowPostEmoji(false)} align="right" />}
          </div>
          <div className="post-composer-footer">
            <span className={`post-composer-count${draft.length > MAX_POST - 50 ? " post-composer-count--warn" : ""}`}>
              {draft.length}/{MAX_POST}
            </span>
            <button
              className="post-composer-btn"
              type="submit"
              disabled={!draft.trim() || createPost.isPending}
            >
              {createPost.isPending ? t("common.saving") : t("posts.share")}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="post-list">
          {[0, 1, 2].map(i => (
            <div key={i} className="post-card" style={{ pointerEvents: "none" }}>
              <div className="skeleton" style={{ height: 13, width: "100%", borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 13, width: "80%", borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 11, width: 80, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="pf-empty">{isOwner ? t("posts.emptyOwner") : t("posts.emptyOther")}</p>
      ) : (
        <div className="post-list">
          {posts.map((post: any) => (
            <div key={post.id} className="post-card">
              <p className="post-card-content">{post.content}</p>
              <div className="post-card-footer">
                <span className="post-card-date">{formatPostDate(post.created_at)}</span>
                {isOwner && (
                  <button
                    className="post-card-delete"
                    onClick={() => deletePost.mutate(post.id)}
                    disabled={deletePost.isPending}
                    title={t("common.delete")}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
