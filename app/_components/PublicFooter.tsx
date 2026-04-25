import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white dark:border-white/10 dark:bg-[#160f2e]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">JW Study</span>
          <span className="mx-2">·</span>
          <span>Free Bible reading tracker</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/blog" className="hover:underline">Blog</Link>
          <Link href="/study-topics" className="hover:underline">Topics</Link>
          <Link href="/forum" className="hover:underline">Forum</Link>
          <a href="/privacy" className="hover:underline">Privacy</a>
          <a href="/terms" className="hover:underline">Terms</a>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-500 sm:px-6">
        Independent community project. Not affiliated with or endorsed by Jehovah&apos;s Witnesses or the Watch Tower Society of Pennsylvania.
      </div>
    </footer>
  );
}
