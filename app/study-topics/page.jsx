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
      <div style={SEO_HIDE}>
        <h1>Bible Study Topics for Jehovah's Witnesses</h1>
        <p>
          Explore key Bible topics from the New World Translation perspective. Each topic includes
          in-depth scriptural analysis covering doctrine, prophecy, and practical Christian living.
        </p>
        <ul>
          {STUDY_TOPICS.map((topic) => (
            <li key={topic.slug}>
              <a href={`/study-topics/${topic.slug}`}>{topic.title}</a>
              <span> — {topic.subtitle}</span>
            </li>
          ))}
        </ul>
      </div>
      <ClientShell />
    </>
  );
}

export async function generateStaticParams() {
  return STUDY_TOPICS.map((t) => ({ slug: t.slug }));
}
