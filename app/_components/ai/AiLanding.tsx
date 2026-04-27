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
              The Bible records only two birthday celebrations, both held by enemies of Jehovah, both ending with
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
            <strong className="text-slate-900 dark:text-slate-100">Studies the Bible with you and surfaces cross-references.</strong>{" "}
            Working through a passage? The companion offers related verses across the New World Translation,
            quotes from <em>Insight on the Scriptures</em> for word studies, and traces a thought through the
            books where Jehovah develops it.
          </p>
          <p>
            <strong className="text-slate-900 dark:text-slate-100">Helps you prepare for the meetings.</strong>{" "}
            Watchtower study, the midweek Christian Life and Ministry meeting, the weekly Bible reading.
            The companion reads this week&apos;s agenda from wol.jw.org and walks you through each part with
            reflection questions and supporting scriptures.
          </p>
          <p>
            <strong className="text-slate-900 dark:text-slate-100">Helps you prep for the ministry and return visits.</strong>{" "}
            Tell it the topic the householder cares about (suffering, the dead, the Kingdom, who Jesus is)
            and the companion suggests a scripture, a way to start the conversation, and the right tract or
            article on jw.org to leave behind.
          </p>
          <p>
            <strong className="text-slate-900 dark:text-slate-100">Walks you through rebuttals and apologetics</strong>{" "}
            for the questions you couldn&apos;t answer at the door — Trinity, John 1:1, the 144,000, 1914,
            hellfire, the accuracy of the NWT, blood, holidays. The companion frames the answer in your voice:
            a one-line summary plus the one or two scriptures that ground it, drawn from{" "}
            <em>Reasoning From the Scriptures</em>.
          </p>
          <p>
            <strong className="text-slate-900 dark:text-slate-100">Pulls references from the publications fast.</strong>{" "}
            &ldquo;Where does the Watchtower talk about humility?&rdquo; or &ldquo;What does Insight say about
            <em>chesed</em>?&rdquo; The companion finds the article, links you to wol.jw.org, and points you
            to the right place to dig in.
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
