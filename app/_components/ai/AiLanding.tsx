"use client";

import Link from "next/link";

/**
 * Marketing landing for /ai shown to anonymous visitors.
 *
 * Design principle (PRODUCT.md anti-refs): no SaaS card grids, no
 * hero-stat blocks, no gradient text, no feature-icon trios. Long-form
 * reading layout. Typography carries the page.
 */
export default function AiLanding() {
  return (
    <main className="px-4 sm:px-6 lg:px-8">
      {/* ── Section 1: Identity ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-2xl pt-16 sm:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
          Study Companion
        </p>
        <h1 className="mt-5 text-3xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-slate-50">
          A study companion that reads what you read.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
          Built for Jehovah&apos;s Witnesses. Aligned with Watch Tower teaching. Grounded in the New World Translation
          and the publications at wol.jw.org. Free to use.
        </p>
      </section>

      {/* ── Section 2: A real conversation ────────────────────────────────── */}
      <section className="mx-auto max-w-2xl pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          What it sounds like
        </p>
        <div className="mt-6 space-y-5 border-l border-violet-200 pl-6 dark:border-violet-500/30">
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">You</p>
            <p className="mt-1 text-base text-slate-900 dark:text-slate-100">
              Why don&apos;t we celebrate birthdays?
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">Companion</p>
            <p className="mt-1 text-base leading-relaxed text-slate-800 dark:text-slate-200">
              The Bible records only two birthday celebrations — both held by enemies of Jehovah, both ending with
              someone being murdered (<span className="text-violet-700 dark:text-violet-300">Genesis 40:20-22</span>;{" "}
              <span className="text-violet-700 dark:text-violet-300">Matthew 14:6-10</span>). They originated in pagan
              worship and were not practiced by the early Christians. We prefer to honor loved ones throughout the
              year rather than on a date tied to false-religious history.
            </p>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Source:{" "}
              <a
                href="https://www.jw.org/en/jehovahs-witnesses/faq/jehovahs-witnesses-not-celebrate-holidays/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-slate-300 underline-offset-2 hover:text-slate-700 hover:decoration-violet-400 dark:decoration-white/20 dark:hover:text-slate-300"
              >
                Why don&apos;t Jehovah&apos;s Witnesses celebrate certain holidays?
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 3: What it can do (prose, not bullets) ────────────────── */}
      <section className="mx-auto max-w-2xl pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          What it does
        </p>
        <div className="mt-6 space-y-6 text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            Ask doctrinal questions and get answers grounded in the publications — never improvised, always
            linked back to wol.jw.org so you can read the source yourself.
          </p>
          <p>
            Walk through this week&apos;s Christian Life and Ministry meeting or Watchtower study. The companion
            reads the agenda from wol.jw.org and helps you think through each part.
          </p>
          <p>
            Save study notes by just asking — &ldquo;save a note on John 3:16&rdquo; lands in your study notes,
            tagged by book and chapter, ready for the next time you study that passage.
          </p>
          <p>
            Find scripture by topic or theme. Ask &ldquo;what does the Bible say about endurance under trial&rdquo;
            and the companion surfaces the most relevant verses from the NWT.
          </p>
        </div>
      </section>

      {/* ── Section 4: Boundaries (the JW-aligned framing) ────────────────── */}
      <section className="mx-auto max-w-2xl pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          What it isn&apos;t
        </p>
        <p className="mt-6 text-base leading-relaxed text-slate-700 dark:text-slate-300">
          The companion is a study aid, not a teacher of the faith. It surfaces what the publications already teach;
          it does not innovate doctrine. The Governing Body and the publications at wol.jw.org remain the channel for
          spiritual instruction. Every answer links to the original source so you can read for yourself.
        </p>
      </section>

      {/* ── Section 5: One quiet CTA ──────────────────────────────────────── */}
      <section className="mx-auto max-w-2xl pt-20 pb-24">
        <div className="border-t border-slate-200 pt-10 dark:border-white/10">
          <p className="text-base text-slate-700 dark:text-slate-300">
            Free account, no card required. Daily quota covers ordinary use; the companion is here for the JW community.
          </p>
          <Link
            href="/?signin=1"
            className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Sign in to begin
          </Link>
        </div>
      </section>
    </main>
  );
}
