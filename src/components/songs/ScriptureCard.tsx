import { wolUrlFor } from "../../lib/songs/wolUrl";

type Props = {
  reference: string;
  text: string;
  lang: "en" | "es";
};

const COPY = {
  en: { eyebrow: "Scripture", cta: "Read on wol.jw.org" },
  es: { eyebrow: "Texto bíblico", cta: "Leer en wol.jw.org" },
};

export default function ScriptureCard({ reference, text, lang }: Props) {
  const url = wolUrlFor(reference, lang);
  const t = COPY[lang];

  return (
    <article className="relative">
      <div
        aria-hidden
        className="absolute -left-1 top-0 hidden h-full w-[3px] rounded-full bg-violet-400/70 sm:block dark:bg-violet-400/60"
      />
      <div className="sm:pl-8">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
          {t.eyebrow}
        </div>
        <blockquote className="mt-4 font-serif text-2xl/[1.45] italic text-slate-800 sm:text-[1.65rem]/[1.45] dark:text-slate-100">
          &ldquo;{text}&rdquo;
        </blockquote>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-50">
            — {reference}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 underline decoration-violet-300/70 underline-offset-4 transition hover:text-violet-900 hover:decoration-violet-700 dark:text-violet-300 dark:hover:text-violet-100"
          >
            {t.cta}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 17L17 7M9 7h8v8" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
