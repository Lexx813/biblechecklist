import PublicNav from "../_components/PublicNav";
import PublicFooter from "../_components/PublicFooter";
import { FAQBlock } from "@/seo";
import { safeJsonLd } from "../../src/lib/safeJsonLd";

const FAQ_ITEMS = [
  {
    question: "Is JW Study affiliated with Jehovah's Witnesses or jw.org?",
    answer:
      "No. JW Study is an independent community project built by one Bible student. It is not endorsed by, sponsored by, or connected to the Watch Tower Bible and Tract Society. All scriptural references link to the official jw.org and JW Library.",
  },
  {
    question: "Is JW Study really free?",
    answer:
      "Yes. There are no paid tiers, no trials, no locked features, and no ads. Hosting and ongoing development are covered out of pocket. Optional donations are welcome but never required.",
  },
  {
    question: "Do I need an account to use JW Study?",
    answer:
      "No account is needed to read the blog, browse study topics, or use the basic Bible reading tracker. A free account is needed to sync progress across devices and unlock streaks, notes, and reading plans.",
  },
  {
    question: "Which Bible translation does JW Study use?",
    answer:
      "The New World Translation of the Holy Scriptures, the same translation used at meetings and in the field ministry by Jehovah's Witnesses worldwide.",
  },
  {
    question: "What languages does JW Study support?",
    answer:
      "English, Spanish, Portuguese, French, Tagalog, and Mandarin Chinese. Additional languages (Japanese, Korean) are planned.",
  },
  {
    question: "Is my reading data private?",
    answer:
      "Yes. Reading progress, notes, and study data are private to your account. We never share or sell user data. You can delete your account and all associated data at any time.",
  },
];

export const metadata = {
  title: "About JW Study | Bible Reading Tracker for Jehovah's Witnesses",
  description:
    "JW Study is an independent Bible reading tracker built for Jehovah's Witnesses and Bible students. Track all 66 books of the New World Translation. Built by a Bible student for the community.",
  alternates: {
    canonical: "https://jwstudy.org/about",
    languages: { en: "https://jwstudy.org/about", "x-default": "https://jwstudy.org/about" },
  },
  openGraph: {
    title: "About JW Study | Bible Reading Tracker",
    description:
      "JW Study is an independent Bible reading tracker built for Jehovah's Witnesses and Bible students. Track all 66 books of the New World Translation.",
    images: [{ url: "https://jwstudy.org/og-image.jpg", width: 1200, height: 630, alt: "JW Study, a Bible Reading Tracker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About JW Study | Bible Reading Tracker",
    description:
      "JW Study is an independent Bible reading tracker built for Jehovah's Witnesses and Bible students. Track all 66 books of the New World Translation.",
    images: [{ url: "https://jwstudy.org/og-image.jpg", width: 1200, height: 630, alt: "JW Study, a Bible Reading Tracker" }],
  },
};

const schemaBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://jwstudy.org" },
    { "@type": "ListItem", position: 2, name: "About", item: "https://jwstudy.org/about" },
  ],
};

const schemaPerson = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://jwstudy.org/#creator",
  name: "Alexi",
  description:
    "Bible student and Jehovah's Witness who built JW Study, a free Bible reading tracker and study community for Jehovah's Witnesses.",
  url: "https://jwstudy.org/about",
  email: "support@jwstudy.org",
  knowsAbout: ["Bible reading", "New World Translation", "Jehovah's Witnesses"],
  worksFor: {
    "@type": "Organization",
    "@id": "https://jwstudy.org/#organization",
  },
  sameAs: [
    "https://www.tiktok.com/@laqjw",
    "https://www.facebook.com/lexx.seise",
    "https://www.instagram.com/lexx813/",
  ],
};

const PILLARS = [
  {
    label: "Built by",
    value: "One Witness",
    sub: "Solo developer, full transparency.",
  },
  {
    label: "Cost",
    value: "100% free",
    sub: "No tiers, no trials, no ads.",
  },
  {
    label: "Coverage",
    value: "All 66 books",
    sub: "New World Translation.",
  },
];

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schemaBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schemaPerson) }} />
      <PublicNav />

      <main className="text-[var(--lp-text)]">
        {/* Breadcrumb */}
        <nav className="mx-auto max-w-3xl px-4 pt-8 text-sm sm:px-6">
          <a href="/" className="text-[var(--violet-600,#7c3aed)] hover:underline">← Home</a>
        </nav>

        {/* Hero */}
        <section className="mx-auto max-w-3xl px-4 pt-6 pb-10 sm:px-6 sm:pt-10 sm:pb-14">
          <p className="mb-4 inline-block rounded-full bg-[var(--violet-50,#f5f3ff)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--violet-700,#6d28d9)]">
            About
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            A home for Bible readers.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[var(--lp-muted)]">
            Built by one Witness for the community. Independent, free, and here for the long haul.
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--lp-muted)]">
            Last updated <time dateTime="2026-04-28">April 28, 2026</time>
          </p>
        </section>

        {/* Pillars row */}
        <section
          aria-label="At a glance"
          className="mx-auto grid max-w-3xl grid-cols-1 gap-3 px-4 pb-14 sm:grid-cols-3 sm:px-6 sm:pb-20"
        >
          {PILLARS.map((p) => (
            <div
              key={p.label}
              className="rounded-md border border-[color:var(--border,rgba(124,58,237,0.18))] bg-white/60 p-5 backdrop-blur-[2px] dark:bg-white/[0.03]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--lp-muted)]">
                {p.label}
              </p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--lp-text)]">
                {p.value}
              </p>
              <p className="mt-1 text-sm text-[var(--lp-muted)]">{p.sub}</p>
            </div>
          ))}
        </section>

        {/* Long-form */}
        <article className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 sm:pb-20">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Why this app exists</h2>
            <p className="leading-relaxed text-[var(--lp-text)]">
              JW Study was built with one simple goal: give Bible students a persistent,
              cross-device tracker for their Bible reading. Whether you&apos;re on your phone at the
              Kingdom Hall, on your laptop at home, or on a tablet during family worship, your
              progress is always with you.
            </p>
            <p className="leading-relaxed text-[var(--lp-text)]">
              Beyond tracking, we wanted a space where people studying with
              Jehovah&apos;s Witnesses, and active Witnesses themselves, can encourage one another,
              share thoughts, and grow together as a community of Bible students.
            </p>
          </section>

          <section className="mt-12 space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Works alongside JW Library</h2>
            <p className="leading-relaxed text-[var(--lp-text)]">
              JW Study is designed as a companion to the JW Library app, not a replacement.
              Do your reading in JW Library, then come here to log your chapters, take notes,
              and share your journey with the community.
            </p>
          </section>

          {/* Creator card */}
          <section className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">About the creator</h2>
            <div className="mt-4 flex items-start gap-4 rounded-md border border-[color:var(--border,rgba(124,58,237,0.18))] bg-white/60 p-5 dark:bg-white/[0.03]">
              <div
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
                style={{ background: "var(--violet-600,#7c3aed)" }}
              >
                A
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--lp-text)]">Alexi</p>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--lp-muted)]">Bible student, JW</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--lp-text)]">
                  Built JW Study out of a personal need: a simple, reliable way to track Bible reading
                  across any device, without losing progress. What started as a personal tool grew into
                  a full community platform for others walking the same spiritual journey.
                </p>
              </div>
            </div>
          </section>

          {/* Free-for-everyone + gentle donation */}
          <section className="mt-12 space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Free for everyone</h2>
            <p className="leading-relaxed text-[var(--lp-text)]">
              JW Study is completely free. No paid tiers, no locked features, no ads. Hosting,
              database, and ongoing development are covered out of pocket by one Witness who
              wanted to build something useful for the community.
            </p>
            <p className="text-sm leading-relaxed text-[var(--lp-muted)]">
              JW Study is an independent community project. It is not affiliated with or
              endorsed by Jehovah&apos;s Witnesses or the Watch Tower Society of Pennsylvania.
            </p>

            {/* Gentle donation card */}
            <div className="mt-6 rounded-md border border-[color:var(--violet-200,#ddd6fe)] bg-[var(--violet-50,#f5f3ff)] p-5 dark:border-[rgba(167,139,250,0.25)] dark:bg-white/[0.03]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--violet-700,#6d28d9)]">
                Optional support
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--lp-text)]">
                If JW Study has been useful in your study, you can help cover hosting and
                development costs. Every contribution is appreciated, never required, and never
                unlocks anything (everything is and always will be free).
              </p>
            </div>
          </section>

          {/* Contact + primary CTA */}
          <section className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <address className="not-italic text-sm text-[var(--lp-muted)]">
              Contact:{" "}
              <a
                href="mailto:support@jwstudy.org"
                className="text-[var(--violet-600,#7c3aed)] hover:underline"
              >
                support@jwstudy.org
              </a>
            </address>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors min-h-[44px]"
              style={{ background: "var(--violet-600,#7c3aed)" }}
            >
              Open JW Study →
            </a>
          </section>
        </article>

        {/* FAQ */}
        <section className="mx-auto max-w-2xl px-4 pb-20 sm:px-6">
          <FAQBlock
            items={FAQ_ITEMS}
            className="[&_dd]:mt-1 [&_dd]:text-[var(--lp-muted)] [&_dt]:mt-5 [&_dt]:font-semibold [&_h2]:mb-6 [&_h2]:text-2xl [&_h2]:font-semibold"
          />
        </section>
      </main>

      <PublicFooter />
    </>
  );
}
