import { notFound } from "next/navigation";
import ClientShell from "../../_components/ClientShell";
import { PLAN_TEMPLATES, getTemplate } from "../../../src/data/readingPlanTemplates";
import { BOOKS, OT_COUNT } from "../../../src/data/books";
import { STUDY_TOPICS } from "../../../src/data/studyTopics";

function bookToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

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

  const planBookIndices = [...new Set(plan.bookIndices)];
  const planBooks = planBookIndices.map((i) => ({ idx: i, name: BOOKS[i].name }));
  const hasHebrew = planBookIndices.some((i) => i < OT_COUNT);
  const hasGreek = planBookIndices.some((i) => i >= OT_COUNT);
  const scope =
    hasHebrew && hasGreek
      ? "both the Hebrew Scriptures and the Christian Greek Scriptures"
      : hasHebrew
      ? "the Hebrew Scriptures"
      : "the Christian Greek Scriptures";
  const chaptersPerDay = Math.max(1, Math.round(plan.totalChapters / plan.totalDays));
  const relatedPlans = PLAN_TEMPLATES.filter((p) => p.key !== plan.key).slice(0, 6);

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
        <p>
          The {plan.name} plan walks through {planBooks.length} books from {scope}. Each book
          below links to a study guide with summary, key verses, notable passages, and study
          questions drawn from Jehovah&apos;s Witnesses publications.
        </p>
        <ul>
          {planBooks.map((b) => (
            <li key={b.idx}>
              <a href={`${BASE}/books/${bookToSlug(b.name)}`}>Book of {b.name}</a>
            </li>
          ))}
        </ul>

        <h2>How the {plan.name} Plan Works</h2>
        <p>
          The {plan.name} plan divides {plan.totalChapters} chapters of the New World Translation
          evenly across {plan.totalDays} days — averaging about {chaptersPerDay}{" "}
          chapter{chaptersPerDay > 1 ? "s" : ""} per day. Each day you read the assigned portion
          and mark it complete in NWT Progress. The app tracks your streak, shows your overall
          progress, and helps you keep a consistent personal Bible reading routine.
        </p>

        <h2>Why Use a Structured Reading Plan?</h2>
        <p>
          Personal Bible reading is one of the spiritual routines Jehovah&apos;s organization
          encourages alongside meeting attendance, the ministry, and family worship. A structured
          plan like {plan.name} helps you stay consistent, read God&apos;s Word regularly, and
          strengthen your relationship with Jehovah. For deeper study, use this plan alongside
          JW Library and the research tools at wol.jw.org.
        </p>

        <h2>Tips for Getting the Most Out of This Plan</h2>
        <ul>
          <li>
            Set a fixed time each day for Bible reading — before the morning routine or as part
            of family worship.
          </li>
          <li>
            Take notes on verses that stand out and research them in the Insight on the Scriptures
            volumes on wol.jw.org.
          </li>
          <li>
            Look up scriptures cross-referenced in the meeting workbook and weekly Watchtower
            study.
          </li>
          <li>
            Review each book&apos;s study guide on NWT Progress before starting that section of
            the plan.
          </li>
        </ul>

        <h2>Other Reading Plans on NWT Progress</h2>
        <ul>
          {relatedPlans.map((p) => (
            <li key={p.key}>
              <a href={`${BASE}/plans/${p.key}`}>
                {p.name} — {p.totalDays} days, {p.totalChapters} chapters
              </a>
            </li>
          ))}
        </ul>

        <h2>Related Bible Study Topics</h2>
        <ul>
          {STUDY_TOPICS.map((t) => (
            <li key={t.slug}>
              <a href={`${BASE}/study-topics/${t.slug}`}>
                {t.title} — {t.subtitle}
              </a>
            </li>
          ))}
        </ul>

        <h2>Start This Plan Free on NWT Progress</h2>
        <p>
          Sign up for free at nwtprogress.com to start the {plan.name} plan, track your daily
          progress chapter by chapter, and build a lasting personal Bible reading habit.
        </p>
        <ul>
          <li><a href={`${BASE}/plans`}>All Reading Plans</a></li>
          <li><a href={`${BASE}/books`}>All 66 Bible Books</a></li>
          <li><a href={`${BASE}/study-topics`}>All Study Topics</a></li>
          <li><a href={`${BASE}/blog`}>NWT Progress Blog</a></li>
        </ul>
      </div>
      <ClientShell />
    </>
  );
}
