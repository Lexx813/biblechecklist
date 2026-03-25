import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "../styles/pagenav.css";
import AnnouncementBanner from "./AnnouncementBanner";
import NotificationBell from "./notifications/NotificationBell";
import { useFullProfile } from "../hooks/useAdmin";

export default function PageNav({ navigate, darkMode, setDarkMode, i18n, user, onLogout, currentPage }) {
  const { t } = useTranslation();
  const { data: profile } = useFullProfile(user?.id);
  const isAdmin = profile?.is_admin;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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
    function handler() { if (window.innerWidth > 1053) setMenuOpen(false); }
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <>
      <nav className="page-nav" ref={menuRef}>
        <button className="page-nav-brand" onClick={() => go("home")}>
          <span className="page-nav-brand-icon">📖</span>
          <span className="page-nav-brand-name">NWT Progress</span>
        </button>

        {/* Desktop links */}
        <div className="page-nav-links">
          <button className={`page-nav-link${currentPage === "home" ? " page-nav-link--active" : ""}`} onClick={() => go("home")}>{t("app.home")}</button>
          <button className={`page-nav-link${currentPage === "main" ? " page-nav-link--active" : ""}`} onClick={() => go("main")}>{t("home.navTracker")}</button>
          <button className={`page-nav-link${currentPage === "blog" ? " page-nav-link--active" : ""}`} onClick={() => go("blog")}>{t("app.blog")}</button>
          <button className={`page-nav-link${currentPage === "forum" ? " page-nav-link--active" : ""}`} onClick={() => go("forum")}>{t("app.forum")}</button>
          <button className={`page-nav-link${currentPage === "quiz" ? " page-nav-link--active" : ""}`} onClick={() => go("quiz")}>{t("quiz.nav")}</button>
          <button className={`page-nav-link${currentPage === "about" ? " page-nav-link--active" : ""}`} onClick={() => go("about")}>About</button>
          {user && (
            <button className={`page-nav-link${currentPage === "feed" ? " page-nav-link--active" : ""}`} onClick={() => go("feed")}>{t("feed.navLink")}</button>
          )}
          {user && (
            <button className={`page-nav-link${currentPage === "bookmarks" ? " page-nav-link--active" : ""}`} onClick={() => go("bookmarks")}>{t("bookmarks.title")}</button>
          )}
          {isAdmin && (
            <button className={`page-nav-link${currentPage === "admin" ? " page-nav-link--active" : ""}`} onClick={() => go("admin")}>{t("app.admin")}</button>
          )}
        </div>

        <div className="page-nav-actions">
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
          {i18n && (
            <button
              className="page-nav-icon-btn"
              onClick={() => i18n.changeLanguage(i18n.language.startsWith("es") ? "en" : "es")}
            >
              {i18n.language.startsWith("es") ? "EN" : "ES"}
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
            <button className={`page-nav-mobile-link${currentPage === "blog" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("blog")}>{t("app.blog")}</button>
            <button className={`page-nav-mobile-link${currentPage === "forum" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("forum")}>{t("app.forum")}</button>
            <button className={`page-nav-mobile-link${currentPage === "quiz" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("quiz")}>{t("quiz.nav")}</button>
            <button className={`page-nav-mobile-link${currentPage === "about" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("about")}>About</button>
            {user && (
              <button className={`page-nav-mobile-link${currentPage === "feed" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("feed")}>{t("feed.navLink")}</button>
            )}
            {user && (
              <button className={`page-nav-mobile-link${currentPage === "bookmarks" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("bookmarks")}>{t("bookmarks.title")}</button>
            )}
            {isAdmin && (
              <button className={`page-nav-mobile-link${currentPage === "admin" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("admin")}>{t("app.admin")}</button>
            )}
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
