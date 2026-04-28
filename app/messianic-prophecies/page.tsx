import type { Metadata } from "next";
import MessianicScrolly from "./MessianicScrolly";
import { MESSIANIC_PROPHECIES } from "../../src/data/messianicProphecies";

export const revalidate = false; // static

const COUNT = MESSIANIC_PROPHECIES.length;

const TITLE = `${COUNT} Messianic Prophecies Fulfilled in Jesus | JW Study`;
const DESCRIPTION = `${COUNT} Hebrew Scripture prophecies, paired with where each one was fulfilled in the life of Jesus. Sourced from the New World Translation. Free, no signup.`;
const URL = "https://jwstudy.org/messianic-prophecies";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    url: URL,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function MessianicPropheciesPage() {
  const schemaArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${URL}#article`,
    headline: `${COUNT} Messianic Prophecies Fulfilled in Jesus`,
    description: DESCRIPTION,
    url: URL,
    image: "https://jwstudy.org/og-image.jpg",
    inLanguage: "en",
    author: { "@type": "Person", "@id": "https://jwstudy.org/#creator", name: "Alexi" },
    publisher: {
      "@type": "Organization",
      "@id": "https://jwstudy.org/#organization",
      name: "JW Study",
      logo: { "@type": "ImageObject", url: "https://jwstudy.org/icon-512.png", width: 512, height: 512 },
    },
  };

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://jwstudy.org" },
      { "@type": "ListItem", position: 2, name: "Messianic Prophecies", item: URL },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaArticle) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />

      <main className="font-[var(--font-display,inherit)] text-[var(--text-primary)]">
        <TopNav />
        <Hero count={COUNT} />
        <Specs count={COUNT} />
        <MessianicScrolly />
        <Closer />
      </main>
    </>
  );
}

// ── Top nav: thin row with a back link to home ───────────────────────────────

function TopNav() {
  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-[var(--border)] px-4 py-4 sm:px-6 lg:px-12"
    >
      <div className="mx-auto max-w-7xl">
        <a
          href="/"
          className="group inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>
          Back to JW Study
        </a>
      </div>
    </nav>
  );
}

// ── Hero: editorial typography, asymmetric, no centered-stack template ───────

function Hero({ count }: { count: number }) {
  return (
    <section className="border-b border-[var(--border)] px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-24 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-y-10 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--text-muted)]">
            Pt. I
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">A study from JW Study</p>
        </div>
        <div className="lg:col-span-9 lg:col-start-3">
          <h1 className="text-[clamp(2.25rem,7vw,5.5rem)] font-extrabold leading-[0.96] tracking-[-0.035em] text-[var(--text-primary)]">
            Twelve prophets.
            <br />
            <span className="text-violet-700 dark:text-violet-300">Across fifteen centuries.</span>
            <br />
            One person they
            <br />
            would never meet.
          </h1>
          <p className="mt-10 max-w-[58ch] text-lg leading-relaxed text-[var(--text-muted)] sm:text-xl">
            From Moses (around 1500 BCE) to Malachi (around 443 BCE), the writers of the Hebrew Scriptures left {count} specific
            statements about a coming Messiah. His lineage. His birth. His ministry. His death. His resurrection.
            Jesus of Nazareth fulfilled every one of them. Below, every prophecy is paired with the Christian Greek Scripture
            that records its fulfillment, and every reference opens at the verse on Watchtower Online Library.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Specs: a colophon-style record. Not a stats tile grid. ───────────────────

function Specs({ count }: { count: number }) {
  const rows = [
    { label: "Prophecies", value: String(count).padStart(3, "0") },
    { label: "Prophets",   value: "12" },
    { label: "Span",       value: "≈ 1,500 years" },
    { label: "Fulfilled",  value: "in one person" },
  ];
  return (
    <section className="border-b border-[var(--border)] bg-[var(--bg)] px-4 py-10 sm:px-6 sm:py-12 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <dl className="divide-y divide-[var(--border)] text-sm sm:text-base">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[140px_1fr] items-baseline gap-6 py-3 sm:grid-cols-[200px_1fr]">
              <dt className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">{r.label}</dt>
              <dd className="font-extrabold tabular-nums text-[var(--text-primary)]">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Closer() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg)] px-4 py-20 sm:px-6 sm:py-24 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-y-8 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[var(--text-muted)]">
            For deeper study
          </p>
        </div>
        <div className="lg:col-span-9 lg:col-start-3">
          <p className="max-w-[58ch] text-lg leading-relaxed text-[var(--text-muted)]">
            For the canonical treatment of these prophecies, see the &ldquo;Jesus Christ&rdquo; article in <em>Insight on the Scriptures</em> Volume 2,
            and the &ldquo;Jesus Christ&rdquo; section in <em>Reasoning From the Scriptures</em>. Both are available on Watchtower Online Library.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href="https://wol.jw.org/en/wol/d/r1/lp-e/1200002770"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-5 py-3 text-sm font-bold tracking-wide text-white shadow-sm transition hover:bg-violet-700"
            >
              Open Insight on wol.jw.org
              <span aria-hidden="true">→</span>
            </a>
            <a
              href="/"
              className="text-sm font-bold tracking-wide text-[var(--text-primary)] underline decoration-[var(--border)] decoration-2 underline-offset-[6px] transition hover:decoration-violet-600"
            >
              Open JW Study
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
