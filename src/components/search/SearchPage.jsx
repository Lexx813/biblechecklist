import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BOOKS } from "../../data/books";
import PageNav from "../PageNav";
import { useSearch } from "../../hooks/useSearch";
import "../../styles/search.css";

export default function SearchPage({ user, onBack, navigate, darkMode, setDarkMode, i18n }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useState(null);

  function handleInput(val) {
    setQuery(val);
    if (timerRef[0]) clearTimeout(timerRef[0]);
    timerRef[0] = setTimeout(() => setDebouncedQuery(val), 300);
  }

  const { data: results, isLoading } = useSearch(debouncedQuery);

  const bookResults = useMemo(() => {
    if (debouncedQuery.trim().length < 2) return [];
    const q = debouncedQuery.toLowerCase();
    return BOOKS.map((b, i) => ({ ...b, index: i, localName: t(`bookNames.${i}`) }))
      .filter(b =>
        b.localName.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.abbr.toLowerCase().includes(q)
      );
  }, [debouncedQuery, t]);

  const posts = results?.posts ?? [];
  const threads = results?.threads ?? [];
  const hasResults = bookResults.length > 0 || posts.length > 0 || threads.length > 0;
  const isTyping = debouncedQuery.trim().length >= 2;

  return (
    <div className="search-page">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} />

      <div className="search-hero">
        <button className="blog-back-btn search-back-btn" onClick={onBack}>{t("common.back")}</button>
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder={t("search.placeholder")}
            value={query}
            onChange={e => handleInput(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16 }}
              onClick={() => { setQuery(""); setDebouncedQuery(""); }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="search-results">
        {!isTyping ? (
          <p className="search-hint">{t("search.typeToSearch")}</p>
        ) : isLoading ? (
          <div className="blog-loading"><div className="blog-spinner" /></div>
        ) : !hasResults ? (
          <p className="search-hint">{t("search.noResults", { query: debouncedQuery })}</p>
        ) : (
          <>
            {bookResults.length > 0 && (
              <section className="search-section">
                <h3 className="search-section-title">📖 {t("search.booksSection")}</h3>
                {bookResults.map(b => (
                  <div key={b.index} className="search-result" onClick={() => navigate("main")}>
                    <span className="search-result-icon">📖</span>
                    <div className="search-result-body">
                      <span className="search-result-title">{b.localName}</span>
                      <span className="search-result-sub">{b.chapters} chapters</span>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {posts.length > 0 && (
              <section className="search-section">
                <h3 className="search-section-title">📝 {t("search.postsSection")}</h3>
                {posts.map(p => (
                  <div key={p.id} className="search-result" onClick={() => navigate("blog", { slug: p.slug })}>
                    <span className="search-result-icon">📝</span>
                    <div className="search-result-body">
                      <span className="search-result-title">{p.title}</span>
                      {p.excerpt && <span className="search-result-sub">{p.excerpt}</span>}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {threads.length > 0 && (
              <section className="search-section">
                <h3 className="search-section-title">💬 {t("search.threadsSection")}</h3>
                {threads.map(th => (
                  <div
                    key={th.id}
                    className="search-result"
                    onClick={() => navigate("forum", { categoryId: th.category_id, threadId: th.id })}
                  >
                    <span className="search-result-icon">💬</span>
                    <div className="search-result-body">
                      <span className="search-result-title">{th.title}</span>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
