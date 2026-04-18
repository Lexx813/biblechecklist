import { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import "../styles/app-layout.css";

export const InsideAppLayout = createContext(false);

interface Props {
  navigate: (page: string, params?: Record<string, unknown>) => void;
  user: { id?: string; email?: string } | null | undefined;
  currentPage: string;
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

const BETA_LANGS = ["ja", "ko"];

export default function AppLayout({ currentPage, children }: Props) {
  const isNested = useContext(InsideAppLayout);
  if (isNested) return <>{children}</>;

  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] ?? "en";
  const showBetaBanner = BETA_LANGS.includes(lang) && !localStorage.getItem("nwt-beta-lang-dismissed");

  return (
    <InsideAppLayout.Provider value={true}>
      <div key={currentPage} className="al-content">
        {showBetaBanner && (
          <div className="al-beta-banner">
            <p>{t("betaLang.notice")}</p>
            <p style={{ fontSize: "0.85rem", opacity: 0.85 }}>{t("betaLang.reason")}</p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <a href="mailto:support@jwstudy.org?subject=Translation%20Suggestion" className="al-beta-link">{t("betaLang.suggest")}</a>
              <button className="al-beta-dismiss" onClick={() => { localStorage.setItem("nwt-beta-lang-dismissed", "1"); window.location.reload(); }}>{t("betaLang.dismiss")}</button>
            </div>
          </div>
        )}
        {children}
      </div>
    </InsideAppLayout.Provider>
  );
}
