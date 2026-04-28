"use client";

import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Lazy-load Sentry to avoid blocking the error UI on first paint.
    if (typeof window === "undefined") return;
    import("@sentry/react")
      .then(({ captureException }) => captureException(error, { tags: { boundary: "route" } }))
      .catch(() => {});
  }, [error]);

  return (
    <main
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px",
        background: "var(--bg, #f7f4fc)",
      }}
    >
      <div style={{ maxWidth: 480, textAlign: "center" }}>
        <div
          aria-hidden
          style={{
            margin: "0 auto 20px",
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "linear-gradient(135deg,#6A3DAA,#C084FC)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: 24,
          }}
        >
          !
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px", color: "var(--text-primary, #1E1035)" }}>
          Something went wrong on this page
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: "var(--text-muted, #6b6388)", margin: "0 0 24px" }}>
          The error has been reported. You can try again, or head back home.
        </p>
        {error.digest && (
          <p style={{ fontSize: 12, color: "var(--text-muted, #6b6388)", margin: "0 0 20px", fontFamily: "monospace" }}>
            Reference: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              background: "transparent",
              color: "var(--text-primary, #1E1035)",
              border: "1px solid var(--border, #DDD0F5)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
