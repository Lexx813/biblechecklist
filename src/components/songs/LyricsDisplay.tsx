import type { SongLyrics, SongSection } from "../../api/songs";

type Props = {
  lyrics: SongLyrics;
  lang: "en" | "es";
};

const SECTION_LABEL: Record<"en" | "es", Record<string, string>> = {
  en: {
    intro: "Intro",
    verse: "Verse",
    "pre-chorus": "Pre-chorus",
    chorus: "Chorus",
    bridge: "Bridge",
    toast: "Toast",
    breakdown: "Breakdown",
    outro: "Outro",
    "final-chorus": "Final chorus",
  },
  es: {
    intro: "Intro",
    verse: "Verso",
    "pre-chorus": "Pre-estribillo",
    chorus: "Estribillo",
    bridge: "Puente",
    toast: "Toast",
    breakdown: "Breakdown",
    outro: "Outro",
    "final-chorus": "Estribillo final",
  },
};

export default function LyricsDisplay({ lyrics, lang }: Props) {
  if (!lyrics?.sections?.length) return null;
  return (
    <div className="space-y-12 font-serif">
      {lyrics.sections.map((section, i) => (
        <Section key={i} section={section} lang={lang} />
      ))}
    </div>
  );
}

function Section({ section, lang }: { section: SongSection; lang: "en" | "es" }) {
  const heading = section.label ?? SECTION_LABEL[lang][section.type] ?? section.type;
  const isSpoken =
    section.type === "intro" ||
    section.type === "toast" ||
    section.type === "breakdown" ||
    section.type === "outro";
  const isChorus = section.type === "chorus" || section.type === "final-chorus";

  return (
    <section>
      <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
        {heading}
      </h3>
      {section.note && (
        <p className="mt-1 font-sans text-xs italic text-slate-500 dark:text-slate-400">{section.note}</p>
      )}
      <div
        className={
          isSpoken
            ? "mt-3 space-y-1.5 border-l-2 border-violet-300/50 pl-5 text-[17px]/[1.7] italic text-slate-600 dark:border-violet-400/30 dark:text-slate-400"
            : isChorus
              ? "mt-3 space-y-1.5 text-[18px]/[1.75] font-medium text-slate-900 dark:text-slate-50"
              : "mt-3 space-y-1.5 text-[17px]/[1.75] text-slate-800 dark:text-slate-200"
        }
      >
        {section.lines.map((line, j) =>
          line === "" ? (
            <div key={j} aria-hidden className="h-3" />
          ) : (
            <p key={j}>{line}</p>
          ),
        )}
      </div>
    </section>
  );
}
