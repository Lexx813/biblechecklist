/**
 * /promo, AI Study Companion promotional video
 * Public page, no auth required.
 * Renders the AIPromoVideo Remotion composition client-side via @remotion/player.
 */

import type { Metadata } from "next";
import PromoPlayer from "./PromoPlayer";

export const metadata: Metadata = {
  title: "AI Study Companion, JW Study",
  description:
    "See how the JW Study AI Study Companion answers Bible questions from Watch Tower publications, the NWT, and wol.jw.org, exclusively for Jehovah's Witnesses.",
  alternates: { canonical: "https://jwstudy.org/promo" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "AI Study Companion, JW Study",
    description: "Bible questions answered from JW sources only. 20+ Watch Tower publications indexed.",
    url: "https://jwstudy.org/promo",
    siteName: "JW Study",
    type: "website",
  },
};

export default function PromoPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#0D0820",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        gap: 32,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "rgba(255,255,255,0.7)",
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
            marginBottom: 24,
          }}
        >
          ← Back to JW Study
        </a>
        <h1
          style={{
            fontSize: "clamp(24px, 4vw, 42px)",
            fontWeight: 900,
            color: "white",
            margin: "0 0 8px",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: 0,
          }}
        >
          AI Study Companion
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.45)",
            margin: 0,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Powered by JW sources only · wol.jw.org · 20+ publications
        </p>
      </div>

      {/* Video player */}
      <PromoPlayer />

      {/* CTA */}
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <a
          href="/ai"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#7C3AED",
            color: "white",
            textDecoration: "none",
            padding: "14px 32px",
            borderRadius: 6,
            fontSize: 16,
            fontWeight: 800,
            fontFamily: "system-ui, sans-serif",
            boxShadow: "0 8px 28px rgba(124,58,237,0.32)",
            minHeight: 48,
          }}
        >
          Try it free at jwstudy.org
        </a>
        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.3)",
          fontFamily: "system-ui, sans-serif",
          margin: 0,
        }}>
          Free for all publishers · No account required to browse
        </p>
      </div>
    </main>
  );
}
