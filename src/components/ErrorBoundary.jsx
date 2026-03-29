import React from "react";
import * as Sentry from "@sentry/react";
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
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes("Failed to fetch dynamically imported module") ||
        this.state.error?.message?.includes("Importing a module script failed") ||
        this.state.error?.message?.includes("error loading dynamically imported module");

      if (isChunkError) {
        const lastReload = Number(sessionStorage.getItem("chunkReloadAt") || "0");
        const reloadCount = Date.now() - lastReload < 60_000
          ? Number(sessionStorage.getItem("chunkReloadCount") || "0")
          : 0; // reset if last attempt was >60s ago
        if (reloadCount < 2) {
          sessionStorage.setItem("chunkReloadCount", String(reloadCount + 1));
          sessionStorage.setItem("chunkReloadAt", String(Date.now()));
          // Unregister SW and wipe all caches so stale chunks are gone, then hard-reload.
          const cleanup = [];
          if ("serviceWorker" in navigator) {
            cleanup.push(
              navigator.serviceWorker.getRegistrations()
                .then(regs => Promise.all(regs.map(r => r.unregister())))
            );
          }
          if ("caches" in window) {
            cleanup.push(
              caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
            );
          }
          // Hard reload with cache-buster so browsers don't serve stale HTML
          Promise.all(cleanup).finally(() => {
            const url = new URL(window.location.href);
            url.searchParams.set("_r", Date.now());
            window.location.replace(url.toString());
          });
          return null;
        }
        // Exceeded retries — show a targeted message
        return (
          <ErrorPage
            error={{ message: "The app was updated. Please reload to get the latest version." }}
            onReset={null}
          />
        );
      }

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
