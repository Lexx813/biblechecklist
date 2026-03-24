import { useTranslation } from "react-i18next";
import "../styles/pagenav.css";
import AnnouncementBanner from "./AnnouncementBanner";
import NotificationBell from "./notifications/NotificationBell";

export default function PageNav({ navigate, darkMode, setDarkMode, i18n, user, onLogout }) {
  const { t } = useTranslation();
  return (
    <>
      <nav className="page-nav">
        <button className="page-nav-brand" onClick={() => navigate("home")}>
          <span className="page-nav-brand-icon">📖</span>
          <span className="page-nav-brand-name">NWT Progress</span>
        </button>
        <div className="page-nav-links">
          <button className="page-nav-link" onClick={() => navigate("home")}>{t("app.home")}</button>
          <button className="page-nav-link" onClick={() => navigate("main")}>{t("home.navTracker")}</button>
          <button className="page-nav-link" onClick={() => navigate("blog")}>{t("app.blog")}</button>
          <button className="page-nav-link" onClick={() => navigate("forum")}>{t("app.forum")}</button>
          <button className="page-nav-link" onClick={() => navigate("quiz")}>{t("quiz.nav")}</button>
          {user && (
            <button className="page-nav-link" onClick={() => navigate("feed")}>{t("feed.navLink")}</button>
          )}
          {user && (
            <button className="page-nav-link" onClick={() => navigate("bookmarks")}>{t("bookmarks.title")}</button>
          )}
        </div>
        <div className="page-nav-actions">
          {user && (
            <button
              className="page-nav-icon-btn"
              onClick={() => navigate("search")}
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
              className="page-nav-icon-btn page-nav-logout-btn"
              onClick={onLogout}
              title={t("app.logOut")}
            >
              {t("app.logOut")}
            </button>
          )}
        </div>
      </nav>
      <AnnouncementBanner />
    </>
  );
}
