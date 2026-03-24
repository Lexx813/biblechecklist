import { useTranslation } from "react-i18next";
import "../styles/pagenav.css";

export default function PageNav({ navigate, darkMode, setDarkMode, i18n }) {
  const { t } = useTranslation();
  return (
    <nav className="page-nav">
      <button className="page-nav-brand" onClick={() => navigate("home")}>
        <span className="page-nav-brand-icon">📖</span>
        <span className="page-nav-brand-name">NWT Progress</span>
      </button>
      <div className="page-nav-links">
        <button className="page-nav-link" onClick={() => navigate("home")}>{t("app.home")}</button>
        <button className="page-nav-link" onClick={() => navigate("blog")}>{t("app.blog")}</button>
        <button className="page-nav-link" onClick={() => navigate("forum")}>{t("app.forum")}</button>
        <button className="page-nav-link" onClick={() => navigate("quiz")}>{t("quiz.nav")}</button>
      </div>
      <div className="page-nav-actions">
        {setDarkMode && (
          <button className="page-nav-icon-btn" onClick={() => setDarkMode(d => !d)} title={darkMode ? t("app.lightMode") : t("app.darkMode")}>
            {darkMode ? "☀️" : "🌙"}
          </button>
        )}
        {i18n && (
          <button className="page-nav-icon-btn" onClick={() => i18n.changeLanguage(i18n.language.startsWith("es") ? "en" : "es")}>
            {i18n.language.startsWith("es") ? "EN" : "ES"}
          </button>
        )}
      </div>
    </nav>
  );
}
