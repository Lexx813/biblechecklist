import { useEffect } from "react";
import "../styles/not-found.css";

export default function NotFoundPage({ navigate }) {
  // Ensure the URL stays as-is so the user can see what they typed wrong
  useEffect(() => {
    document.title = "404 — Page Not Found";
    return () => { document.title = "NWT Progress"; };
  }, []);

  return (
    <div className="nf-wrap">
      <div className="nf-card">
        <div className="nf-glow" aria-hidden="true" />
        <div className="nf-code">404</div>
        <h1 className="nf-title">Page not found</h1>
        <p className="nf-sub">
          The address you entered doesn't exist. It may have been moved, deleted, or you may have mistyped it.
        </p>
        <div className="nf-path">{window.location.pathname}</div>
        <div className="nf-actions">
          <button className="nf-btn nf-btn--primary" onClick={() => navigate("home")}>
            Go home
          </button>
          <button className="nf-btn nf-btn--ghost" onClick={() => window.history.back()}>
            Go back
          </button>
        </div>
        <p className="nf-verse">"Your word is a lamp for my feet, a light on my path." — Psalm 119:105</p>
      </div>
    </div>
  );
}
