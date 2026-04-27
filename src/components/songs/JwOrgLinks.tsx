"use client";

import type { JwOrgLink } from "../../api/songs";
import { trackSongEvent } from "../../lib/songs/trackEvent";

type Props = {
  links: JwOrgLink[];
  lang: "en" | "es";
  songId: string;
};

const COPY = {
  en: {
    eyebrow: "Read on jw.org",
    title: "Go deeper at jw.org",
    subtitle:
      "These articles from Jehovah's organization explain the teachings behind this song.",
  },
  es: {
    eyebrow: "Lee en jw.org",
    title: "Profundiza en jw.org",
    subtitle:
      "Estos artículos de la organización de Jehová explican las enseñanzas detrás de esta canción.",
  },
};

export default function JwOrgLinks({ links, lang, songId }: Props) {
  if (!links?.length) return null;
  const t = COPY[lang];

  return (
    <section>
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
        {t.eyebrow}
      </div>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
        {t.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">{t.subtitle}</p>

      <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
        {links.map((link, i) => (
          <li key={i}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackSongEvent({
                  song_id: songId,
                  event_type: "jw_org_click",
                  jw_org_url: link.url,
                })
              }
              className="group flex items-center justify-between gap-4 py-4 transition hover:text-violet-700 dark:hover:text-violet-300"
            >
              <span className="text-base font-medium text-slate-900 group-hover:text-violet-700 dark:text-slate-100 dark:group-hover:text-violet-300">
                {link.anchor}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-violet-700 dark:group-hover:text-violet-300"
              >
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
