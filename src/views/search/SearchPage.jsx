import { useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { BOOKS } from "../../data/books";
import PageNav from "../../components/PageNav";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useSearch, useSemanticSearch } from "../../hooks/useSearch";
import "../../styles/search.css";

export default function SearchPage({ user, onBack, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isPending, setIsPending] = useState(false);
  const timerRef = useRef(null);

  function handleInput(val) {
    setQuery(val);
    setIsPending(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(val);
      setIsPending(false);
    }, 350);
  }

  const { data: results, isLoading } = useSearch(debouncedQuery);
  const { data: semantic } = useSemanticSearch(debouncedQuery);

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
  const users = results?.users ?? [];
  const semanticVerses = semantic?.verses ?? [];
  const hasResults = bookResults.length > 0 || posts.length > 0 || threads.length > 0 || semanticVerses.length > 0 || users.length > 0;
  const isTyping = debouncedQuery.trim().length >= 2;

  return (
    <div className="search-page">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout}  onUpgrade={onUpgrade}/>

      <div className="search-hero">
        <button className="back-btn" onClick={onBack}>{t("common.back")}</button>
        <div className="search-input-wrap">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            id="search-input"
            name="q"
            aria-label={t("search.placeholder")}
            className="search-input"
            inputMode="search"
            placeholder={t("search.placeholder")}
            value={query}
            onChange={e => handleInput(e.target.value)}
            autoFocus
          />
          {isPending && query && (
            <span style={{ color: "var(--text-muted)", fontSize: 12, opacity: 0.7 }}>...</span>
          )}
          {query && (
            <button
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16 }}
              onClick={() => { clearTimeout(timerRef.current); setQuery(""); setDebouncedQuery(""); setIsPending(false); }}
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
          <LoadingSpinner />
        ) : !hasResults ? (
          <p className="search-hint">{t("search.noResults", { query: debouncedQuery })}</p>
        ) : (
          <>
            {semanticVerses.length > 0 && (
              <section className="search-section">
                <h3 className="search-section-title">✨ {t("search.semanticSection")}</h3>
                {semanticVerses.map(v => (
                  <div key={v.id} className="search-result" onClick={() => navigate("main")}>
                    <span className="search-result-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
</svg></span>
                    <div className="search-result-body">
                      <span className="search-result-title">{v.book_name} — {v.book_theme}</span>
                      <span className="search-result-sub">{v.verse_ref}: {v.verse_text}</span>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {bookResults.length > 0 && (
              <section className="search-section">
                <h3 className="search-section-title">📖 {t("search.booksSection")}</h3>
                {bookResults.map(b => (
                  <div key={b.index} className="search-result" onClick={() => navigate("main")}>
                    <span className="search-result-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
</svg></span>
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
                    <span className="search-result-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
</svg></span>
                    <div className="search-result-body">
                      <span className="search-result-title">{th.title}</span>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {users.length > 0 && (
              <section className="search-section">
                <h3 className="search-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{display:"inline",verticalAlign:"middle",marginRight:6}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {t("search.usersSection", "Users")}
                </h3>
                {users.map(u => (
                  <div
                    key={u.id}
                    className="search-result"
                    onClick={() => navigate("publicProfile", { userId: u.id })}
                  >
                    <span className="search-result-icon search-result-icon--avatar">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt="" width={32} height={32} loading="lazy" style={{borderRadius:"50%",objectFit:"cover"}} />
                        : (u.display_name || "?")[0].toUpperCase()
                      }
                    </span>
                    <div className="search-result-body">
                      <span className="search-result-title">{u.display_name}</span>
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
