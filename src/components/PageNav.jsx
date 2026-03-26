import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "../styles/pagenav.css";
import AnnouncementBanner from "./AnnouncementBanner";
import NotificationBell from "./notifications/NotificationBell";
import LanguageSelect from "./LanguageSelect";
import { useFullProfile } from "../hooks/useAdmin";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { isDev } from "../lib/devOnly";

export default function PageNav({ navigate, darkMode, setDarkMode, i18n, user, onLogout, currentPage }) {
  const { t } = useTranslation();
  const { data: profile } = useFullProfile(user?.id);
  const isAdmin = profile?.is_admin;
  const canModerate = isAdmin || profile?.is_moderator;
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const menuRef = useRef(null);
  const moreRef = useRef(null);
  const communityRef = useRef(null);

  const morePages = new Set(["about", "admin"]);
  const moreActive = morePages.has(currentPage);
  const communityPages = new Set(["blog", "forum"]);
  const communityActive = communityPages.has(currentPage);

  function go(page) {
    setMenuOpen(false);
    navigate(page);
  }

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Close menu on resize to desktop
  useEffect(() => {
    function handler() { if (window.innerWidth > 1180) setMenuOpen(false); }
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Close "More" dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return;
    function handler(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  // Close "Community" dropdown on outside click
  useEffect(() => {
    if (!communityOpen) return;
    function handler(e) {
      if (communityRef.current && !communityRef.current.contains(e.target)) setCommunityOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [communityOpen]);

  return (
    <>
      <a href="#main-content" className="skip-to-content">{t("a11y.skipToContent")}</a>
      <nav className="page-nav" ref={menuRef}>
        <button className="page-nav-brand" onClick={() => go("home")}>
          <span className="page-nav-brand-icon">📖</span>
          <span className="page-nav-brand-name">NWT Progress</span>
        </button>

        {/* Desktop links */}
        <div className="page-nav-links">
          <button className={`page-nav-link${currentPage === "home" ? " page-nav-link--active" : ""}`} onClick={() => go("home")}>{t("app.home")}</button>
          <button className={`page-nav-link${currentPage === "main" ? " page-nav-link--active" : ""}`} onClick={() => go("main")}>{t("home.navTracker")}</button>
          <button className={`page-nav-link${currentPage === "quiz" ? " page-nav-link--active" : ""}`} onClick={() => go("quiz")}>{t("quiz.nav")}</button>

          {/* Community dropdown */}
          <div className="page-nav-more" ref={communityRef}>
            <button
              className={`page-nav-link page-nav-more-btn${communityActive ? " page-nav-link--active" : ""}${communityOpen ? " page-nav-more-btn--open" : ""}`}
              onClick={() => setCommunityOpen(o => !o)}
            >
              Community ▾
            </button>
            {communityOpen && (
              <div className="page-nav-more-menu">
                <button className={`page-nav-more-item${currentPage === "blog" ? " page-nav-more-item--active" : ""}`} onClick={() => { setCommunityOpen(false); go("blog"); }}>{t("app.blog")}</button>
                <button className={`page-nav-more-item${currentPage === "forum" ? " page-nav-more-item--active" : ""}`} onClick={() => { setCommunityOpen(false); go("forum"); }}>{t("app.forum")}</button>
              </div>
            )}
          </div>

          {/* More dropdown */}
          <div className="page-nav-more" ref={moreRef}>
            <button
              className={`page-nav-link page-nav-more-btn${moreActive ? " page-nav-link--active" : ""}${moreOpen ? " page-nav-more-btn--open" : ""}`}
              onClick={() => setMoreOpen(o => !o)}
            >
              More ▾
            </button>
            {moreOpen && (
              <div className="page-nav-more-menu">
                <button className={`page-nav-more-item${currentPage === "about" ? " page-nav-more-item--active" : ""}`} onClick={() => { setMoreOpen(false); go("about"); }}>{t("app.about")}</button>
                {canModerate && <button className={`page-nav-more-item${currentPage === "admin" ? " page-nav-more-item--active" : ""}`} onClick={() => { setMoreOpen(false); go("admin"); }}>{isAdmin ? t("app.admin") : "Moderation"}</button>}
                {i18n && <div className="page-nav-more-lang"><LanguageSelect /></div>}
              </div>
            )}
          </div>
        </div>

        <div className="page-nav-actions">
          {user && (
            <div className="page-nav-dev-icons">
              <button className={`page-nav-icon-btn${currentPage === "feed" ? " page-nav-icon-btn--active" : ""}`} onClick={() => go("feed")} title={t("feed.navLink")}>📰</button>
              <button className={`page-nav-icon-btn${currentPage === "bookmarks" ? " page-nav-icon-btn--active" : ""}`} onClick={() => go("bookmarks")} title={t("bookmarks.title")}>🔖</button>
              {isAdmin
                ? <button className={`page-nav-icon-btn${currentPage === "readingPlans" ? " page-nav-icon-btn--active" : ""}`} onClick={() => go("readingPlans")} title="Reading Plans">📅</button>
                : <button className="page-nav-icon-btn page-nav-icon-btn--locked page-nav-pro-btn" data-tip="🔒 Pro feature" onClick={e => e.preventDefault()} title="">📅</button>}
              {isAdmin
                ? <button className={`page-nav-icon-btn${currentPage === "studyNotes" ? " page-nav-icon-btn--active" : ""}`} onClick={() => go("studyNotes")} title="Study Notes">📝</button>
                : <button className="page-nav-icon-btn page-nav-icon-btn--locked page-nav-pro-btn" data-tip="🔒 Pro feature" onClick={e => e.preventDefault()} title="">📝</button>}
            </div>
          )}
          {user && (
            isAdmin
              ? <button className={`page-nav-icon-btn${currentPage === "messages" ? " page-nav-icon-btn--active" : ""}`} onClick={() => go("messages")} title="Messages" style={{ position: "relative" }}>
                  💬
                  {unreadMessages > 0 && <span className="page-nav-msg-badge">{unreadMessages}</span>}
                </button>
              : <button className="page-nav-icon-btn page-nav-icon-btn--locked page-nav-pro-btn" data-tip="🔒 Pro feature" onClick={e => e.preventDefault()} title="" style={{ position: "relative" }}>
                  💬
                </button>
          )}
          {user && (
            isAdmin
              ? <button className={`page-nav-icon-btn${currentPage === "groups" || currentPage === "groupDetail" ? " page-nav-icon-btn--active" : ""}`} onClick={() => go("groups")} title="Study Groups">👥</button>
              : <button className="page-nav-icon-btn page-nav-icon-btn--locked page-nav-pro-btn" data-tip="🔒 Pro feature" onClick={e => e.preventDefault()} title="">👥</button>
          )}
          {user && (
            <button
              className="page-nav-icon-btn"
              onClick={() => go("search")}
              title={t("search.placeholder")}
            >
              🔍
            </button>
          )}
          {user && <NotificationBell userId={user.id} navigate={navigate} />}
          {setDarkMode && (
            <button
              className="page-nav-icon-btn"
              onClick={() => setDarkMode(d => !d)}
              title={darkMode ? t("app.lightMode") : t("app.darkMode")}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
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
              title={profile?.display_name || user.email}
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="page-nav-avatar-img" alt="avatar" />
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
            <button className={`page-nav-mobile-link${currentPage === "home" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("home")}>{t("app.home")}</button>
            <button className={`page-nav-mobile-link${currentPage === "main" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("main")}>{t("home.navTracker")}</button>
            <button className={`page-nav-mobile-link${currentPage === "quiz" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("quiz")}>{t("quiz.nav")}</button>
            <div className="page-nav-mobile-section-label">Community</div>
            <button className={`page-nav-mobile-link${currentPage === "blog" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("blog")}>{t("app.blog")}</button>
            <button className={`page-nav-mobile-link${currentPage === "forum" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("forum")}>{t("app.forum")}</button>
            <button className={`page-nav-mobile-link${currentPage === "about" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("about")}>{t("app.about")}</button>
            {canModerate && (
              <button className={`page-nav-mobile-link${currentPage === "admin" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("admin")}>
                {isAdmin ? t("app.admin") : "Moderation"}
              </button>
            )}
            {i18n && <div className="page-nav-mobile-lang"><LanguageSelect /></div>}
            {user && onLogout && (
              <button className="page-nav-mobile-link page-nav-mobile-logout" onClick={() => { setMenuOpen(false); onLogout(); }}>
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
