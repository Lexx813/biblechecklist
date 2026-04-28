import Link from "next/link";
import SongHero from "./SongHero";
import ScriptureCard from "./ScriptureCard";
import LyricsDisplay from "./LyricsDisplay";
import JwOrgLinks from "./JwOrgLinks";
import ShareSheet from "./ShareSheet";
import MoreSongs from "./MoreSongs";
import {
  localizedDescription,
  localizedLyrics,
  localizedScriptureText,
  localizedTitle,
  type Song,
} from "../../api/songs";

type Props = {
  song: Song;
  others: Song[];
  signedUrl: string | null;
  lang: "en" | "es";
};

const COPY = {
  en: {
    why: "About this song",
    learnMore: "Read more on jw.org",
    lyrics: "Lyrics",
    backToSongs: "All songs",
  },
  es: {
    why: "Sobre esta canción",
    learnMore: "Leer más en jw.org",
    lyrics: "Letra",
    backToSongs: "Todas las canciones",
  },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
      {children}
    </h2>
  );
}

export default function SongDetailPage({ song, others, signedUrl, lang }: Props) {
  const t = COPY[lang];
  const title = localizedTitle(song, lang);
  const description = localizedDescription(song, lang);
  const scriptureText = localizedScriptureText(song, lang);
  const lyrics = localizedLyrics(song, lang);
  const songsHome = lang === "es" ? "/es/songs" : "/songs";
  const songUrl = `https://jwstudy.org${lang === "es" ? "/es" : ""}/songs/${song.slug}`;
  const learnMoreUrl = song.jw_org_links?.[0]?.url ?? "https://www.jw.org/";

  return (
    <article>
      <SongHero song={song} signedUrl={signedUrl} lang={lang} />

      <div className="mx-auto max-w-3xl space-y-14 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Scripture anchor */}
        <ScriptureCard reference={song.primary_scripture_ref} text={scriptureText} lang={lang} />

        {/* About this song — quieter */}
        <section>
          <SectionLabel>{t.why}</SectionLabel>
          <p className="mt-3 text-[17px] leading-relaxed text-slate-700 dark:text-slate-300">
            {description}
          </p>
          <a
            href={learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-violet-700 underline decoration-violet-300/70 underline-offset-4 transition hover:text-violet-900 hover:decoration-violet-700 dark:text-violet-300 dark:hover:text-violet-100"
          >
            {t.learnMore}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 17L17 7M9 7h8v8" />
            </svg>
          </a>
        </section>

        {/* Lyrics */}
        <section>
          <SectionLabel>{t.lyrics}</SectionLabel>
          <div className="mt-5">
            <LyricsDisplay lyrics={lyrics} lang={lang} />
          </div>
        </section>

        <JwOrgLinks links={song.jw_org_links} lang={lang} songId={song.id} />

        <ShareSheet
          songId={song.id}
          title={title}
          scriptureRef={song.primary_scripture_ref}
          url={songUrl}
          lang={lang}
        />

        <MoreSongs songs={others} lang={lang} />

        <div className="pt-2">
          <Link
            href={songsHome}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-violet-700 dark:text-slate-400 dark:hover:text-violet-300"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            {t.backToSongs}
          </Link>
        </div>
      </div>
    </article>
  );
}
