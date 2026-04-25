import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white dark:border-white/10 dark:bg-[#160f2e]">
      <div className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
              <span aria-hidden className="inline-flex size-6 items-center justify-center rounded-md bg-violet-600 text-[10px] font-black text-white">JW</span>
              JW Study
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Free Bible reading tracker and study companion for Jehovah&apos;s Witnesses.
            </p>
          </div>

          <FooterCol title="Read">
            <FooterLink href="/blog">Blog</FooterLink>
            <FooterLink href="/study-topics">Study topics</FooterLink>
            <FooterLink href="/books">All 66 books</FooterLink>
            <FooterLink href="/plans">Reading plans</FooterLink>
          </FooterCol>

          <FooterCol title="Community">
            <FooterLink href="/forum">Forum</FooterLink>
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/" prefetch>
              Open the app
            </FooterLink>
          </FooterCol>

          <FooterCol title="Legal">
            <FooterLink href="/privacy" prefetch={false}>Privacy</FooterLink>
            <FooterLink href="/terms" prefetch={false}>Terms</FooterLink>
            <a
              href="mailto:support@jwstudy.org"
              className="text-sm text-slate-600 transition hover:text-violet-700 dark:text-slate-400 dark:hover:text-violet-300"
            >
              support@jwstudy.org
            </a>
          </FooterCol>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-white/10 dark:text-slate-500">
          Independent community project. Not affiliated with or endorsed by Jehovah&apos;s Witnesses or the Watch Tower Society of Pennsylvania. © {new Date().getFullYear()}.
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</div>
      <ul className="mt-3 space-y-2">
        {Array.isArray(children) ? children.map((c, i) => <li key={i}>{c}</li>) : <li>{children}</li>}
      </ul>
    </div>
  );
}

function FooterLink({ href, children, prefetch }: { href: string; children: React.ReactNode; prefetch?: boolean }) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className="text-sm text-slate-600 transition hover:text-violet-700 dark:text-slate-400 dark:hover:text-violet-300"
    >
      {children}
    </Link>
  );
}
