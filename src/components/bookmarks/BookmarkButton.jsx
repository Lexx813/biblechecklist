import { useTranslation } from "react-i18next";
import { useBookmarkIds, useToggleBookmark } from "../../hooks/useBookmarks";
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
    toggle.mutate(threadId ? { threadId } : { postId });
  }

  return (
    <button
      className={`bookmark-btn${isBookmarked ? " bookmark-btn--active" : ""} ${className}`}
      onClick={handleClick}
      title={isBookmarked ? t("bookmarks.remove") : t("bookmarks.add")}
      disabled={toggle.isPending}
    >
      {isBookmarked ? "🔖" : "🏷️"}
    </button>
  );
}
