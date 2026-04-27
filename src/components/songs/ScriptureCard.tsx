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
    <article className="rounded-md border border-violet-200 bg-violet-50 p-6 sm:p-8 dark:border-white/10 dark:bg-violet-950/30">
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
        {t.eyebrow}
      </div>
      <blockquote className="mt-4 text-2xl font-medium leading-snug text-slate-900 sm:text-[1.7rem] dark:text-slate-50">
        &ldquo;{text}&rdquo;
      </blockquote>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm font-bold text-violet-800 dark:text-violet-200">
          {reference}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 underline decoration-violet-300 underline-offset-4 transition hover:text-violet-900 hover:decoration-violet-700 dark:text-violet-300 dark:hover:text-violet-100"
        >
          {t.cta}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </a>
      </div>
    </article>
  );
}
