import { notFound } from "next/navigation";
import ClientShell from "../../_components/ClientShell";
import { PLAN_TEMPLATES, getTemplate } from "../../../src/data/readingPlanTemplates";
import { BOOKS } from "../../../src/data/books";

export const revalidate = false;

const BASE = "https://nwtprogress.com";
const SEO_HIDE = {
  position: "absolute" as const, width: 1, height: 1,
  overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap",
};

export async function generateStaticParams() {
  return PLAN_TEMPLATES.map((p) => ({ slug: p.key }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const plan = getTemplate(slug);
  if (!plan) return {};

  const description = `${plan.description} ${plan.totalDays} days, ${plan.totalChapters} chapters. Free Bible reading plan on NWT Progress.`;

  return {
    title: `${plan.name} — Bible Reading Plan | NWT Progress`,
    description,
    alternates: { canonical: `${BASE}/plans/${slug}` },
    openGraph: {
      title: `${plan.name} | NWT Progress`,
      description,
      type: "article",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${plan.name} | NWT Progress`,
      description,
    },
  };
}

export default async function PlanPage({ params }) {
  const { slug } = await params;
  const plan = getTemplate(slug);
  if (!plan) notFound();

  const planBooks = [...new Set(plan.bookIndices.map((i) => BOOKS[i].name))];

  const schemaCourse = {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${BASE}/plans/${slug}#course`,
    name: plan.name,
    description: plan.description,
    url: `${BASE}/plans/${slug}`,
    provider: {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "NWT Progress",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `P${plan.totalDays}D`,
      instructor: {
        "@type": "Organization",
        "@id": "https://nwtprogress.com/#organization",
        name: "NWT Progress",
      },
    },
    inLanguage: "en",
  };

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Reading Plans", item: `${BASE}/plans` },
      { "@type": "ListItem", position: 3, name: plan.name, item: `${BASE}/plans/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaCourse) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <div style={SEO_HIDE}>
        <h1>{plan.name} — Bible Reading Plan for Jehovah&apos;s Witnesses</h1>
        <p>{plan.description}</p>
        <p>
          Duration: {plan.totalDays} days · Chapters: {plan.totalChapters} · Difficulty: {plan.difficulty}
        </p>

        <h2>Books Covered in This Plan</h2>
        <ul>
          {planBooks.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>

        <h2>How the {plan.name} Plan Works</h2>
        <p>
          The {plan.name} plan divides {plan.totalChapters} chapters of the New World Translation
          evenly across {plan.totalDays} days. Each day you read a set portion and mark it complete
          in NWT Progress. The app tracks your streak, shows your overall progress, and sends
          reminders to keep you on schedule.
        </p>

        <h2>Why Use a Structured Reading Plan?</h2>
        <p>
          A structured plan helps Jehovah&apos;s Witnesses build a consistent personal Bible reading
          habit — one of the key spiritual routines recommended alongside meeting attendance, field
          service, and family worship. NWT Progress makes it easy to stay on track, review missed
          days with catch-up mode, and share progress with your study group.
        </p>

        <h2>Start This Plan Free on NWT Progress</h2>
        <p>
          Sign up for free at nwtprogress.com to start the {plan.name} plan, track your daily
          progress chapter by chapter, and connect with the NWT Progress community.
        </p>
      </div>
      <ClientShell />
    </>
  );
}
