"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Props = {
  songId: string;
  slug: string;
  lang: "en" | "es";
};

const COPY = {
  en: {
    label: "Download MP3",
    working: "Preparing…",
    failed: "Download unavailable. Try again.",
    needsAuth: "Sign in to download.",
    signIn: "Sign in",
  },
  es: {
    label: "Descargar MP3",
    working: "Preparando…",
    failed: "Descarga no disponible. Inténtalo otra vez.",
    needsAuth: "Inicia sesión para descargar.",
    signIn: "Iniciar sesión",
  },
};

type State =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "needs_auth" }
  | { kind: "error" };

export default function DownloadButton({ songId, slug, lang }: Props) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const t = COPY[lang];

  async function handleClick() {
    setState({ kind: "working" });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setState({ kind: "needs_auth" });
      return;
    }

    let res: Response;
    try {
      res = await fetch(`/api/songs/${slug}/download`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    } catch {
      setState({ kind: "error" });
      return;
    }

    if (res.status === 401) {
      setState({ kind: "needs_auth" });
      return;
    }
    if (!res.ok) {
      setState({ kind: "error" });
      return;
    }

    const data = (await res.json()) as { url: string; filename: string };
    triggerDownload(data.url, data.filename);

    // Reset to idle after a moment so the user can re-download if they want
    setTimeout(() => setState({ kind: "idle" }), 800);
  }

  if (state.kind === "needs_auth") {
    const songPath = lang === "es" ? `/es/songs/${slug}` : `/songs/${slug}`;
    const signInHref = `/?next=${encodeURIComponent(songPath)}`;
    return (
      <div className="inline-flex items-center gap-3 rounded-md border border-violet-200 bg-violet-50 px-4 py-2 text-sm dark:border-white/10 dark:bg-violet-950/30">
        <span className="font-semibold text-slate-700 dark:text-slate-200">{t.needsAuth}</span>
        <a
          href={signInHref}
          className="inline-flex items-center gap-1 font-bold text-violet-700 underline decoration-violet-300 underline-offset-4 transition hover:text-violet-900 dark:text-violet-300 dark:hover:text-violet-100"
        >
          {t.signIn}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <button
        type="button"
        onClick={() => setState({ kind: "idle" })}
        className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
      >
        {t.failed}
      </button>
    );
  }

  const busy = state.kind === "working";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-busy={busy}
      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-wait disabled:opacity-70 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:border-violet-400/40 dark:hover:bg-white/10 dark:hover:text-violet-300"
    >
      <DownloadIcon />
      {busy ? t.working : t.label}
    </button>
  );
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
