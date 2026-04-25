import Link from "next/link";

export default function PublicNav() {
  return (
    <nav className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#160f2e]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-violet-600 dark:text-violet-300">
          <span aria-hidden className="inline-block size-7 rounded-md bg-gradient-to-br from-violet-700 to-violet-400" />
          JW Study
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <Link href="/blog" className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">Blog</Link>
          <Link href="/study-topics" className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">Topics</Link>
          <Link href="/books" className="hidden sm:inline-block rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">Books</Link>
          <Link href="/plans" className="hidden sm:inline-block rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">Plans</Link>
          <Link href="/forum" className="hidden sm:inline-block rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5">Forum</Link>
          <Link href="/" className="ml-1 rounded-md bg-violet-600 px-3 py-1.5 font-semibold text-white hover:bg-violet-700">Open app</Link>
        </div>
      </div>
    </nav>
  );
}
