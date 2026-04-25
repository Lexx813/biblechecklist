import Link from "next/link";
import PublicNav from "../_components/PublicNav";
import PublicFooter from "../_components/PublicFooter";
import { PLAN_TEMPLATES } from "../../src/data/readingPlanTemplates";

export const revalidate = false;

const BASE = "https://jwstudy.org";

export const metadata = {
  title: "Bible Reading Plans for Jehovah's Witnesses | JW Study",
  description:
    "Free Bible reading plans using the New World Translation — NWT in 1 Year, New Testament in 90 Days, Gospels in 30 Days, and more. Track daily progress with JW Study.",
  alternates: {
    canonical: `${BASE}/plans`,
    languages: { en: `${BASE}/plans`, "x-default": `${BASE}/plans` },
  },
  openGraph: {
    title: "NWT Bible Reading Plans | JW Study",
    description:
      "Free Bible reading plans for Jehovah's Witnesses — track your daily progress with JW Study.",
    images: [{ url: "https://jwstudy.org/og-image.jpg", width: 1200, height: 630, alt: "JW Study — Bible Reading Tracker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NWT Bible Reading Plans | JW Study",
    description: "Free Bible reading plans for Jehovah's Witnesses.",
    images: [{ url: "https://jwstudy.org/og-image.jpg", width: 1200, height: 630, alt: "JW Study — Bible Reading Tracker" }],
  },
};

export default function PlansPage() {
  const schemaItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Bible Reading Plans — JW Study",
    description:
      "Free Bible reading plans for Jehovah's Witnesses using the New World Translation",
    url: `${BASE}/plans`,
    numberOfItems: PLAN_TEMPLATES.length,
    itemListElement: PLAN_TEMPLATES.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${BASE}/plans/${p.key}`,
      description: p.description,
    })),
  };

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Reading Plans", item: `${BASE}/plans` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaItemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Bible Reading Plans</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          Choose from {PLAN_TEMPLATES.length} structured Bible reading plans for NWT readers. Track your
          daily progress, build a reading streak, and stay consistent with your personal study.
        </p>

        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          {PLAN_TEMPLATES.map((p) => (
            <Link
              key={p.key}
              href={`/plans/${p.key}`}
              className="block rounded-md border border-slate-200 p-4 hover:border-violet-400 hover:bg-violet-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold">{p.name}</div>
                <div className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">{p.difficulty}</div>
              </div>
              <div className="mt-1 text-xs text-slate-500">{p.totalDays} days · {p.totalChapters} chapters</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{p.description}</p>
            </Link>
          ))}
        </section>

        <section className="mt-12 rounded-md border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Why read with a plan?</h2>
          <p className="mt-2">
            A structured plan helps you stay consistent — alongside meetings, field service, and family
            worship. JW Study tracks daily readings, sends reminders, shows your streak, and lets you
            rejoin if you fall behind.
          </p>
          <Link href="/" className="mt-3 inline-block font-semibold text-violet-700 hover:underline dark:text-violet-300">
            Open the tracker →
          </Link>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
