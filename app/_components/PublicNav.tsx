import Link from "next/link";

export default function PublicNav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-white/10 dark:bg-[#160f2e]/90">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-base font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          <span
            aria-hidden
            className="inline-flex size-7 items-center justify-center rounded-md bg-violet-600 text-[11px] font-black text-white shadow-sm"
          >
            JW
          </span>
          JW Study
        </Link>

        <div className="flex items-center gap-0.5 text-sm font-medium">
          <Link href="/blog" className="hidden sm:inline-flex rounded-md px-3 py-1.5 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-violet-300">Blog</Link>
          <Link href="/study-topics" className="hidden sm:inline-flex rounded-md px-3 py-1.5 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-violet-300">Topics</Link>
          <Link href="/books" className="hidden md:inline-flex rounded-md px-3 py-1.5 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-violet-300">Books</Link>
          <Link href="/plans" className="hidden md:inline-flex rounded-md px-3 py-1.5 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-violet-300">Plans</Link>
          <Link href="/forum" className="hidden md:inline-flex rounded-md px-3 py-1.5 text-slate-700 transition hover:bg-violet-50 hover:text-violet-700 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-violet-300">Forum</Link>
          <Link
            href="/ai"
            className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-violet-700 transition hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-white/5"
          >
            AI
            <span aria-hidden className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">New</span>
          </Link>
          <Link
            href="/"
            className="ml-2 inline-flex items-center gap-1 rounded-md bg-violet-600 px-3.5 py-1.5 font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Open app
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}
