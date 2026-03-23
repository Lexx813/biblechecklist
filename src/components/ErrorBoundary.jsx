import React from "react";
import "../styles/landing.css";

// ── Error page UI ──────────────────────────────────────────────
export function ErrorPage({ error, onReset }) {
  return (
    <div className="error-wrap">
      <div className="landing-bg" aria-hidden="true">
        <div className="landing-orb landing-orb--1" />
        <div className="landing-orb landing-orb--2" />
        <div className="landing-orb landing-orb--3" />
        <div className="landing-grid" />
      </div>
      <div className="error-content">
        <div className="error-code">500</div>
        <h1 className="error-title">Something went wrong</h1>
        <p className="error-sub">
          {error?.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="error-actions">
          {onReset && (
            <button className="error-btn" onClick={onReset}>
              ↩ Try Again
            </button>
          )}
          <button
            className="error-btn error-btn--ghost"
            onClick={() => window.location.reload()}
          >
            ↺ Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 404 / Not Found page ───────────────────────────────────────
export function NotFoundPage({ onBack }) {
  return (
    <div className="error-wrap">
      <div className="landing-bg" aria-hidden="true">
        <div className="landing-orb landing-orb--1" />
        <div className="landing-orb landing-orb--2" />
        <div className="landing-orb landing-orb--3" />
        <div className="landing-grid" />
      </div>
      <div className="error-content">
        <div className="error-code">404</div>
        <h1 className="error-title">Page not found</h1>
        <p className="error-sub">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="error-actions">
          <button className="error-btn" onClick={onBack || (() => (window.location.href = "/"))}>
            ← Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Error Boundary (class component — required by React) ───────
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}
