import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useSearch, useSemanticSearch } from "../hooks/useSearch";
import { FriendRequestButton } from "./FriendRequestButton";
import { BOOKS } from "../data/books";
import "../styles/command-palette.css";

const NAV_PAGES = [
  { key: "home",         labelKey: "nav.home",            fallback: "Home",          icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-home" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#c4b5fd"/><stop offset="100%" stopColor="#5b21b6"/></linearGradient></defs><path d="M12 3L2 12h3v9h5v-5h4v5h5v-9h3L12 3z" fill="url(#cp-home)"/></svg> },
  { key: "forum",        labelKey: "nav.forum",           fallback: "Forum",         icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-forum" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fb923c"/><stop offset="100%" stopColor="#c2410c"/></linearGradient></defs><path d="M21 3H3a1 1 0 0 0-1 1v14l5-4h14a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z" fill="url(#cp-forum)"/><rect x="7" y="8" width="10" height="1.5" rx=".75" fill="rgba(255,255,255,.45)"/><rect x="7" y="11.5" width="6" height="1.5" rx=".75" fill="rgba(255,255,255,.45)"/></svg> },
  { key: "blog",         labelKey: "nav.blog",            fallback: "Blog",          icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-blog" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f0abfc"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs><rect x="4" y="2" width="13" height="20" rx="2" fill="url(#cp-blog)"/><rect x="7" y="7" width="7" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/><rect x="7" y="10.5" width="10" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/><rect x="7" y="14" width="5" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/></svg> },
  { key: "leaderboard",  labelKey: "nav.leaderboard",     fallback: "Leaderboard",   icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-lb" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#fde68a"/></linearGradient></defs><rect x="3" y="13" width="5" height="9" rx="1.5" fill="url(#cp-lb)" opacity=".75"/><rect x="9.5" y="8" width="5" height="14" rx="1.5" fill="url(#cp-lb)"/><rect x="16" y="4" width="5" height="18" rx="1.5" fill="url(#cp-lb)" opacity=".85"/></svg> },
  { key: "studyNotes",   labelKey: "nav.studyNotes",      fallback: "Study Notes",   icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-notes" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6ee7b7"/><stop offset="100%" stopColor="#047857"/></linearGradient></defs><rect x="4" y="3" width="13" height="18" rx="2" fill="url(#cp-notes)"/><path d="M17 3l3 3h-2a1 1 0 0 1-1-1V3z" fill="rgba(255,255,255,.4)"/><rect x="7" y="8" width="7" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/><rect x="7" y="11.5" width="9" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/><rect x="7" y="15" width="5" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/></svg> },
  { key: "readingPlans", labelKey: "nav.readingPlans",    fallback: "Reading Plans", icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-plans" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#0369a1"/></linearGradient></defs><rect x="3" y="4" width="18" height="18" rx="3" fill="url(#cp-plans)"/><rect x="8" y="2" width="2" height="5" rx="1" fill="#e0f2fe"/><rect x="14" y="2" width="2" height="5" rx="1" fill="#e0f2fe"/><rect x="3" y="10" width="18" height="1.5" fill="rgba(255,255,255,.25)"/><rect x="6" y="14" width="3" height="3" rx=".5" fill="rgba(255,255,255,.55)"/><rect x="10.5" y="14" width="3" height="3" rx=".5" fill="rgba(255,255,255,.55)"/><rect x="15" y="14" width="3" height="3" rx=".5" fill="rgba(255,255,255,.55)"/></svg> },
  { key: "quiz",         labelKey: "nav.bibleQuiz",       fallback: "Bible Quiz",    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-quiz" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#818cf8"/><stop offset="100%" stopColor="#3730a3"/></linearGradient></defs><path d="M14.5 2L5.5 14h7l-3 8L20.5 10h-7L14.5 2z" fill="url(#cp-quiz)"/></svg> },
  { key: "friends",      labelKey: "nav.friends",         fallback: "Friends",       icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-friends" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#1d4ed8"/></linearGradient></defs><circle cx="9" cy="7" r="4" fill="url(#cp-friends)"/><path d="M2 21a7 7 0 0 1 14 0z" fill="url(#cp-friends)"/><circle cx="17.5" cy="8" r="3" fill="url(#cp-friends)" opacity=".65"/><path d="M14 21a5.5 5.5 0 0 1 9 0z" fill="url(#cp-friends)" opacity=".65"/></svg> },
  { key: "messages",     labelKey: "nav.messages",        fallback: "Messages",      icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-msgs" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#c084fc"/><stop offset="100%" stopColor="#6d28d9"/></linearGradient></defs><rect x="2" y="4" width="20" height="16" rx="3" fill="url(#cp-msgs)"/><path d="M2 8l10 7 10-7" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { key: "groups",       labelKey: "nav.groups",          fallback: "Groups",        icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-groups" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#34d399"/><stop offset="100%" stopColor="#065f46"/></linearGradient></defs><circle cx="8" cy="7" r="4" fill="url(#cp-groups)"/><path d="M1 21a7 7 0 0 1 14 0z" fill="url(#cp-groups)"/><rect x="17" y="8" width="6" height="2" rx="1" fill="url(#cp-groups)"/><rect x="19" y="6" width="2" height="6" rx="1" fill="url(#cp-groups)"/></svg> },
  { key: "meetingPrep",  labelKey: "nav.meetingPrep",     fallback: "Meeting Prep",  icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-prep" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#0369a1"/></linearGradient></defs><rect x="3" y="3" width="18" height="18" rx="3" fill="url(#cp-prep)"/><path d="M7 12l3 3 7-7" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { key: "familyQuiz",   labelKey: "nav.familyChallenge", fallback: "Family Quiz",   icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-family" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#1d4ed8"/></linearGradient></defs><circle cx="9" cy="7" r="4" fill="url(#cp-family)"/><path d="M2 21a7 7 0 0 1 14 0z" fill="url(#cp-family)"/><circle cx="17.5" cy="8" r="3" fill="url(#cp-family)" opacity=".65"/><path d="M14 21a5.5 5.5 0 0 1 9 0z" fill="url(#cp-family)" opacity=".65"/></svg> },
  { key: "studyTopics",  labelKey: "nav.studyTopics",     fallback: "Study Topics",  icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-study" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6ee7b7"/><stop offset="100%" stopColor="#065f46"/></linearGradient></defs><path d="M3 5h7.5a1.5 1.5 0 0 1 1.5 1.5V19a2.5 2.5 0 0 0-4.5-1.5H3V5z" fill="url(#cp-study)"/><path d="M21 5h-7.5A1.5 1.5 0 0 0 12 6.5V19a2.5 2.5 0 0 1 4.5-1.5H21V5z" fill="url(#cp-study)" opacity=".8"/></svg> },
  { key: "feed",         labelKey: "nav.feed",            fallback: "Feed",          icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-feed" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#0ea5e9"/><stop offset="100%" stopColor="#38bdf8"/></linearGradient></defs><circle cx="5" cy="19" r="3" fill="url(#cp-feed)"/><path d="M4 11a9 9 0 0 1 9 9H9a5 5 0 0 0-5-5v-4z" fill="url(#cp-feed)"/><path d="M4 4a16 16 0 0 1 16 16h-4A12 12 0 0 0 4 8V4z" fill="url(#cp-feed)"/></svg> },
  { key: "bookmarks",    labelKey: "nav.bookmarks",       fallback: "Bookmarks",     icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-bm" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#b45309"/></linearGradient></defs><path d="M6 2h12a2 2 0 0 1 2 2v17l-7-4.5L6 21V4a2 2 0 0 1 2-2H6z" fill="url(#cp-bm)"/></svg> },
  { key: "settings",     labelKey: "nav.settings",        fallback: "Settings",      icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-settings" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#94a3b8"/><stop offset="100%" stopColor="#475569"/></linearGradient></defs><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" fill="url(#cp-settings)"/><circle cx="12" cy="12" r="3" fill="rgba(255,255,255,.9)"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="rgba(255,255,255,.3)"/></svg> },
];

const ADMIN_PAGE = { key: "admin", labelKey: "app.admin", fallback: "Admin", icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="cp-admin" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f87171"/><stop offset="100%" stopColor="#b91c1c"/></linearGradient></defs><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" fill="url(#cp-admin)"/><circle cx="12" cy="12" r="3" fill="rgba(255,255,255,.9)"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="rgba(255,255,255,.3)"/></svg> };

interface Props {
  navigate: (page: string, params?: Record<string, unknown>) => void;
  onClose: () => void;
  isAdmin?: boolean;
  currentUserId?: string;
}

type FlatItem =
  | { kind: "page"; key: string; label: string; icon: React.ReactNode }
  | { kind: "user"; id: string; display_name: string | null; avatar_url: string | null; is_friend?: boolean }
  | { kind: "post"; id: string; slug: string; title: string; excerpt?: string | null }
  | { kind: "thread"; id: string; categoryId: string | null; title: string }
  | { kind: "book"; bookIndex: number; label: string; chapters: number }
  | { kind: "verse"; verseId: string; bookName: string; verseRef: string; verseText: string };

export default function CommandPalette({ navigate, onClose, isAdmin, currentUserId }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce the query for the DB search
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setDebounced(query), 250);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [query]);

  const { data: searchResults, isLoading: searchLoading } = useSearch(debounced);
  const { data: semantic } = useSemanticSearch(debounced);

  const allPages = useMemo(
    () => (isAdmin ? [...NAV_PAGES, ADMIN_PAGE] : NAV_PAGES).map(p => ({ ...p, label: t(p.labelKey, p.fallback) })),
    [isAdmin, t],
  );
  const filteredPages = allPages.filter(
    p => query === "" || p.label.toLowerCase().includes(query.toLowerCase())
  );

  const friendUsers = (searchResults?.users ?? []).filter(u => u.is_friend);
  const otherUsers = (searchResults?.users ?? []).filter(u => !u.is_friend);
  const posts = searchResults?.posts ?? [];
  const threads = searchResults?.threads ?? [];
  const semanticVerses = semantic?.verses ?? [];

  const bookMatches = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (q.length < 2) return [];
    return BOOKS.map((b, i) => ({ b, i, localName: t(`bookNames.${i}`, b.name) }))
      .filter(({ b, localName }) =>
        localName.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.abbr.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [debounced, t]);

  // Flatten everything into one list for keyboard navigation
  const flatItems: FlatItem[] = useMemo(() => {
    const items: FlatItem[] = [];
    for (const u of friendUsers) items.push({ kind: "user", ...u });
    for (const u of otherUsers) items.push({ kind: "user", ...u });
    for (const v of semanticVerses) items.push({ kind: "verse", verseId: v.id, bookName: v.book_name, verseRef: v.verse_ref, verseText: v.verse_text });
    for (const { i, localName, b } of bookMatches) items.push({ kind: "book", bookIndex: i, label: localName, chapters: b.chapters });
    for (const p of posts) items.push({ kind: "post", id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt });
    for (const th of threads) items.push({ kind: "thread", id: th.id, categoryId: th.category_id, title: th.title });
    for (const p of filteredPages) items.push({ kind: "page", key: p.key, label: p.label, icon: p.icon });
    return items;
  }, [friendUsers, otherUsers, semanticVerses, bookMatches, posts, threads, filteredPages]);

  // Reset active index when filter changes
  useEffect(() => {
    setActiveIdx(0);
  }, [debounced, query]);

  function activate(item: FlatItem) {
    switch (item.kind) {
      case "page":
        navigate(item.key);
        break;
      case "user":
        navigate("publicProfile", { userId: item.id });
        break;
      case "post":
        navigate("blog", { slug: item.slug });
        break;
      case "thread":
        navigate("forum", { categoryId: item.categoryId, threadId: item.id });
        break;
      case "book":
        navigate("bookDetail", { bookIndex: item.bookIndex });
        break;
      case "verse":
        navigate("main");
        break;
    }
    onClose();
  }

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, flatItems.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = flatItems[activeIdx];
        if (item) activate(item);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [flatItems, activeIdx, navigate, onClose]);

  return createPortal(
    <div
      className="cmd-backdrop"
      onClick={onClose}
      role="dialog"
      aria-label={t("cmdPalette.dialogLabel", "Command palette")}
      aria-modal="true"
    >
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="cmd-input-row">
          <span className="cmd-search-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder={t("cmdPalette.placeholder", "Search friends, posts, threads, or pages…")}
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            aria-label={t("cmdPalette.inputLabel", "Search")}
          />
          <button className="cmd-kbd cmd-kbd--btn" onClick={onClose} aria-label={t("common.close", "Close")} type="button">ESC</button>
        </div>

        {/* Results */}
        <div className="cmd-list" role="listbox" aria-label={t("cmdPalette.resultsLabel", "Search results")}>
          {(() => {
            let runningIdx = 0;
            const sections: React.ReactNode[] = [];

            const renderItem = (item: FlatItem, key: string, body: React.ReactNode) => {
              const i = runningIdx++;
              return (
                <div
                  key={key}
                  className="cmd-item"
                  data-active={i === activeIdx ? "true" : "false"}
                  role="option"
                  aria-selected={i === activeIdx}
                  onClick={() => activate(item)}
                  onMouseEnter={() => setActiveIdx(i)}
                >
                  {body}
                </div>
              );
            };

            if (friendUsers.length > 0) {
              sections.push(<div key="lbl-friends" className="cmd-section-label">{t("cmdPalette.friendsSection", "Friends")}</div>);
              friendUsers.forEach(u => sections.push(renderItem({ kind: "user", ...u }, `f-${u.id}`, (
                <>
                  <span className="cmd-item-icon cmd-item-avatar" aria-hidden="true">
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" width={24} height={24} loading="lazy" />
                      : (u.display_name ?? "?")[0]?.toUpperCase()}
                  </span>
                  <span className="cmd-item-label">{u.display_name ?? t("cmdPalette.friendFallback", "Friend")}</span>
                  <span className="cmd-item-badge">{t("cmdPalette.friendBadge", "Friend")}</span>
                </>
              ))));
            }

            if (otherUsers.length > 0) {
              sections.push(<div key="lbl-people" className="cmd-section-label">{t("cmdPalette.peopleSection", "People")}</div>);
              otherUsers.forEach(u => sections.push(renderItem({ kind: "user", ...u }, `u-${u.id}`, (
                <>
                  <span className="cmd-item-icon cmd-item-avatar" aria-hidden="true">
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" width={24} height={24} loading="lazy" />
                      : (u.display_name ?? "?")[0]?.toUpperCase()}
                  </span>
                  <span className="cmd-item-label">{u.display_name ?? t("cmdPalette.userFallback", "User")}</span>
                  {currentUserId && currentUserId !== u.id && (
                    <span className="cmd-item-action" onClick={e => e.stopPropagation()}>
                      <FriendRequestButton currentUserId={currentUserId} targetId={u.id} />
                    </span>
                  )}
                </>
              ))));
            }

            if (semanticVerses.length > 0) {
              sections.push(<div key="lbl-verses" className="cmd-section-label">{t("cmdPalette.versesSection", "✨ Related verses")}</div>);
              semanticVerses.forEach(v => sections.push(renderItem(
                { kind: "verse", verseId: v.id, bookName: v.book_name, verseRef: v.verse_ref, verseText: v.verse_text },
                `v-${v.id}`,
                (
                  <>
                    <span className="cmd-item-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    </span>
                    <span className="cmd-item-label cmd-item-label--stack">
                      <span className="cmd-item-title">{v.book_name} {v.verse_ref}</span>
                      <span className="cmd-item-sub">{v.verse_text}</span>
                    </span>
                  </>
                )
              )));
            }

            if (bookMatches.length > 0) {
              sections.push(<div key="lbl-books" className="cmd-section-label">{t("cmdPalette.booksSection", "📖 Books")}</div>);
              bookMatches.forEach(({ i, localName, b }) => sections.push(renderItem(
                { kind: "book", bookIndex: i, label: localName, chapters: b.chapters },
                `b-${i}`,
                (
                  <>
                    <span className="cmd-item-icon" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    </span>
                    <span className="cmd-item-label">{localName}</span>
                    <span className="cmd-item-hint">{t("cmdPalette.chHint", "{{count}} ch · ↵", { count: b.chapters })}</span>
                  </>
                )
              )));
            }

            if (posts.length > 0) {
              sections.push(<div key="lbl-posts" className="cmd-section-label">{t("cmdPalette.blogSection", "Blog")}</div>);
              posts.forEach(p => sections.push(renderItem({ kind: "post", id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt }, `p-${p.id}`, (
                <>
                  <span className="cmd-item-icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  </span>
                  <span className="cmd-item-label">{p.title}</span>
                  <span className="cmd-item-hint">{t("cmdPalette.openHint", "↵ open")}</span>
                </>
              ))));
            }

            if (threads.length > 0) {
              sections.push(<div key="lbl-threads" className="cmd-section-label">{t("cmdPalette.forumSection", "Forum")}</div>);
              threads.forEach(th => sections.push(renderItem({ kind: "thread", id: th.id, categoryId: th.category_id, title: th.title }, `t-${th.id}`, (
                <>
                  <span className="cmd-item-icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </span>
                  <span className="cmd-item-label">{th.title}</span>
                  <span className="cmd-item-hint">{t("cmdPalette.openHint", "↵ open")}</span>
                </>
              ))));
            }

            if (filteredPages.length > 0) {
              sections.push(<div key="lbl-pages" className="cmd-section-label">{t("cmdPalette.pagesSection", "Pages")}</div>);
              filteredPages.forEach(p => sections.push(renderItem({ kind: "page", key: p.key, label: p.label, icon: p.icon }, `pg-${p.key}`, (
                <>
                  <span className="cmd-item-icon" aria-hidden="true">{p.icon}</span>
                  <span className="cmd-item-label">{p.label}</span>
                  <span className="cmd-item-hint">{t("cmdPalette.openHint", "↵ open")}</span>
                </>
              ))));
            }

            if (sections.length === 0) {
              return (
                <div className="cmd-no-results">
                  {searchLoading && debounced
                    ? t("cmdPalette.searching", "Searching…")
                    : t("cmdPalette.noResults", "No results for \"{{query}}\"", { query })}
                </div>
              );
            }
            return sections;
          })()}
        </div>

        {/* Footer hints */}
        <div className="cmd-footer">
          <span className="cmd-hint"><kbd>↑↓</kbd> {t("cmdPalette.navigate", "navigate")}</span>
          <span className="cmd-hint"><kbd>↵</kbd> {t("cmdPalette.open", "open")}</span>
          <span className="cmd-hint"><kbd>ESC</kbd> {t("cmdPalette.close", "close")}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
