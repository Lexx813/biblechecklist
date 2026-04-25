import type { Metadata } from "next";
import AiAppClient from "../_components/ai/AiAppClient";

export const metadata: Metadata = {
  title: "AI Study Companion — JW Study",
  description:
    "A free Bible study assistant grounded in Watch Tower publications and the New World Translation. Look up scripture, prep for meetings, and answer doctrinal questions — aligned with jw.org and wol.jw.org.",
  alternates: { canonical: "https://jwstudy.org/ai" },
  openGraph: {
    title: "AI Study Companion — JW Study",
    description:
      "Free Bible study assistant grounded in Watch Tower publications and the NWT. Aligned with jw.org and wol.jw.org.",
    url: "https://jwstudy.org/ai",
    siteName: "JW Study",
    images: [{ url: "https://jwstudy.org/og-image.jpg", width: 1200, height: 630, alt: "JW Study — AI Study Companion" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Study Companion — JW Study",
    description:
      "Free Bible study assistant grounded in Watch Tower publications and the NWT.",
    images: [{ url: "https://jwstudy.org/og-image.jpg", alt: "JW Study — AI Study Companion" }],
  },
};

const schemaWebPage = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://jwstudy.org/ai#webpage",
  name: "AI Study Companion",
  description:
    "Free Bible study assistant grounded in Watch Tower publications and the New World Translation.",
  url: "https://jwstudy.org/ai",
  isPartOf: { "@type": "WebSite", "@id": "https://jwstudy.org/#website" },
  inLanguage: "en",
};

const schemaBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://jwstudy.org" },
    { "@type": "ListItem", position: 2, name: "AI Study Companion", item: "https://jwstudy.org/ai" },
  ],
};

export default function AiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <AiAppClient />
    </>
  );
}
