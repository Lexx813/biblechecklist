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
    <header className="border-b border-slate-200 bg-violet-50/40 dark:border-white/10 dark:bg-violet-950/20">
      <div className="grid gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-5 lg:gap-12 lg:px-8 lg:py-16">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5">
            <Image
              src={cover}
              alt={title}
              width={800}
              height={800}
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              style={{ aspectRatio: "1 / 1" }}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col justify-center gap-5 lg:col-span-3">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            <span>{t.song}</span>
            <span aria-hidden className="text-slate-300 dark:text-white/20">·</span>
            <span className="text-slate-500 dark:text-slate-400">{song.theme.replace(/-/g, " ")}</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-slate-50">
            {title}
          </h1>
          <div className="text-base font-medium text-violet-700 dark:text-violet-300">
            {song.primary_scripture_ref}
          </div>

          <div className="mt-2">
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
