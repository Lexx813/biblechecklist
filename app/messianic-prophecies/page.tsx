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

  const schemaItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${URL}#prophecy-list`,
    name: `${COUNT} Messianic Prophecies Fulfilled in Jesus`,
    description: DESCRIPTION,
    numberOfItems: COUNT,
    itemListElement: MESSIANIC_PROPHECIES.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreativeWork",
        "@id": `${URL}#${p.id}`,
        name: p.summary,
        about: {
          "@type": "Thing",
          name: p.prophecy.ref,
        },
        citation: [p.prophecy.ref, ...p.fulfillments.map((f) => f.ref)].join("; "),
      },
    })),
  };

  // FAQ block answers the most-searched questions about Messianic prophecy.
  // Designed as AI-citation bait for AI Overviews + ChatGPT search.
  const schemaFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${URL}#faq`,
    mainEntity: [
      {
        "@type": "Question",
        name: "How many Messianic prophecies did Jesus fulfill?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Jesus of Nazareth fulfilled at least ${COUNT} specific Hebrew Scripture prophecies about the Messiah, written by 12 different prophets across roughly 1,500 years — covering his lineage, birth, ministry, rejection, death, burial, and resurrection.`,
        },
      },
      {
        "@type": "Question",
        name: "Which prophets foretold the coming of the Messiah?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Twelve prophets contributed Messianic prophecies, including Moses (Genesis, Deuteronomy), David (Psalms), Isaiah, Jeremiah, Ezekiel, Daniel, Hosea, Micah, Zechariah, Malachi, and others. Their writings span from about 1500 BCE (Moses) to about 443 BCE (Malachi).",
        },
      },
      {
        "@type": "Question",
        name: "What does the New World Translation say about Messianic prophecy?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The New World Translation publishes the same Hebrew and Christian Greek Scriptures used to identify Messianic prophecy. The standard JW reference treatment is the \"Jesus Christ\" article in Insight on the Scriptures, Volume 2, and the \"Jesus Christ\" section in Reasoning From the Scriptures — both available at wol.jw.org.",
        },
      },
      {
        "@type": "Question",
        name: "Where was the Messiah prophesied to be born?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Micah 5:2 foretold that the Messiah would be born in Bethlehem of Judah. Matthew 2:1-6 records the fulfillment when Jesus was born in Bethlehem during the days of Herod.",
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaArticle) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaItemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />

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
          <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
            Updated <time dateTime="2026-04-28">Apr 28, 2026</time>
          </p>
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
