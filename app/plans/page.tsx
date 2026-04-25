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

      <header className="border-b border-slate-200 bg-violet-50/50 dark:border-white/10 dark:bg-violet-950/20">
        <div className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            {PLAN_TEMPLATES.length} reading plans
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
            A plan for every pace
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
            Structured Bible reading plans for the New World Translation. Daily readings, streak tracking,
            catch-up mode if you fall behind.
          </p>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <ul className="grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLAN_TEMPLATES.map((p) => (
            <li key={p.key}>
              <Link
                href={`/plans/${p.key}`}
                className="group flex h-full flex-col rounded-md border border-slate-200 p-5 transition hover:border-violet-400 hover:shadow-[0_8px_32px_-12px_rgba(124,58,237,0.25)] dark:border-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold leading-tight tracking-tight text-slate-900 group-hover:text-violet-700 dark:text-slate-50 dark:group-hover:text-violet-300">
                    {p.name}
                  </h2>
                  <span className="shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:border-white/10 dark:text-slate-400">
                    {p.difficulty}
                  </span>
                </div>
                <p className="mt-3 flex-1 text-sm text-slate-600 dark:text-slate-300">{p.description}</p>
                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 text-xs tabular-nums text-slate-500 dark:border-white/10 dark:text-slate-400">
                  <span><span className="font-semibold text-slate-900 dark:text-slate-100">{p.totalDays}</span> days</span>
                  <span aria-hidden className="text-slate-300 dark:text-white/20">·</span>
                  <span><span className="font-semibold text-slate-900 dark:text-slate-100">{p.totalChapters}</span> chapters</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-20 rounded-md border border-violet-200/70 bg-violet-50/50 p-6 sm:p-8 dark:border-violet-500/20 dark:bg-violet-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="max-w-xl">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                Why read with a plan
              </div>
              <p className="mt-2 text-base text-slate-700 dark:text-slate-300">
                A structured plan helps you stay consistent alongside meetings, field service, and family worship.
                Reminders, streaks, and catch-up mode are all built in.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 self-start rounded-md bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 sm:self-auto"
            >
              Start a plan
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
