import SongCard from "./SongCard";
import SongGrid from "./SongGrid";
import type { Song } from "../../api/songs";

type Props = {
  songs: Song[];
  featured: Song | null;
  lang: "en" | "es";
};

const COPY = {
  en: {
    eyebrow: "Songs",
    title: "Original music for the JW community",
    body:
      "Listen, share, and read the scripture each song is built on. Aligned with the New World Translation. For deeper study, follow the links to jw.org and wol.jw.org.",
  },
  es: {
    eyebrow: "Canciones",
    title: "Música original para la comunidad JW",
    body:
      "Escucha, comparte y lee el texto bíblico que inspiró cada canción. Basado en la Traducción del Nuevo Mundo. Para estudios más profundos, sigue los enlaces a jw.org y wol.jw.org.",
  },
};

export default function SongIndexPage({ songs, featured, lang }: Props) {
  const t = COPY[lang];
  const gridSongs = featured ? songs.filter((s) => s.id !== featured.id) : songs;
  const noContent =
    lang === "es" ? "Aún no hay canciones publicadas." : "No songs published yet.";

  return (
    <>
      <header className="border-b border-slate-200 bg-violet-50/40 dark:border-white/10 dark:bg-violet-950/20">
        <div className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
            {t.eyebrow}
          </div>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
            {t.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
            {t.body}
          </p>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {featured && (
          <div className="mb-14">
            <SongCard song={featured} lang={lang} featured />
          </div>
        )}
        <SongGrid songs={gridSongs} lang={lang} />
        {songs.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400">{noContent}</p>
        )}
      </main>
    </>
  );
}
