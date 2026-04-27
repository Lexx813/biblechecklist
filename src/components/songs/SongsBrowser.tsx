"use client";

import { useMemo, useState } from "react";
import SongGrid from "./SongGrid";
import type { Song } from "../../api/songs";
import { localizedTitle } from "../../api/songs";

type Props = {
  songs: Song[];
  lang: "en" | "es";
};

const COPY = {
  en: {
    searchPlaceholder: "Search by title, theme, or scripture",
    all: "All",
    songsCount: (n: number) => `${n} ${n === 1 ? "song" : "songs"}`,
    noMatch: "No songs match those filters.",
    clear: "Clear",
    prev: "Previous",
    next: "Next",
    page: (cur: number, total: number) => `Page ${cur} of ${total}`,
  },
  es: {
    searchPlaceholder: "Buscar por título, tema o escritura",
    all: "Todas",
    songsCount: (n: number) => `${n} ${n === 1 ? "canción" : "canciones"}`,
    noMatch: "No hay canciones que coincidan con esos filtros.",
    clear: "Limpiar",
    prev: "Anterior",
    next: "Siguiente",
    page: (cur: number, total: number) => `Página ${cur} de ${total}`,
  },
};

const PAGE_SIZE = 12;

// Map of theme slug to readable label per language. Falls back to the slug
// (with hyphens replaced by spaces) for any theme not enumerated here.
const THEME_LABELS: Record<"en" | "es", Record<string, string>> = {
  en: {
    "field-ministry": "Field Ministry",
    "identity": "Identity",
    "comfort": "Comfort",
    "pure-worship": "Pure Worship",
    "hope": "Hope",
  },
  es: {
    "field-ministry": "Ministerio",
    "identity": "Identidad",
    "comfort": "Consuelo",
    "pure-worship": "Adoración pura",
    "hope": "Esperanza",
  },
};

function themeLabel(slug: string, lang: "en" | "es") {
  return THEME_LABELS[lang][slug] ?? slug.replace(/-/g, " ");
}

export default function SongsBrowser({ songs, lang }: Props) {
  const t = COPY[lang];
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Build the unique theme list from the actual data, ordered by frequency
  const themes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of songs) counts.set(s.theme, (counts.get(s.theme) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [songs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs.filter((song) => {
      if (theme && song.theme !== theme) return false;
      if (!q) return true;
      const haystack = [
        localizedTitle(song, lang),
        song.theme,
        song.primary_scripture_ref,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [songs, query, theme, lang]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSongs = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function selectTheme(next: string | null) {
    setTheme(next);
    setPage(1);
  }
  function onQueryChange(v: string) {
    setQuery(v);
    setPage(1);
  }
  function clearFilters() {
    setQuery("");
    setTheme(null);
    setPage(1);
  }

  const hasActiveFilters = theme !== null || query.trim().length > 0;

  return (
    <div>
      {/* Search + count row */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
        <label className="relative flex-1 min-w-[260px]">
          <span className="sr-only">{t.searchPlaceholder}</span>
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-md border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </label>
        <div className="text-sm font-medium text-slate-500 tabular-nums dark:text-slate-400">
          {t.songsCount(filtered.length)}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-semibold text-violet-700 underline decoration-violet-300 underline-offset-4 transition hover:text-violet-900 hover:decoration-violet-700 dark:text-violet-300 dark:hover:text-violet-100"
          >
            {t.clear}
          </button>
        )}
      </div>

      {/* Theme chips — only render when there are at least 2 themes in the data */}
      {themes.length >= 2 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <ThemeChip active={theme === null} onClick={() => selectTheme(null)}>
            {t.all}
          </ThemeChip>
          {themes.map((slug) => (
            <ThemeChip key={slug} active={theme === slug} onClick={() => selectTheme(slug)}>
              {themeLabel(slug, lang)}
            </ThemeChip>
          ))}
        </div>
      )}

      {/* Grid */}
      {pageSongs.length > 0 ? (
        <SongGrid songs={pageSongs} lang={lang} />
      ) : (
        <p className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
          {t.noMatch}
        </p>
      )}

      {/* Pagination — appears only when filtered results exceed one page */}
      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-12 flex items-center justify-center gap-2"
        >
          <PageBtn disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            {t.prev}
          </PageBtn>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-current={n === safePage ? "page" : undefined}
              onClick={() => setPage(n)}
              className={
                "size-9 rounded-md text-sm font-semibold tabular-nums transition " +
                (n === safePage
                  ? "bg-violet-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-violet-400/40 dark:hover:bg-white/10 dark:hover:text-violet-300")
              }
            >
              {n}
            </button>
          ))}
          <PageBtn disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            {t.next}
          </PageBtn>
        </nav>
      )}
    </div>
  );
}

function ThemeChip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition " +
        (active
          ? "bg-violet-600 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-violet-400/40 dark:hover:bg-white/10 dark:hover:text-violet-300")
      }
    >
      {children}
    </button>
  );
}

function PageBtn({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-violet-400/40 dark:hover:bg-white/10 dark:hover:text-violet-300"
    >
      {children}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
