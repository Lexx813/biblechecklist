import Image from "next/image";
import SongAudioPlayer from "./SongAudioPlayer";
import DownloadButton from "./DownloadButton";
import { localizedTitle, type Song } from "../../api/songs";

type Props = {
  song: Song;
  signedUrl: string | null;
  lang: "en" | "es";
};

const COPY = {
  en: { song: "Song" },
  es: { song: "Canción" },
};

export default function SongHero({ song, signedUrl, lang }: Props) {
  const title = localizedTitle(song, lang);
  const cover = song.cover_image_url ?? "/og-image.jpg";
  const t = COPY[lang];

  return (
    <header className="relative overflow-hidden border-b border-slate-200/70 dark:border-white/8">
      {/* Soft scripture-toned background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-violet-50/50 to-transparent dark:from-violet-950/30 dark:to-transparent"
      />

      <div className="relative grid gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(280px,360px)_1fr] lg:items-center lg:gap-14 lg:px-8 lg:py-16">
        {/* Cover */}
        <div className="overflow-hidden rounded-xl shadow-[0_18px_48px_-20px_rgba(76,29,149,0.35)]">
          <Image
            src={cover}
            alt={title}
            width={720}
            height={720}
            priority
            sizes="(min-width: 1024px) 360px, 100vw"
            style={{ aspectRatio: "1 / 1" }}
            className="size-full object-cover"
          />
        </div>

        {/* Title block + player */}
        <div className="flex flex-col gap-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
            {t.song} · {song.theme.replace(/-/g, " ")}
          </div>
          <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] dark:text-slate-50">
            {title}
          </h1>
          <div className="font-serif text-xl italic text-violet-800/90 sm:text-2xl dark:text-violet-200/90">
            {song.primary_scripture_ref}
          </div>

          <div className="mt-3">
            <SongAudioPlayer
              signedUrl={signedUrl}
              durationSeconds={song.duration_seconds}
              title={title}
              songId={song.id}
              lang={lang}
            />
            <div className="mt-3">
              <DownloadButton
                songId={song.id}
                slug={song.slug}
                lang={lang}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
