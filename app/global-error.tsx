"use client";

import { useEffect } from "react";

// Global root-layout fallback. Triggers when the root layout itself throws.
// This must own its own <html>/<body> per Next.js App Router contract.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    import("@sentry/react")
      .then(({ captureException }) =>
        captureException(error, { tags: { boundary: "global" } }),
      )
      .catch(() => {});
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 20px",
          background: "#f7f4fc",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: "#1E1035",
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
              color: "#fff",
              fontWeight: 800,
              fontSize: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>
            JW Study hit a problem
          </h1>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              color: "#6b6388",
              margin: "0 0 24px",
            }}
          >
            We&apos;ve been alerted automatically. Try reloading — if it keeps
            happening, please email support@jwstudy.org.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 12,
                color: "#6b6388",
                margin: "0 0 20px",
                fontFamily: "monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
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
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
