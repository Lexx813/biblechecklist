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
    <div className="space-y-10">
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

  return (
    <section>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
        {heading}
      </h3>
      {section.note && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{section.note}</p>
      )}
      <div
        className={
          isSpoken
            ? "mt-3 space-y-1 border-l border-violet-200 pl-4 text-base text-slate-600 dark:border-white/10 dark:text-slate-300"
            : "mt-3 space-y-1 text-base leading-relaxed text-slate-900 dark:text-slate-100"
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
