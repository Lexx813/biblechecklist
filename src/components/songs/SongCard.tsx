import Link from "next/link";
import Image from "next/image";
import { localizedTitle, type Song } from "../../api/songs";

type Props = {
  song: Song;
  lang: "en" | "es";
  featured?: boolean;
};

export default function SongCard({ song, lang, featured = false }: Props) {
  const href = lang === "es" ? `/es/songs/${song.slug}` : `/songs/${song.slug}`;
  const title = localizedTitle(song, lang);
  const cover = song.cover_image_url ?? "/og-image.jpg";

  return (
    <Link
      href={href}
      className={
        "group block overflow-hidden rounded-md border border-slate-200 transition hover:border-violet-400 hover:shadow-[0_8px_32px_-12px_rgba(124,58,237,0.25)] dark:border-white/10 dark:hover:border-violet-400/60" +
        (featured ? " sm:grid sm:grid-cols-5" : "")
      }
    >
      <div className={featured ? "relative sm:col-span-3" : "relative"}>
        <Image
          src={cover}
          alt={title}
          width={featured ? 1200 : 600}
          height={featured ? 1200 : 600}
          priority={featured}
          loading={featured ? "eager" : "lazy"}
          sizes={
            featured
              ? "(min-width: 640px) 60vw, 100vw"
              : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          }
          className="h-full w-full object-cover"
          style={{ aspectRatio: featured ? "3 / 2" : "1 / 1" }}
        />
      </div>
      <div className={"flex flex-col justify-center gap-2 p-5 sm:p-6 " + (featured ? "sm:col-span-2" : "")}>
        {featured && (
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            Featured
          </div>
        )}
        <h3
          className={
            (featured ? "text-2xl sm:text-3xl " : "text-lg ") +
            "font-bold leading-snug tracking-tight text-slate-900 group-hover:text-violet-700 dark:text-slate-50 dark:group-hover:text-violet-300"
          }
        >
          {title}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-sm bg-violet-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
            {song.theme.replace(/-/g, " ")}
          </span>
          <span className="text-slate-500 dark:text-slate-400">{song.primary_scripture_ref}</span>
        </div>
      </div>
    </Link>
  );
}
