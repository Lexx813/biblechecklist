import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useAISkill } from "../../hooks/useAISkill";
import "../../styles/ai-tools.css";
const RichTextEditor = lazy(() => import("../../components/RichTextEditor"));
import BookmarkButton from "../../components/bookmarks/BookmarkButton";
import {
  useCategories, useThreads, useTopThreads, useCreateThread,
} from "../../hooks/useForum";
import { useBlocks } from "../../hooks/useBlocks";
import { useMeta } from "../../hooks/useMeta";
import ConfirmModal from "../../components/ConfirmModal";
import {
  displayName, timeAgo, Avatar, BadgeChip, ModBadge,
  IconPin, IconLock, IconEye, IconThumbsUp, IconQuote,
} from "./forumShared";

// ── AI Post Assistant ─────────────────────────────────────────────────────────

function ForumPostAssistant({ topic, draft }: { topic: string; draft: string }) {
  const { text, loading, error, run, reset } = useAISkill();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current && text) ref.current.scrollTop = ref.current.scrollHeight; }, [text]);

  function handleAssist() {
    if (!topic.trim() || loading) return;
    const cleanDraft = draft?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    run("forum_post", { topic: topic.trim(), draft: cleanDraft || undefined });
  }

  return (
    <div className="ait-inline" style={{ marginTop: "0.5rem" }}>
      <div className="ait-inline-header" onClick={() => setOpen(o => !o)} role="button" tabIndex={0} aria-expanded={open}>
        <span className="ait-inline-title">✨ AI Post Assistant</span>
        <span className={`ait-inline-chevron${open ? " ait-inline-chevron--open" : ""}`}>▼</span>
      </div>
      {open && (
        <div className="ait-inline-body">
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted,#888)", margin: "0 0 0.75rem" }}>
            Get help crafting a warm, scripturally-grounded forum post based on your topic and draft.
          </p>
          <button className="ait-submit-btn" type="button" onClick={handleAssist} disabled={loading || !topic.trim()}>
            {loading ? "Writing…" : "✦ Help Me Write This Post"}
          </button>
          {(loading || text || error) && (
            <div className="ait-result" style={{ marginTop: "0.75rem" }}>
              <div className="ait-result-header">
                <span className="ait-result-label">AI Suggestion</span>
                {!loading && (text || error) && <button className="ait-result-clear" type="button" onClick={reset}>Clear</button>}
              </div>
              <div className="ait-result-body" ref={ref}>
                {loading && !text && (
                  <div className="ait-loading">
                    <span className="ait-dot" /><span className="ait-dot" /><span className="ait-dot" />
                    <span className="ait-loading-label">Thinking…</span>
                  </div>
                )}
                {error && <div className="ait-error">{error}</div>}
                {text && <div className="ait-response-text">{text}{loading && <span className="ait-cursor" />}</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Thread List ───────────────────────────────────────────────────────────────

const THREADS_PER_PAGE = 20;
const SORT_OPTIONS = ["latest", "liked", "replied", "unanswered", "solved"];

export function ForumThreadList({ category, user, onSelectThread, onBack, navigate, i18n }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  category: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  onSelectThread: (id: string) => void;
  onBack: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigate: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  i18n: any;
}) {
  const { t } = useTranslation();
  const userLang = i18n?.language?.split("-")[0] ?? "en";
  const [limit, setLimit] = useState(THREADS_PER_PAGE);
  const [langFilter, setLangFilter] = useState(userLang);
  const [sort, setSort] = useState("latest");
  const [search, setSearch] = useState("");
  const { data: rawThreads = [], isLoading } = useThreads(category.id, limit, langFilter);
  const createThread = useCreateThread(category.id);
  const { data: blockedSet = new Set<string>() } = useBlocks(user?.id);

  const draftKey = `forum-draft-thread-${category.id}`;
  const formKey = `forum-form-open-${category.id}`;
  const [showForm, setShowForm] = useState(() => {
    try { return sessionStorage.getItem(formKey) === "1"; } catch { return false; }
  });
  const [title, setTitle]   = useState(() => { try { return JSON.parse(localStorage.getItem(draftKey) || "{}").title || ""; } catch { return ""; } });
  const [content, setContent] = useState(() => { try { return JSON.parse(localStorage.getItem(draftKey) || "{}").content || ""; } catch { return ""; } });
  const [formError, setFormError] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);

  const isDirty = title.trim().length > 0 || (content && content !== "<p></p>");

  useEffect(() => {
    if (!isDirty || !showForm) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, showForm]);

  useEffect(() => {
    try { localStorage.setItem(draftKey, JSON.stringify({ title, content })); } catch {}
  }, [title, content, draftKey]);

  useEffect(() => {
    try {
      if (showForm) sessionStorage.setItem(formKey, "1");
      else sessionStorage.removeItem(formKey);
    } catch {}
  }, [showForm, formKey]);

  const threads = useCallback(() => {
    let list = [...rawThreads].filter(th => !blockedSet.has(th.author_id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(th => th.title?.toLowerCase().includes(q));
    }
    const pinned = list.filter(th => th.pinned);
    let rest = list.filter(th => !th.pinned);
    if (sort === "liked") rest.sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0));
    else if (sort === "replied") rest.sort((a, b) => (b.forum_replies?.[0]?.count ?? 0) - (a.forum_replies?.[0]?.count ?? 0));
    else if (sort === "unanswered") rest = rest.filter(th => (th.forum_replies?.[0]?.count ?? 0) === 0 && !th.locked);
    else if (sort === "solved") rest = rest.filter(th => th.has_solution);
    return [...pinned, ...rest];
  }, [rawThreads, search, sort, blockedSet])();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!title.trim()) return setFormError(t("forum.errorTitleRequired"));
    if (!content || content === "<p></p>") return setFormError(t("forum.errorContentRequired"));
    createThread.mutate({ userId: user.id, title: title.trim(), content: content.trim(), lang: userLang }, {
      onSuccess: (thread) => {
        setTitle(""); setContent(""); setShowForm(false);
        try { localStorage.removeItem(draftKey); } catch {}
        onSelectThread(thread.id);
      },
      onError: (err) => setFormError(err.message),
    });
  }

  return (
    <div className="forum-thread-list">
      <nav className="forum-breadcrumb">
        <button className="forum-breadcrumb-item" onClick={() => navigate("forum")}>{t("forum.breadcrumbForum")}</button>
        <span className="forum-breadcrumb-sep">›</span>
        <span className="forum-breadcrumb-current">{category.name}</span>
      </nav>

      <div className="forum-list-header">
        <div className="forum-list-header-left">
          <button className="back-btn" onClick={onBack}>{t("forum.backToForums")}</button>
          <span className="forum-list-category-icon">{category.icon}</span>
          <h2 className="forum-list-title">{category.name}</h2>
        </div>
        <button className="forum-new-btn" onClick={() => {
          if (showForm && isDirty) { setDiscardOpen(true); return; }
          if (showForm) { setTitle(""); setContent(""); }
          setShowForm(v => !v);
        }}>
          {showForm ? t("common.cancel") : t("forum.newThread")}
        </button>
        {discardOpen && (
          <ConfirmModal
            message="You have unsaved changes in this thread. Discard them and close?"
            confirmLabel="Discard"
            onConfirm={() => {
              setDiscardOpen(false);
              setTitle("");
              setContent("");
              setShowForm(false);
            }}
            onCancel={() => setDiscardOpen(false)}
          />
        )}
      </div>

      <div className="forum-search-bar">
        <input
          className="forum-search-input"
          type="search"
          placeholder={t("forum.searchPlaceholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search forum"
        />
      </div>

      <div className="forum-sort-tabs">
        {SORT_OPTIONS.map(s => (
          <button
            key={s}
            className={`forum-sort-tab${sort === s ? " forum-sort-tab--active" : ""}`}
            onClick={() => setSort(s)}
          >
            {t(`forum.sort_${s}`)}
          </button>
        ))}
      </div>

      <div className="forum-lang-filter">
        <button
          className={`forum-lang-pill${langFilter === userLang ? " forum-lang-pill--active" : ""}`}
          onClick={() => { setLangFilter(userLang); setLimit(THREADS_PER_PAGE); }}
        >
          {t("forum.myLanguage")}
        </button>
        <button
          className={`forum-lang-pill${langFilter === null ? " forum-lang-pill--active" : ""}`}
          onClick={() => { setLangFilter(null); setLimit(THREADS_PER_PAGE); }}
        >
          {t("forum.allLanguages")}
        </button>
      </div>

      {showForm && (
        <form className="forum-new-thread-form" onSubmit={handleCreate}>
          <input
            id="forum-new-title"
            name="title"
            className="forum-input"
            placeholder={t("forum.threadTitlePlaceholder")}
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={createThread.isPending}
            aria-label="Thread title"
          />
          <Suspense fallback={<div style={{ height: 120 }} />}>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder={t("forum.threadContentPlaceholder")}
              minimal
              disabled={createThread.isPending}
            />
          </Suspense>
          <ForumPostAssistant topic={title} draft={content} />
          {formError && <div className="forum-form-error">{formError}</div>}
          <div className="forum-form-actions">
            <button className="forum-submit-btn" type="submit" disabled={createThread.isPending}>
              {createThread.isPending && <span className="btn-spin" />}{createThread.isPending ? t("forum.posting") : t("forum.postThread")}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="forum-rows">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="forum-row" style={{ pointerEvents: "none" }}>
              <div className="forum-row-left">
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%" }} />
              </div>
              <div className="forum-row-mid" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="skeleton" style={{ height: 14, width: "55%", borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 11, width: "35%", borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="forum-empty">
          <div className="forum-empty-icon">💬</div>
          <h3>{search ? t("forum.noResults") : t("forum.noThreads")}</h3>
          <p>{search ? "" : t("forum.noThreadsSub")}</p>
          {!search && (
            <button className="forum-empty-cta" onClick={() => setShowForm(true)}>
              {t("forum.beFirstThread")}
            </button>
          )}
        </div>
      ) : (
        <div className="forum-rows">
          {threads.map(thread => {
            const replyCount = thread.forum_replies?.[0]?.count ?? 0;
            return (
              <div
                key={thread.id}
                className={`forum-row${thread.pinned ? " forum-row--pinned" : ""}`}
                onClick={() => onSelectThread(thread.id)}
              >
                <div className="forum-row-left">
                  <Avatar profile={thread.profiles} size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate("publicProfile", { userId: thread.author_id }); }} />
                </div>
                <div className="forum-row-mid">
                  <div className="forum-row-title">
                    {thread.pinned && <span className="forum-badge forum-badge--pin"><IconPin /></span>}
                    {thread.locked && <span className="forum-badge forum-badge--lock"><IconLock /></span>}
                    {thread.has_solution && <span className="forum-badge forum-badge--solved">✓</span>}
                    {thread.title}
                  </div>
                  <div className="forum-row-meta">
                    <span>
                      {displayName(thread.profiles)}
                      <BadgeChip level={thread.profiles?.top_badge_level} />
                    </span>
                    <span className="forum-dot">·</span>
                    <span>{timeAgo(thread.updated_at, t)}</span>
                    {thread.view_count > 0 && (
                      <><span className="forum-dot">·</span><span className="forum-row-meta-icon"><IconEye /> {thread.view_count}</span></>
                    )}
                  </div>
                </div>
                <div className="forum-row-right">
                  <div className="forum-row-stat">
                    <span className="forum-row-stat-val">{replyCount}</span>
                    <span className="forum-row-stat-label">{t("forum.replyCount", { count: replyCount }).split(" ")[1]}</span>
                  </div>
                  {thread.like_count > 0 && (
                    <div className="forum-row-likes"><IconThumbsUp /> {thread.like_count}</div>
                  )}
                  <BookmarkButton userId={user.id} threadId={thread.id} />
                </div>
              </div>
            );
          })}
          {rawThreads.length === limit && (
            <button className="forum-load-more" onClick={() => setLimit(l => l + THREADS_PER_PAGE)}>
              {t("forum.loadMore")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Category List ─────────────────────────────────────────────────────────────

export function ForumCategoryList({ onSelectCategory, onBack, navigate, i18n, user, onSelectThread }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectCategory: (cat: any) => void;
  onBack: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigate: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  i18n: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  onSelectThread: (catId: string, threadId: string) => void;
}) {
  const { data: categories = [], isLoading } = useCategories();
  const { data: trending = [], isLoading: trendingLoading } = useTopThreads(5);
  const { data: blockedSet = new Set<string>() } = useBlocks(user?.id);
  const { t } = useTranslation();

  useMeta({ title: "Forum", description: "Join community discussions about Bible reading, faith, and spiritual growth." });
  const lang = i18n.language.split("-")[0];

  const visibleTrending = trending.filter(th => !blockedSet.has(th.author_id));

  return (
    <div className="forum-categories">
      <h1 className="page-section-title">{t("forum.title")}</h1>

      {(trendingLoading || visibleTrending.length > 0) && (
        <div className="forum-trending">
          <div className="forum-trending-header">
            <span className="forum-trending-label">🔥 {t("forum.trending")}</span>
          </div>
          <div className="forum-trending-list">
            {trendingLoading ? (
              [0, 1, 2, 3, 4].map(i => (
                <div key={i} className="forum-trending-row" style={{ pointerEvents: "none" }}>
                  <div className="skeleton" style={{ flex: 1, height: 13, borderRadius: 4 }} />
                  <div className="skeleton" style={{ width: 44, height: 12, borderRadius: 4, flexShrink: 0 }} />
                </div>
              ))
            ) : visibleTrending.map(thread => (
              <button
                key={thread.id}
                className="forum-trending-row"
                onClick={() => onSelectThread(thread.category_id, thread.id)}
              >
                <span className="forum-trending-title">{thread.title}</span>
                <div className="forum-trending-stats">
                  {thread.like_count > 0 && <span className="forum-row-meta-icon"><IconThumbsUp /> {thread.like_count}</span>}
                  <span className="forum-row-meta-icon"><IconQuote /> {thread.forum_replies?.[0]?.count ?? 0}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="forum-cat-grid">
        {isLoading ? (
          [0,1,2,3].map(i => (
            <div key={i} className="forum-cat-card" style={{ pointerEvents: "none" }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
              <div className="forum-cat-body">
                <div className="skeleton" style={{ height: 15, width: "55%", borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 12, width: "80%", borderRadius: 6, marginTop: 6 }} />
              </div>
              <div className="forum-cat-stats">
                <div className="skeleton" style={{ height: 12, width: 50, borderRadius: 6 }} />
              </div>
            </div>
          ))
        ) : categories.map(cat => {
          const threadCount = cat.forum_threads?.[0]?.count ?? 0;
          const tx = cat.forum_category_translations?.find((t: { lang: string }) => t.lang === lang);
          return (
            <div key={cat.id} className="forum-cat-card" onClick={() => onSelectCategory(cat)}>
              <div className="forum-cat-icon">{cat.icon}</div>
              <div className="forum-cat-body">
                <div className="forum-cat-name">{tx?.name ?? cat.name}</div>
                <div className="forum-cat-desc">{tx?.description ?? cat.description}</div>
              </div>
              <div className="forum-cat-stats">
                <span className="forum-cat-stat">{t("forum.threadStat", { count: threadCount })}</span>
                <span className="forum-cat-arrow">›</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
