// @ts-nocheck
import { useTranslation } from "react-i18next";
import { useBookmarkIds, useToggleBookmark } from "../../hooks/useBookmarks";
import { toast } from "../../lib/toast";
import "../../styles/bookmarks.css";

export default function BookmarkButton({ userId, threadId, postId, className = "" }) {
  const { t } = useTranslation();
  const { data: ids = { threadIds: [], postIds: [] } } = useBookmarkIds(userId);
  const toggle = useToggleBookmark(userId);

  if (!userId) return null;

  const isBookmarked = threadId
    ? (ids.threadIds ?? []).includes(threadId)
    : (ids.postIds ?? []).includes(postId);

  function handleClick(e) {
    e.stopPropagation();
    toggle.mutate(threadId ? { threadId } : { postId }, {
      onError: () => toast(t("bookmarks.error")),
    });
  }

  return (
    <button
      className={`bookmark-btn${isBookmarked ? " bookmark-btn--active" : ""} ${className}`}
      onClick={handleClick}
      data-tip={isBookmarked ? t("bookmarks.remove") : t("bookmarks.add")}
      disabled={toggle.isPending}
    >
      {isBookmarked
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      }
    </button>
  );
}
