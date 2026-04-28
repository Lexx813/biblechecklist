import Link from "next/link";
import Image from "next/image";
import { localizedTitle, type Song } from "../../api/songs";

type Props = {
  song: Song;
  lang: "en" | "es";
  featured?: boolean;
};

const COPY = {
  en: { listen: "Listen", featured: "Featured" },
  es: { listen: "Escuchar", featured: "Destacada" },
};

export default function SongCard({ song, lang, featured = false }: Props) {
  const href = lang === "es" ? `/es/songs/${song.slug}` : `/songs/${song.slug}`;
  const title = localizedTitle(song, lang);
  const cover = song.cover_image_url ?? "/og-image.jpg";
  const t = COPY[lang];

  if (featured) {
    return (
      <Link
        href={href}
        className="group relative grid gap-6 rounded-xl border border-violet-200/60 bg-linear-to-br from-violet-50/60 to-white px-5 py-5 transition hover:border-violet-300 hover:shadow-[0_8px_32px_-12px_rgba(124,58,237,0.18)] sm:grid-cols-[180px_1fr] sm:items-center sm:gap-7 sm:px-7 sm:py-6 dark:border-violet-400/15 dark:from-violet-950/30 dark:to-transparent dark:hover:border-violet-400/40"
      >
        <div className="overflow-hidden rounded-lg shadow-sm sm:size-44">
          <Image
            src={cover}
            alt={title}
            width={400}
            height={400}
            priority
            sizes="(min-width: 640px) 180px, 100vw"
            className="size-full object-cover"
            style={{ aspectRatio: "1 / 1" }}
          />
        </div>
        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
            {t.featured}
          </div>
          <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 transition group-hover:text-violet-700 sm:text-3xl dark:text-slate-50 dark:group-hover:text-violet-300">
            {title}
          </h3>
          <div className="font-serif text-base italic text-violet-800/90 dark:text-violet-200/90">
            {song.primary_scripture_ref}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 dark:text-violet-300">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
              {t.listen}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {song.theme.replace(/-/g, " ")}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex gap-4 rounded-lg border border-slate-200/70 bg-white p-3 transition hover:border-violet-300 hover:bg-violet-50/30 dark:border-white/8 dark:bg-white/2 dark:hover:border-violet-400/30 dark:hover:bg-violet-950/20"
    >
      <div className="relative shrink-0 overflow-hidden rounded-md size-20 sm:size-24">
        <Image
          src={cover}
          alt={title}
          width={200}
          height={200}
          loading="lazy"
          sizes="96px"
          className="size-full object-cover transition group-hover:scale-[1.04]"
          style={{ aspectRatio: "1 / 1" }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <h3 className="truncate text-base font-bold leading-tight tracking-tight text-slate-900 transition group-hover:text-violet-700 dark:text-slate-50 dark:group-hover:text-violet-300">
          {title}
        </h3>
        <div className="font-serif text-sm italic text-violet-800/85 dark:text-violet-200/85">
          {song.primary_scripture_ref}
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {song.theme.replace(/-/g, " ")}
        </div>
      </div>
    </Link>
  );
}
