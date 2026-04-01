import ClientShell from "../_components/ClientShell";
import { STUDY_TOPICS } from "../../src/data/studyTopics";

export const revalidate = false; // static

export const metadata = {
  title: "Bible Study Topics | NWT Progress",
  description:
    "Explore key Bible topics from the New World Translation perspective — including the nature of God, Jesus, the soul, death, God's Kingdom, and more.",
  alternates: { canonical: "https://nwtprogress.com/study-topics" },
  openGraph: {
    title: "Bible Study Topics | NWT Progress",
    description:
      "Explore key Bible topics from the New World Translation perspective — including the nature of God, Jesus, the soul, death, God's Kingdom, and more.",
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
