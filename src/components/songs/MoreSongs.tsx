import SongCard from "./SongCard";
import type { Song } from "../../api/songs";

type Props = {
  songs: Song[];
  lang: "en" | "es";
};

const COPY = {
  en: { title: "More songs" },
  es: { title: "Más canciones" },
};

export default function MoreSongs({ songs, lang }: Props) {
  if (!songs.length) return null;
  const t = COPY[lang];
  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
        {t.title}
      </h2>
      <ul className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {songs.map((song) => (
          <li key={song.id}>
            <SongCard song={song} lang={lang} />
          </li>
        ))}
      </ul>
    </section>
  );
}
