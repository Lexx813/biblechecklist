import SongCard from "./SongCard";
import SongsBrowser from "./SongsBrowser";
import type { Song } from "../../api/songs";

type Props = {
  songs: Song[];
  featured: Song | null;
  lang: "en" | "es";
};

const COPY = {
  en: {
    eyebrow: "JW Study · Songs",
    title: "Songs built on scripture.",
    body:
      "Original music for the JW community — each song anchored in a specific scripture. Listen, read the passage, and follow the links to jw.org for deeper study.",
  },
  es: {
    eyebrow: "JW Study · Canciones",
    title: "Canciones basadas en las Escrituras.",
    body:
      "Música original para la comunidad JW — cada canción se basa en un texto bíblico. Escucha, lee el pasaje y sigue los enlaces a jw.org para un estudio más profundo.",
  },
};

export default function SongIndexPage({ songs, featured, lang }: Props) {
  const t = COPY[lang];
  const gridSongs = featured ? songs.filter((s) => s.id !== featured.id) : songs;
  const noContent =
    lang === "es" ? "Aún no hay canciones publicadas." : "No songs published yet.";

  return (
    <>
      <header className="border-b border-slate-200/70 dark:border-white/8">
        <div className="px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
            {t.eyebrow}
          </div>
          <h1 className="mt-3 max-w-3xl font-extrabold tracking-tight text-slate-900 text-balance text-4xl/[1.05] sm:text-5xl/[1.05] dark:text-slate-50">
            {t.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-[17px] dark:text-slate-300">
            {t.body}
          </p>
        </div>
      </header>

      <main className="px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {featured && (
          <div className="mb-10">
            <SongCard song={featured} lang={lang} featured />
          </div>
        )}
        {songs.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">{noContent}</p>
        ) : (
          <SongsBrowser songs={gridSongs} lang={lang} />
        )}
      </main>
    </>
  );
}
