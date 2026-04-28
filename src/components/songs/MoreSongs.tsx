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
      <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
        {t.title}
      </h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {songs.map((song) => (
          <li key={song.id}>
            <SongCard song={song} lang={lang} />
          </li>
        ))}
      </ul>
    </section>
  );
}
