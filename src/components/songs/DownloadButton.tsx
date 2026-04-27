"use client";

import { trackSongEvent } from "../../lib/songs/trackEvent";

type Props = {
  songId: string;
  downloadUrl: string | null;
  filename: string;
  lang: "en" | "es";
};

const COPY = {
  en: { label: "Download MP3", unavailable: "Download unavailable" },
  es: { label: "Descargar MP3", unavailable: "Descarga no disponible" },
};

export default function DownloadButton({ songId, downloadUrl, filename, lang }: Props) {
  const t = COPY[lang];

  if (!downloadUrl) {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-400 dark:border-white/10 dark:bg-white/5">
        <DownloadIcon />
        {t.unavailable}
      </span>
    );
  }

  return (
    <a
      href={downloadUrl}
      download={filename}
      onClick={() => trackSongEvent({ song_id: songId, event_type: "download" })}
      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-violet-400/40 dark:hover:bg-white/10 dark:hover:text-violet-300"
    >
      <DownloadIcon />
      {t.label}
    </a>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
