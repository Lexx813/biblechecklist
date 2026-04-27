"use client";

import { useState } from "react";
import { trackSongEvent } from "../../lib/songs/trackEvent";

type Props = {
  songId: string;
  title: string;
  scriptureRef: string;
  url: string;
  lang: "en" | "es";
};

export type ShareKind =
  | "tiktok"
  | "instagram"
  | "whatsapp"
  | "telegram"
  | "x"
  | "copy";

const COPY = {
  en: {
    title: "Share",
    copied: "Copied",
    captionCopied: "Caption copied. Paste in",
  },
  es: {
    title: "Compartir",
    copied: "Copiado",
    captionCopied: "Texto copiado. Pégalo en",
  },
};

const PLATFORM_LABEL: Record<ShareKind, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  x: "X",
  copy: "Copy link",
};

function caption(kind: ShareKind, title: string, scriptureRef: string, url: string, lang: "en" | "es"): string {
  if (lang === "es") {
    if (kind === "whatsapp" || kind === "telegram") {
      return `Escucha "${title}" (basada en ${scriptureRef}). Gratis en ${url}. Aprende más en jw.org.`;
    }
    return `🎵 ${title} (${scriptureRef}). Gratis en ${url}. Aprende más en jw.org. #TestigosDeJehová #Jehová #JWFamilia`;
  }
  if (kind === "whatsapp" || kind === "telegram") {
    return `Listen to "${title}" (based on ${scriptureRef}). Free at ${url}. Learn more at jw.org.`;
  }
  return `🎵 ${title} (${scriptureRef}). Free at ${url}. Learn more at jw.org. #JW #JWFamily #Jehovah`;
}

function shareUrl(kind: ShareKind, title: string, scriptureRef: string, url: string, lang: "en" | "es"): string | null {
  const text = caption(kind, title, scriptureRef, url, lang);
  switch (kind) {
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(text)}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    case "x":
      return `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    default:
      return null;
  }
}

export default function ShareSheet({ songId, title, scriptureRef, url, lang }: Props) {
  const t = COPY[lang];
  const [toast, setToast] = useState<string | null>(null);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }

  async function handle(kind: ShareKind) {
    trackSongEvent({ song_id: songId, event_type: "share", share_platform: kind });
    if (kind === "copy") {
      await copyText(url);
      setToast(t.copied);
      setTimeout(() => setToast(null), 1800);
      return;
    }
    if (kind === "tiktok" || kind === "instagram") {
      await copyText(caption(kind, title, scriptureRef, url, lang));
      setToast(`${t.captionCopied} ${PLATFORM_LABEL[kind]}`);
      setTimeout(() => setToast(null), 2400);
      return;
    }
    const u = shareUrl(kind, title, scriptureRef, url, lang);
    if (u) window.open(u, "_blank", "noopener,noreferrer");
  }

  const order: ShareKind[] = ["copy", "whatsapp", "telegram", "x", "tiktok", "instagram"];

  return (
    <section className="border-t border-slate-200 pt-6 dark:border-white/10">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
          {t.title}
        </span>
        <ul className="flex flex-wrap items-center gap-2">
          {order.map((kind) => (
            <li key={kind}>
              <button
                type="button"
                onClick={() => handle(kind)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-violet-400/40 dark:hover:bg-white/10 dark:hover:text-violet-300"
              >
                <Icon kind={kind} />
                {PLATFORM_LABEL[kind]}
              </button>
            </li>
          ))}
        </ul>
        {toast && (
          <span role="status" aria-live="polite" className="text-xs font-semibold text-violet-700 dark:text-violet-300">
            {toast}
          </span>
        )}
      </div>
    </section>
  );
}

function Icon({ kind }: { kind: ShareKind }) {
  const common = { width: 13, height: 13, viewBox: "0 0 24 24", "aria-hidden": true } as const;
  switch (kind) {
    case "tiktok":
      return (<svg {...common} fill="currentColor"><path d="M16.6 5.82a4.45 4.45 0 0 1-3.7-2.4V14a4.6 4.6 0 1 1-3.94-4.55v3.36a1.6 1.6 0 1 0 1.04 1.5V0h2.94a4.5 4.5 0 0 0 3.66 4.45v1.37Z"/></svg>);
    case "instagram":
      return (<svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>);
    case "whatsapp":
      return (<svg {...common} fill="currentColor"><path d="M20.5 3.5A11 11 0 0 0 3.6 17l-1.6 5 5.1-1.6A11 11 0 1 0 20.5 3.5Zm-3.4 14a3 3 0 0 1-2 1.3c-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-5-4.3-5.1-4.5-.2-.2-1.2-1.5-1.2-2.9a3 3 0 0 1 1-2.3c.3-.3.6-.4.8-.4h.6c.2 0 .5-.1.7.5l.9 2.2c.1.2.1.4 0 .5-.5 1.1-1.1 1.1-.8 1.6a7 7 0 0 0 3.5 3c.3.2.5.2.7 0 .2-.2.8-.9 1-1.1.2-.4.4-.3.7-.2.3.1 1.7.7 2 .9.3.1.5.2.6.3 0 .1 0 .7-.2 1.3Z"/></svg>);
    case "telegram":
      return (<svg {...common} fill="currentColor"><path d="M21.5 3.4 18.5 19a1.4 1.4 0 0 1-2.2.7l-4.4-3.3-2.1 2a.7.7 0 0 1-1.2-.5l.1-3.6 8-7.2c.4-.3-.1-.5-.5-.2L6.4 12.3l-3.5-1.1c-.8-.2-.8-.7.2-1.1L20.4 2.5c.6-.2 1.2.2 1.1.9Z"/></svg>);
    case "x":
      return (<svg {...common} fill="currentColor"><path d="M18.2 2H21l-6.6 7.5L22 22h-6.5l-5-6.5L4.9 22H2.1l7.1-8.1L2 2h6.6l4.5 5.9L18.2 2Zm-1.1 18.2h1.7L7 3.7H5.2l11.9 16.5Z"/></svg>);
    case "copy":
      return (<svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>);
  }
}
