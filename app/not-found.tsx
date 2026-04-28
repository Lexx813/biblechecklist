import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | JW Study",
  description: "The page you were looking for doesn't exist on JW Study.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        background: "var(--bg, #f7f4fc)",
      }}
    >
      <div style={{ maxWidth: 520, textAlign: "center" }}>
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--text-muted, #6b6388)",
          }}
        >
          404 · Page not found
        </p>
        <h1
          style={{
            margin: "0 0 16px",
            fontSize: 32,
            fontWeight: 700,
            color: "var(--text-primary, #1E1035)",
          }}
        >
          We couldn&apos;t find that page
        </h1>
        <p
          style={{
            margin: "0 0 28px",
            fontSize: 16,
            lineHeight: 1.6,
            color: "var(--text-muted, #6b6388)",
          }}
        >
          The link may be old or the page may have moved. Try one of these:
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 36,
          }}
        >
          <Link
            href="/"
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              background: "#7c3aed",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Bible reading tracker
          </Link>
          <Link
            href="/blog"
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
            Blog
          </Link>
          <Link
            href="/study-topics"
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
            Study topics
          </Link>
          <Link
            href="/messianic-prophecies"
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
            Messianic prophecies
          </Link>
        </div>
      </div>
    </main>
  );
}
