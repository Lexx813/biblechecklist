import React from "react";
import "../styles/pagefooter.css";

function legalLink(e: React.MouseEvent<HTMLAnchorElement>, path: string) {
  e.preventDefault();
  history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function PageFooter() {
  return (
    <footer className="page-footer">
      <span>© {new Date().getFullYear()} JW Study · Lexx Solutionz</span>
      <span className="page-footer-sep">·</span>
      <a href="/terms"   className="page-footer-link" onClick={e => legalLink(e, "/terms")}>Terms of Service</a>
      <span className="page-footer-sep">·</span>
      <a href="/privacy" className="page-footer-link" onClick={e => legalLink(e, "/privacy")}>Privacy Policy</a>
      <span className="page-footer-sep">·</span>
      <a href="/support" className="page-footer-link" onClick={e => legalLink(e, "/support")}>Support</a>
      <span className="page-footer-sep">·</span>
      <a href="https://www.jw.org" className="page-footer-link" target="_blank" rel="noopener noreferrer">JW.org</a>
    </footer>
  );
}
