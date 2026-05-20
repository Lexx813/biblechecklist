import React from "react";
import { useTranslation } from "react-i18next";
import "../styles/pagefooter.css";

function legalLink(e: React.MouseEvent<HTMLAnchorElement>, path: string) {
  e.preventDefault();
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function PageFooter() {
  const { t } = useTranslation();
  return (
    <footer className="page-footer">
      <span>© {new Date().getFullYear()} JW Study · Lexx Solutionz</span>
      <span className="page-footer-sep">·</span>
      <a href="/terms"   className="page-footer-link" onClick={e => legalLink(e, "/terms")}>{t("footer.terms")}</a>
      <span className="page-footer-sep">·</span>
      <a href="/privacy" className="page-footer-link" onClick={e => legalLink(e, "/privacy")}>{t("footer.privacy")}</a>
      <span className="page-footer-sep">·</span>
      <a href="/support" className="page-footer-link" onClick={e => legalLink(e, "/support")}>{t("footer.support")}</a>
      <span className="page-footer-sep">·</span>
      <a href="https://www.jw.org" className="page-footer-link" target="_blank" rel="noopener noreferrer">JW.org</a>
    </footer>
  );
}
