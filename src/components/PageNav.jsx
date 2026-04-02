import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "../styles/pagenav.css";
import AnnouncementBanner from "./AnnouncementBanner";
import NotificationBell from "./notifications/NotificationBell";
import { LANGUAGES } from "../i18n";
import { useClickOutside } from "../hooks/useClickOutside";
import { useFullProfile } from "../hooks/useAdmin";
import { useSubscription } from "../hooks/useSubscription";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useFeatureFlags } from "../hooks/useFeatureFlags";

const FLAGS = { en: "🇺🇸", es: "🇪🇸", pt: "🇧🇷", tl: "🇵🇭", fr: "🇫🇷", zh: "🇨🇳" };

// ── SVG icon set ──────────────────────────────────────────────────────────────
const Icon = {
  Book:         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Feed:         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>,
  Bookmark:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  Calendar:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Notes:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Message:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Users:        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Search:       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Sun:          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon:         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Lock:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Trophy:       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="8 17 8 21"/><polyline points="16 17 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M6 21h12"/><path d="M8 17h8a4 4 0 0 0 4-4V5H4v8a4 4 0 0 0 4 4z"/><path d="M4 5H2"/><path d="M20 5h2"/></svg>,
  Chevron:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>,
  Sparkle:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/></svg>,
  Info:         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Shield:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Home:         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Quiz:         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  FamilyQuiz:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><line x1="12" y1="17" x2="23" y2="17"/><polyline points="19 14 23 17 19 20"/></svg>,
};

export default function PageNav({ navigate, darkMode, setDarkMode, i18n, user, onLogout, currentPage, onUpgrade }) {
  const { t } = useTranslation();
  const { data: profile } = useFullProfile(user?.id);
  const isAdmin = profile?.is_admin;
  const canModerate = isAdmin || profile?.is_moderator;
  const { isPremium } = useSubscription(user?.id);
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const { aiEnabled } = useFeatureFlags();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [studyOpen, setStudyOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  // Mobile accordion sections — auto-open whichever section the current page is in
  const [mobileQuizOpen, setMobileQuizOpen] = useState(() => ["quiz","familyQuiz","leaderboard"].includes(currentPage));
  const [mobileStudyOpen, setMobileStudyOpen] = useState(() => ["feed","bookmarks","studyTopics","studyTopicDetail","readingPlans","studyNotes","aiTools","meetingPrep"].includes(currentPage));
  const [mobileCommunityOpen, setMobileCommunityOpen] = useState(() => ["blog","forum","groups","groupDetail"].includes(currentPage));
  const [mobileMoreOpen, setMobileMoreOpen] = useState(() => ["about","admin"].includes(currentPage));
  const [navHidden, setNavHidden] = useState(false);
  const menuRef = useRef(null);
  const quizRef = useRef(null);
  const studyRef = useRef(null);
  const communityRef = useRef(null);
  const moreRef = useRef(null);
  const langRef = useRef(null);
  const lastScrollY = useRef(0);

  const currentLangCode = i18n
    ? (LANGUAGES.find(l => i18n.language?.split("-")[0]?.startsWith(l.code))?.code ?? "en")
    : "en";

  const quizPages = new Set(["quiz", "familyQuiz", "leaderboard"]);
  const studyPages = new Set(["feed", "bookmarks", "readingPlans", "studyNotes", "aiTools", "studyTopics", "studyTopicDetail", "meetingPrep"]);
  const communityPages = new Set(["blog", "forum", "groups", "groupDetail"]);
  const morePages = new Set(["about", "admin"]);

  const quizActive = quizPages.has(currentPage);
  const studyActive = studyPages.has(currentPage);
  const communityActive = communityPages.has(currentPage);
  const moreActive = morePages.has(currentPage);

  function go(page) {
    setMenuOpen(false);
    setQuizOpen(false);
    setStudyOpen(false);
    setCommunityOpen(false);
    setMoreOpen(false);
    navigate(page);
  }

  useEffect(() => { menuOpenRef.current = menuOpen; }, [menuOpen]);

  useClickOutside(menuRef,      menuOpen,      () => setMenuOpen(false));
  useClickOutside(quizRef,      quizOpen,      () => setQuizOpen(false));
  useClickOutside(studyRef,     studyOpen,     () => setStudyOpen(false));
  useClickOutside(communityRef, communityOpen, () => setCommunityOpen(false));
  useClickOutside(moreRef,      moreOpen,      () => setMoreOpen(false));
  useClickOutside(langRef,      langOpen,      () => setLangOpen(false));

  // Close mobile menu on resize to desktop
  useEffect(() => {
    function handler() { if (window.innerWidth > 1180) setMenuOpen(false); }
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Reset mobile accordion sections when menu closes
  useEffect(() => {
    if (!menuOpen) {
      setMobileQuizOpen(false);
      setMobileStudyOpen(false);
      setMobileCommunityOpen(false);
      setMobileMoreOpen(false);
    }
  }, [menuOpen]);

  // Hide nav on scroll down, reveal on scroll up
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      if (y < 60) { setNavHidden(false); lastScrollY.current = y; return; }
      if (y > lastScrollY.current + 6) { if (!menuOpenRef.current) { setNavHidden(true); } }
      else if (y < lastScrollY.current - 4) { setNavHidden(false); }
      lastScrollY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("nav-hidden", navHidden);
    return () => document.documentElement.classList.remove("nav-hidden");
  }, [navHidden]);

  return (
    <>
      <nav className={`page-nav${navHidden ? " page-nav--hidden" : ""}`} ref={menuRef}>
        <button className="page-nav-brand" onClick={() => go("home")}>
          <span className="page-nav-brand-icon">{Icon.Book}</span>
          <span className="page-nav-brand-name">NWT Progress</span>
        </button>

        {/* Desktop links */}
        <div className="page-nav-links">
          {currentPage !== "home" && <button className="page-nav-link" onClick={() => go("home")}>{t("app.home")}</button>}
          <button className={`page-nav-link${currentPage === "main" ? " page-nav-link--active" : ""}`} onClick={() => go("main")}>{t("home.navTracker")}</button>

          {/* Quiz dropdown */}
          <div className="page-nav-more" ref={quizRef}>
            <button
              className={`page-nav-link page-nav-more-btn${quizActive ? " page-nav-link--active" : ""}${quizOpen ? " page-nav-more-btn--open" : ""}`}
              onClick={() => setQuizOpen(o => !o)}
            >
              {t("quiz.nav", "Quiz")} ▾
            </button>
            {quizOpen && (
              <div className="page-nav-more-menu">
                <div className="page-nav-more-group-label">{t("quiz.nav", "Quiz")}</div>
                <button className={`page-nav-more-item${currentPage === "quiz" ? " page-nav-more-item--active" : ""}`} onClick={() => go("quiz")}>{Icon.Quiz} {t("quiz.nav")}</button>
                <button className={`page-nav-more-item${currentPage === "familyQuiz" ? " page-nav-more-item--active" : ""}`} onClick={() => go("familyQuiz")}>{Icon.FamilyQuiz} Family Challenge</button>
                <button className={`page-nav-more-item${currentPage === "leaderboard" ? " page-nav-more-item--active" : ""}`} onClick={() => go("leaderboard")}>{Icon.Trophy} {t("leaderboard.title", "Leaderboard")}</button>
              </div>
            )}
          </div>

          {/* Study dropdown */}
          <div className="page-nav-more" ref={studyRef}>
            <button
              className={`page-nav-link page-nav-more-btn${studyActive ? " page-nav-link--active" : ""}${studyOpen ? " page-nav-more-btn--open" : ""}`}
              onClick={() => setStudyOpen(o => !o)}
            >
              {t("nav.study", "Study")} ▾
            </button>
            {studyOpen && (
              <div className="page-nav-more-menu">
                <div className="page-nav-more-group-label">{t("nav.free", "Free")}</div>
                <button className={`page-nav-more-item${currentPage === "feed" ? " page-nav-more-item--active" : ""}`} onClick={() => go("feed")}>{Icon.Feed} {t("feed.navLink")}</button>
                <button className={`page-nav-more-item${currentPage === "bookmarks" ? " page-nav-more-item--active" : ""}`} onClick={() => go("bookmarks")}>{Icon.Bookmark} {t("bookmarks.title")}</button>
                <button className={`page-nav-more-item${currentPage === "studyTopics" || currentPage === "studyTopicDetail" ? " page-nav-more-item--active" : ""}`} onClick={() => go("studyTopics")}>{Icon.Book} {t("nav.studyTopics", "Study Topics")}</button>
                <div className="page-nav-more-divider" />
                <div className="page-nav-more-group-label">{t("nav.premium", "Premium")}</div>
                {isPremium
                  ? <button className={`page-nav-more-item${currentPage === "meetingPrep" ? " page-nav-more-item--active" : ""}`} onClick={() => go("meetingPrep")}>{Icon.Calendar} {t("nav.meetingPrep", "Meeting Prep")}</button>
                  : <button className="page-nav-more-item page-nav-more-item--locked" onClick={() => { setStudyOpen(false); onUpgrade?.(); }}>{Icon.Calendar} {t("nav.meetingPrep", "Meeting Prep")} <span className="page-nav-more-lock">{Icon.Lock}</span></button>}
                {isPremium
                  ? <button className={`page-nav-more-item${currentPage === "readingPlans" ? " page-nav-more-item--active" : ""}`} onClick={() => go("readingPlans")}>{Icon.Calendar} {t("nav.readingPlans")}</button>
                  : <button className="page-nav-more-item page-nav-more-item--locked" onClick={() => { setStudyOpen(false); onUpgrade?.(); }}>{Icon.Calendar} {t("nav.readingPlans")} <span className="page-nav-more-lock">{Icon.Lock}</span></button>}
                {isPremium
                  ? <button className={`page-nav-more-item${currentPage === "studyNotes" ? " page-nav-more-item--active" : ""}`} onClick={() => go("studyNotes")}>{Icon.Notes} {t("nav.studyNotes")}</button>
                  : <button className="page-nav-more-item page-nav-more-item--locked" onClick={() => { setStudyOpen(false); onUpgrade?.(); }}>{Icon.Notes} {t("nav.studyNotes")} <span className="page-nav-more-lock">{Icon.Lock}</span></button>}
                {isPremium || isAdmin
                  ? <button className={`page-nav-more-item${currentPage === "aiTools" ? " page-nav-more-item--active" : ""}`} onClick={() => go("aiTools")}>{Icon.Sparkle} {t("nav.aiTools", "AI Tools")}</button>
                  : <button className="page-nav-more-item page-nav-more-item--locked" onClick={() => { setStudyOpen(false); onUpgrade?.(); }}>{Icon.Sparkle} {t("nav.aiTools", "AI Tools")} <span className="page-nav-more-lock">{Icon.Lock}</span></button>}
              </div>
            )}
          </div>

          {/* Community dropdown */}
          <div className="page-nav-more" ref={communityRef}>
            <button
              className={`page-nav-link page-nav-more-btn${communityActive ? " page-nav-link--active" : ""}${communityOpen ? " page-nav-more-btn--open" : ""}`}
              onClick={() => setCommunityOpen(o => !o)}
            >
              {t("nav.community")} ▾
            </button>
            {communityOpen && (
              <div className="page-nav-more-menu">
                <div className="page-nav-more-group-label">{t("nav.community")}</div>
                <button className={`page-nav-more-item${currentPage === "blog" ? " page-nav-more-item--active" : ""}`} onClick={() => go("blog")}>{Icon.Feed} {t("app.blog")}</button>
                <button className={`page-nav-more-item${currentPage === "forum" ? " page-nav-more-item--active" : ""}`} onClick={() => go("forum")}>{Icon.Users} {t("app.forum")}</button>
                <div className="page-nav-more-divider" />
                <div className="page-nav-more-group-label">{t("nav.premium", "Premium")}</div>
                {isPremium
                  ? <button className={`page-nav-more-item${currentPage === "groups" || currentPage === "groupDetail" ? " page-nav-more-item--active" : ""}`} onClick={() => go("groups")}>{Icon.Users} {t("nav.studyGroups")}</button>
                  : <button className="page-nav-more-item page-nav-more-item--locked" onClick={() => { setCommunityOpen(false); onUpgrade?.(); }}>{Icon.Users} {t("nav.studyGroups")} <span className="page-nav-more-lock">{Icon.Lock}</span></button>}
              </div>
            )}
          </div>

          {/* More dropdown */}
          <div className="page-nav-more" ref={moreRef}>
            <button
              className={`page-nav-link page-nav-more-btn${moreActive ? " page-nav-link--active" : ""}${moreOpen ? " page-nav-more-btn--open" : ""}`}
              onClick={() => setMoreOpen(o => !o)}
            >
              {t("nav.more")} ▾
            </button>
            {moreOpen && (
              <div className="page-nav-more-menu">
                <button className={`page-nav-more-item${currentPage === "about" ? " page-nav-more-item--active" : ""}`} onClick={() => go("about")}>{Icon.Info} {t("app.about")}</button>
                {canModerate && <button className={`page-nav-more-item${currentPage === "admin" ? " page-nav-more-item--active" : ""}`} onClick={() => go("admin")}>{Icon.Shield} {isAdmin ? t("app.admin") : "Moderation"}</button>}
              </div>
            )}
          </div>
        </div>

        <div className="page-nav-actions">
          {user && (
            isPremium
              ? <button className={`page-nav-icon-btn page-nav-msg-btn${currentPage === "messages" ? " page-nav-icon-btn--active" : ""}`} onClick={() => go("messages")} data-tip={t("nav.messages")} aria-label={t("nav.messages")} style={{ position: "relative" }}>
                  {Icon.Message}
                  {unreadMessages > 0 && <span className="page-nav-msg-badge">{unreadMessages}</span>}
                </button>
              : <button className="page-nav-icon-btn page-nav-icon-btn--locked page-nav-pro-btn page-nav-msg-btn" data-tip={t("nav.proFeature")} aria-label={t("nav.messages")} style={{ position: "relative" }} onClick={onUpgrade}>
                  {Icon.Message}
                </button>
          )}
          {user && (
            <button
              className="page-nav-icon-btn"
              onClick={() => go("search")}
              data-tip={t("search.placeholder")}
              aria-label={t("search.placeholder")}
            >
              {Icon.Search}
            </button>
          )}
          {user && <NotificationBell userId={user.id} navigate={navigate} />}
          {setDarkMode && (
            <button
              className="page-nav-icon-btn"
              onClick={() => setDarkMode(d => !d)}
              data-tip={darkMode ? t("app.lightMode") : t("app.darkMode")}
              aria-label={darkMode ? t("app.lightMode") : t("app.darkMode")}
            >
              {darkMode ? Icon.Sun : Icon.Moon}
            </button>
          )}
          {i18n && (
            <div className="page-nav-lang-picker" ref={langRef}>
              <button
                className={`page-nav-icon-btn page-nav-lang-btn${langOpen ? " page-nav-icon-btn--active" : ""}`}
                onClick={() => setLangOpen(o => !o)}
                data-tip={t("nav.language")}
                aria-label={t("nav.language")}
                aria-expanded={langOpen}
              >
                <span aria-hidden="true">{FLAGS[currentLangCode]}</span>
              </button>
              {langOpen && (
                <div className="page-nav-lang-menu">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      className={`page-nav-lang-item${l.code === currentLangCode ? " page-nav-lang-item--active" : ""}`}
                      onClick={() => { i18n.changeLanguage(l.code); setLangOpen(false); }}
                    >
                      <span>{FLAGS[l.code]}</span>
                      <span>{l.label}</span>
                      {l.code === currentLangCode && <span className="page-nav-lang-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {user && onLogout && (
            <button
              className="page-nav-icon-btn page-nav-logout-btn page-nav-logout-desktop"
              onClick={onLogout}
              title={t("app.logOut")}
            >
              {t("app.logOut")}
            </button>
          )}
          {user && (
            <button
              className="page-nav-avatar-btn"
              onClick={() => go("profile")}
              data-tip={profile?.display_name || user.email}
              aria-label={t("nav.profile", "Profile")}
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="page-nav-avatar-img" alt="avatar" width={36} height={36} />
                : <span className="page-nav-avatar-initials">
                    {(profile?.display_name || user.email)?.[0]?.toUpperCase()}
                  </span>
              }
            </button>
          )}

          {/* Hamburger — mobile only */}
          <button
            className={`page-nav-hamburger${menuOpen ? " is-open" : ""}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="page-nav-mobile-menu">
            {currentPage !== "home" && <button className="page-nav-mobile-link" onClick={() => go("home")}><span className="page-nav-mobile-icon">{Icon.Home}</span> {t("app.home")}</button>}
            <button className={`page-nav-mobile-link${currentPage === "main" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("main")}><span className="page-nav-mobile-icon">{Icon.Book}</span> {t("home.navTracker")}</button>

            {/* Quiz accordion */}
            <button className={`page-nav-mobile-section-toggle${quizActive ? " page-nav-mobile-section-toggle--active" : ""}`} onClick={() => setMobileQuizOpen(o => !o)} aria-expanded={mobileQuizOpen}>
              <span>{t("quiz.nav", "Quiz")}</span>
              <span className={`page-nav-mobile-chevron${mobileQuizOpen ? " page-nav-mobile-chevron--open" : ""}`}>{Icon.Chevron}</span>
            </button>
            {mobileQuizOpen && (
              <div className="page-nav-mobile-section-items">
                <button className={`page-nav-mobile-link${currentPage === "quiz" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("quiz")}><span className="page-nav-mobile-icon">{Icon.Quiz}</span> {t("quiz.nav")}</button>
                <button className={`page-nav-mobile-link${currentPage === "familyQuiz" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("familyQuiz")}><span className="page-nav-mobile-icon">{Icon.FamilyQuiz}</span> Family Challenge</button>
                <button className={`page-nav-mobile-link${currentPage === "leaderboard" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("leaderboard")}><span className="page-nav-mobile-icon">{Icon.Trophy}</span> {t("leaderboard.title", "Leaderboard")}</button>
              </div>
            )}

            {/* Study accordion */}
            <button className={`page-nav-mobile-section-toggle${studyActive ? " page-nav-mobile-section-toggle--active" : ""}`} onClick={() => setMobileStudyOpen(o => !o)} aria-expanded={mobileStudyOpen}>
              <span>{t("nav.study", "Study")}</span>
              <span className={`page-nav-mobile-chevron${mobileStudyOpen ? " page-nav-mobile-chevron--open" : ""}`}>{Icon.Chevron}</span>
            </button>
            {mobileStudyOpen && (
              <div className="page-nav-mobile-section-items">
                <button className={`page-nav-mobile-link${currentPage === "feed" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("feed")}><span className="page-nav-mobile-icon">{Icon.Feed}</span> {t("feed.navLink")}</button>
                <button className={`page-nav-mobile-link${currentPage === "bookmarks" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("bookmarks")}><span className="page-nav-mobile-icon">{Icon.Bookmark}</span> {t("bookmarks.title")}</button>
                <button className={`page-nav-mobile-link${currentPage === "studyTopics" || currentPage === "studyTopicDetail" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("studyTopics")}><span className="page-nav-mobile-icon">{Icon.Book}</span> {t("nav.studyTopics", "Study Topics")}</button>
                {isPremium ? (
                  <>
                    <button className={`page-nav-mobile-link${currentPage === "meetingPrep" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("meetingPrep")}><span className="page-nav-mobile-icon">{Icon.Calendar}</span> {t("nav.meetingPrep", "Meeting Prep")}</button>
                    <button className={`page-nav-mobile-link${currentPage === "readingPlans" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("readingPlans")}><span className="page-nav-mobile-icon">{Icon.Calendar}</span> {t("nav.readingPlans")}</button>
                    <button className={`page-nav-mobile-link${currentPage === "studyNotes" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("studyNotes")}><span className="page-nav-mobile-icon">{Icon.Notes}</span> {t("nav.studyNotes")}</button>
                    <button className={`page-nav-mobile-link${currentPage === "aiTools" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("aiTools")}><span className="page-nav-mobile-icon">{Icon.Sparkle}</span> {t("nav.aiTools", "AI Tools")}</button>
                  </>
                ) : (
                  <>
                    <button className="page-nav-mobile-link page-nav-mobile-link--locked" onClick={() => { setMenuOpen(false); onUpgrade?.(); }}><span className="page-nav-mobile-icon">{Icon.Calendar}</span> {t("nav.meetingPrep", "Meeting Prep")} <span className="page-nav-mobile-lock">{Icon.Lock}</span></button>
                    <button className="page-nav-mobile-link page-nav-mobile-link--locked" onClick={() => { setMenuOpen(false); onUpgrade?.(); }}><span className="page-nav-mobile-icon">{Icon.Calendar}</span> {t("nav.readingPlans")} <span className="page-nav-mobile-lock">{Icon.Lock}</span></button>
                    <button className="page-nav-mobile-link page-nav-mobile-link--locked" onClick={() => { setMenuOpen(false); onUpgrade?.(); }}><span className="page-nav-mobile-icon">{Icon.Notes}</span> {t("nav.studyNotes")} <span className="page-nav-mobile-lock">{Icon.Lock}</span></button>
                    <button className="page-nav-mobile-link page-nav-mobile-link--locked" onClick={() => { setMenuOpen(false); onUpgrade?.(); }}><span className="page-nav-mobile-icon">{Icon.Sparkle}</span> {t("nav.aiTools", "AI Tools")} <span className="page-nav-mobile-lock">{Icon.Lock}</span></button>
                  </>
                )}
              </div>
            )}

            {/* Community accordion */}
            <button className={`page-nav-mobile-section-toggle${communityActive ? " page-nav-mobile-section-toggle--active" : ""}`} onClick={() => setMobileCommunityOpen(o => !o)} aria-expanded={mobileCommunityOpen}>
              <span>{t("nav.community")}</span>
              <span className={`page-nav-mobile-chevron${mobileCommunityOpen ? " page-nav-mobile-chevron--open" : ""}`}>{Icon.Chevron}</span>
            </button>
            {mobileCommunityOpen && (
              <div className="page-nav-mobile-section-items">
                <button className={`page-nav-mobile-link${currentPage === "blog" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("blog")}><span className="page-nav-mobile-icon">{Icon.Feed}</span> {t("app.blog")}</button>
                <button className={`page-nav-mobile-link${currentPage === "forum" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("forum")}><span className="page-nav-mobile-icon">{Icon.Users}</span> {t("app.forum")}</button>
                {isPremium
                  ? <button className={`page-nav-mobile-link${currentPage === "groups" || currentPage === "groupDetail" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("groups")}><span className="page-nav-mobile-icon">{Icon.Users}</span> {t("nav.studyGroups")}</button>
                  : <button className="page-nav-mobile-link page-nav-mobile-link--locked" onClick={() => { setMenuOpen(false); onUpgrade?.(); }}><span className="page-nav-mobile-icon">{Icon.Users}</span> {t("nav.studyGroups")} <span className="page-nav-mobile-lock">{Icon.Lock}</span></button>}
              </div>
            )}

            {/* More accordion */}
            <button className={`page-nav-mobile-section-toggle${moreActive ? " page-nav-mobile-section-toggle--active" : ""}`} onClick={() => setMobileMoreOpen(o => !o)} aria-expanded={mobileMoreOpen}>
              <span>{t("nav.more")}</span>
              <span className={`page-nav-mobile-chevron${mobileMoreOpen ? " page-nav-mobile-chevron--open" : ""}`}>{Icon.Chevron}</span>
            </button>
            {mobileMoreOpen && (
              <div className="page-nav-mobile-section-items">
                <button className={`page-nav-mobile-link${currentPage === "about" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("about")}><span className="page-nav-mobile-icon">{Icon.Info}</span> {t("app.about")}</button>
                {canModerate && (
                  <button className={`page-nav-mobile-link${currentPage === "admin" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("admin")}>
                    <span className="page-nav-mobile-icon">{Icon.Shield}</span> {isAdmin ? t("app.admin") : "Moderation"}
                  </button>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="page-nav-mobile-divider" />
            {isPremium
              ? <button className={`page-nav-mobile-link${currentPage === "messages" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("messages")}>
                  <span className="page-nav-mobile-icon">{Icon.Message}</span> {t("nav.messages")} {unreadMessages > 0 && <span className="page-nav-mobile-badge">{unreadMessages}</span>}
                </button>
              : <button className="page-nav-mobile-link page-nav-mobile-link--locked" onClick={() => { setMenuOpen(false); onUpgrade?.(); }}><span className="page-nav-mobile-icon">{Icon.Message}</span> {t("nav.messages")} <span className="page-nav-mobile-lock">{Icon.Lock}</span></button>}

            {!isPremium && (
              <button className="page-nav-mobile-upgrade-btn" onClick={() => { setMenuOpen(false); onUpgrade?.(); }}><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6z"/></svg> Upgrade to Premium — $3/mo</button>
            )}

            <div className="page-nav-mobile-divider" />
            {user && onLogout && (
              <button className="page-nav-mobile-link page-nav-mobile-logout" onClick={() => { setMenuOpen(false); onLogout(); }} style={{ marginTop: 4 }}>
                {t("app.logOut")}
              </button>
            )}
          </div>
        )}
      </nav>
      <AnnouncementBanner />
    </>
  );
}
