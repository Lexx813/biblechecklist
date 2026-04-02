import ClientShell from "../_components/ClientShell";
import { STUDY_TOPICS } from "../../src/data/studyTopics";

export const revalidate = false; // static

const SEO_HIDE = {
  position: "absolute", width: 1, height: 1,
  overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap",
};

export const metadata = {
  title: "Bible Study Topics | NWT Progress",
  description:
    "Explore key Bible topics from the New World Translation perspective — including the nature of God, Jesus, the soul, death, God's Kingdom, and more.",
  alternates: { canonical: "https://nwtprogress.com/study-topics" },
  openGraph: {
    title: "Bible Study Topics | NWT Progress",
    description:
      "Explore key Bible topics from the New World Translation perspective — including the nature of God, Jesus, the soul, death, God's Kingdom, and more.",
    images: [{ url: "https://nwtprogress.com/og-image.webp", width: 1200, height: 630, alt: "NWT Progress — Bible Reading Tracker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bible Study Topics | NWT Progress",
    description:
      "Explore key Bible topics from the New World Translation perspective — including the nature of God, Jesus, the soul, death, God's Kingdom, and more.",
    images: [{ url: "https://nwtprogress.com/og-image.webp", width: 1200, height: 630, alt: "NWT Progress — Bible Reading Tracker" }],
  },
};

const schemaBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://nwtprogress.com" },
    { "@type": "ListItem", position: 2, name: "Study Topics", item: "https://nwtprogress.com/study-topics" },
  ],
};

export default function StudyTopicsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <ClientShell />
    </>
  );
}

export async function generateStaticParams() {
  return STUDY_TOPICS.map((t) => ({ slug: t.slug }));
}
