import React from "react";

// ErrorBoundary is intentionally not localized. It wraps the entire app from
// providers.tsx, so any imports here ship on every route — including the
// marketing homepage where most visitors are logged-out. Pulling in i18next
// just for last-resort error/404 copy added ~50–80 KB of JS to first paint.
// Hardcoded English is acceptable because this UI is rarely seen, and when
// it is, the message ("Something went wrong, try again") is universally
// understood enough that the bundle savings are the better trade.
const COPY = {
  errorTitle: "Something went wrong",
  errorFallback: "An unexpected error occurred. Please try again.",
  errorTryAgain: "Try again",
  errorReload: "Reload",
  errorAppUpdated: "JW Study was updated. Reloading to get the latest version.",
  notFoundTitle: "Page not found",
  notFoundBody: "The page you're looking for doesn't exist.",
  notFoundGoHome: "← Go home",
};

const errorWrapStyle = {
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #1E0D3C 0%, #341C5C 50%, #1E0D3C 100%)",
  padding: "2rem",
  fontFamily: "inherit",
};
const errorContentStyle: React.CSSProperties = {
  textAlign: "center",
  maxWidth: 480,
  color: "#f0eaff",
};
const errorCodeStyle = {
  fontSize: "4rem",
  fontWeight: 800,
  background: "linear-gradient(135deg, #a78bfa, #14b8a6)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  marginBottom: "0.5rem",
};
const errorTitleStyle = { fontSize: "1.4rem", fontWeight: 700, margin: "0 0 0.75rem" };
const errorSubStyle = { fontSize: "0.95rem", opacity: 0.75, margin: "0 0 1.5rem", lineHeight: 1.6 };
const errorActionsStyle: React.CSSProperties = { display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" };
const btnStyle = {
  padding: "0.65rem 1.25rem",
  borderRadius: 8,
  border: "1.5px solid rgba(167,139,250,0.4)",
  background: "rgba(124,58,237,0.2)",
  color: "#f0eaff",
  fontSize: "0.9rem",
  fontWeight: 600,
  cursor: "pointer",
};
const btnGhostStyle = { ...btnStyle, background: "transparent" };

interface ErrorPageProps {
  error?: { message?: string } | null;
  onReset?: (() => void) | null;
}

// ── Error page UI ──────────────────────────────────────────────
export function ErrorPage({ error, onReset }: ErrorPageProps) {
  return (
    <div style={errorWrapStyle}>
      <div style={errorContentStyle}>
        <div style={errorCodeStyle}>500</div>
        <h1 style={errorTitleStyle}>{COPY.errorTitle}</h1>
        <p style={errorSubStyle}>{error?.message || COPY.errorFallback}</p>
        <div style={errorActionsStyle}>
          {onReset && (
            <button style={btnStyle} onClick={onReset}>{COPY.errorTryAgain}</button>
          )}
          <button style={btnGhostStyle} onClick={() => window.location.reload()}>
            {COPY.errorReload}
          </button>
        </div>
      </div>
    </div>
  );
}

interface NotFoundPageProps {
  onBack?: () => void;
}

// ── 404 / Not Found page ───────────────────────────────────────
export function NotFoundPage({ onBack }: NotFoundPageProps) {
  return (
    <div style={errorWrapStyle}>
      <div style={errorContentStyle}>
        <div style={errorCodeStyle}>404</div>
        <h1 style={errorTitleStyle}>{COPY.notFoundTitle}</h1>
        <p style={errorSubStyle}>{COPY.notFoundBody}</p>
        <div style={errorActionsStyle}>
          <button style={btnStyle} onClick={onBack || (() => (window.location.href = "/"))}>
            {COPY.notFoundGoHome}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ── Error Boundary (class component, required by React) ───────
export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    // Lazy-load Sentry only when an error actually occurs, keeps it off the critical path
    import("@sentry/react")
      .then(({ captureException }) =>
        captureException(error, { extra: { componentStack: info.componentStack } })
      )
      .catch(() => {});
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
          // Navigate to root so Vercel always serves the latest index.html
          Promise.all(cleanup).finally(() => {
            window.location.href = "/";
          });
          return null;
        }
        // Exceeded retries, show a targeted message
        return (
          <ErrorPage
            error={{ message: COPY.errorAppUpdated }}
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
