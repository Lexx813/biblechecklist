import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../styles/not-found.css";

export default function NotFoundPage({ navigate, user = null, darkMode, setDarkMode, i18n, onLogout }: { navigate: (page: string) => void; user?: unknown; darkMode?: boolean; setDarkMode?: (v: boolean) => void; i18n?: unknown; onLogout?: () => void }) {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = t("notFound.docTitle");
    return () => { document.title = "JW Study"; };
  }, [t]);

  return (
    <div className="nf-wrap">
      <div className="nf-card">
        <div className="nf-glow" aria-hidden="true" />
        <div className="nf-code">404</div>
        <h1 className="nf-title">{t("notFound.title")}</h1>
        <p className="nf-sub">{t("notFound.body")}</p>
        <div className="nf-path">{window.location.pathname}</div>
        <div className="nf-actions">
          <button className="nf-btn nf-btn--primary" onClick={() => navigate("home")}>
            {t("notFound.goHome")}
          </button>
          <button className="nf-btn nf-btn--ghost" onClick={() => window.history.back()}>
            {t("notFound.goBack")}
          </button>
        </div>
        <p className="nf-verse">{t("notFound.verse")}</p>
      </div>
    </div>
  );
}
