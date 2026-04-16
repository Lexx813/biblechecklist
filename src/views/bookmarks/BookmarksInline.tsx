import { useTranslation } from "react-i18next";
import { useBookmarks, useToggleBookmark } from "../../hooks/useBookmarks";
import "../../styles/bookmarks.css";

export default function BookmarksInline({ user, navigate }) {
  const { t } = useTranslation();
  const { data: bookmarksRaw = { threads: [], posts: [] }, isLoading } = useBookmarks(user?.id);
  const bookmarks = bookmarksRaw as { threads: any[]; posts: any[] };
  const toggle = useToggleBookmark(user?.id);

  return (
    <div>
      <div className="bm-header">
        <h1 className="bm-title">{t("bookmarks.title")}</h1>
      </div>

      <div className="bm-content">
        {isLoading ? (
          <>
            {[0, 1].map(section => (
              <section key={section} className="bm-section">
                <div className="skeleton" style={{ height: 16, width: 120, borderRadius: 6, marginBottom: 12 }} />
                <div className="bm-list">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="bm-item" style={{ pointerEvents: "none" }}>
                      <div className="skeleton" style={{ height: 14, flex: 1, borderRadius: 6 }} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : (
          <>
            <section className="bm-section">
              <h2 className="bm-section-title">💬 {t("bookmarks.threads")}</h2>
              {bookmarks.threads.length === 0 ? (
                <p className="bm-empty">{t("bookmarks.emptyThreads")}</p>
              ) : (
                <div className="bm-list">
                  {bookmarks.threads.map(item => (
                    <div key={item.id} className="bm-item" onClick={() => navigate("forum", { categoryId: item.category_id, threadId: item.id })}>
                      <div className="bm-item-body">
                        <span className="bm-item-title">{item.title}</span>
                      </div>
                      <button
                        className="bookmark-btn bookmark-btn--active"
                        onClick={e => { e.stopPropagation(); toggle.mutate({ threadId: item.id }); }}
                        title={t("bookmarks.remove")}
                      >
                        🔖
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bm-section">
              <h2 className="bm-section-title">📝 {t("bookmarks.posts")}</h2>
              {bookmarks.posts.length === 0 ? (
                <p className="bm-empty">{t("bookmarks.emptyPosts")}</p>
              ) : (
                <div className="bm-list">
                  {bookmarks.posts.map(item => (
                    <div key={item.id} className="bm-item" onClick={() => navigate("blog", { slug: item.slug })}>
                      <div className="bm-item-body">
                        <span className="bm-item-title">{item.title}</span>
                        {item.excerpt && <span className="bm-item-excerpt">{item.excerpt}</span>}
                      </div>
                      <button
                        className="bookmark-btn bookmark-btn--active"
                        onClick={e => { e.stopPropagation(); toggle.mutate({ postId: item.id }); }}
                        title={t("bookmarks.remove")}
                      >
                        🔖
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
