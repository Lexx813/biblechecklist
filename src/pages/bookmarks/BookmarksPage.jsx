import { useTranslation } from "react-i18next";
import PageNav from "../../components/PageNav";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useBookmarks, useToggleBookmark } from "../../hooks/useBookmarks";
import "../../styles/bookmarks.css";

export default function BookmarksPage({ user, onBack, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { t } = useTranslation();
  const { data: bookmarks = { threads: [], posts: [] }, isLoading } = useBookmarks(user?.id);
  const toggle = useToggleBookmark(user?.id);

  return (
    <div className="bm-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout}  onUpgrade={onUpgrade}/>
      <div className="bm-header">
        <button className="blog-back-btn" onClick={onBack}>{t("common.back")}</button>
        <h1 className="bm-title">{t("bookmarks.title")}</h1>
      </div>

      <div className="bm-content">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <section className="bm-section">
              <h2 className="bm-section-title">💬 {t("bookmarks.threads")}</h2>
              {bookmarks.threads.length === 0 ? (
                <p className="bm-empty">{t("bookmarks.emptyThreads")}</p>
              ) : (
                <div className="bm-list">
                  {bookmarks.threads.map(item => (
                    <div
                      key={item.id}
                      className="bm-item"
                      onClick={() => navigate("forum", { categoryId: item.category_id, threadId: item.id })}
                    >
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
                    <div
                      key={item.id}
                      className="bm-item"
                      onClick={() => navigate("blog", { slug: item.slug })}
                    >
                      <div className="bm-item-body">
                        <span className="bm-item-title">{item.title}</span>
                        {item.excerpt && (
                          <span className="bm-item-excerpt">{item.excerpt}</span>
                        )}
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
