"use client";

import Link from "next/link";

const SAMPLE_QUESTIONS = [
  "What does the Bible say about why God allows suffering?",
  "Why don't Jehovah's Witnesses celebrate birthdays?",
  "Walk me through this week's Watchtower study",
  "Find scriptures about paradise on earth",
  "What is the significance of 1914?",
  "Help me prepare for tomorrow's CLAM meeting",
];

const FEATURES = [
  {
    title: "Grounded in JW publications",
    body: "Answers draw from Reasoning From the Scriptures, Insight, and current Watchtower articles — never from outside commentaries.",
  },
  {
    title: "Knows your meeting agenda",
    body: "Reads the weekly CLAM and Watchtower study material so you can prep with the AI walking you through each part.",
  },
  {
    title: "Save notes as you study",
    body: "Tell the assistant to save a note on any verse and it lands in your study notes, tagged by book and chapter.",
  },
  {
    title: "Free for everyone",
    body: "No paywall, no premium tier. Daily quota covers normal use; the AI is here for the JW community.",
  },
];

export default function AiLanding() {
  return (
    <main>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-violet-50/50 dark:border-white/10 dark:bg-violet-950/20">
        <div className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            AI Study Companion
          </div>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-slate-50">
            Bible study with a companion that knows the publications.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
            Ask about any doctrine, prep for this week&apos;s meeting, or look up scripture grounded in the New World Translation.
            Aligned with Watch Tower teaching. Built for Jehovah&apos;s Witnesses.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/?signin=1"
              className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              Sign in to chat
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/study-topics"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-violet-400 hover:text-violet-700 dark:border-white/10 dark:text-slate-200 dark:hover:text-violet-300"
            >
              Browse study topics
            </Link>
          </div>
        </div>
      </section>

      {/* Sample questions */}
      <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
          What you can ask
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
          Real questions, JW answers.
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_QUESTIONS.map((q) => (
            <li
              key={q}
              className="rounded-md border border-slate-200 p-4 text-sm text-slate-700 dark:border-white/10 dark:text-slate-300"
            >
              &ldquo;{q}&rdquo;
            </li>
          ))}
        </ul>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-16 lg:px-8 dark:border-white/10 dark:bg-white/[0.02]">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
          Why this is different
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
          Built for the JW community.
        </h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f.title} className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#160f2e]">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-50">{f.title}</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="rounded-md border border-violet-200/70 bg-violet-50/50 p-8 dark:border-violet-500/20 dark:bg-violet-950/20">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            Ready to start
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            Sign in to start chatting.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-700 dark:text-slate-300">
            Free account, no card required. The AI is grounded in JW publications and the New World Translation —
            for arbitrary research links straight back to wol.jw.org.
          </p>
          <Link
            href="/?signin=1"
            className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Sign in
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
