import { useState } from "react";
import { useTranslation } from "react-i18next";
import { wolRefUrl } from "../../utils/wol";
import { VERSE_COUNT, getDailyVerseIndex } from "../../data/verses";
import "../../styles/daily-verse.css";

export default function DailyVerse() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] ?? "en";
  const [idx, setIdx] = useState(getDailyVerseIndex);

  const prev = () => setIdx(i => (i - 1 + VERSE_COUNT) % VERSE_COUNT);
  const next = () => setIdx(i => (i + 1) % VERSE_COUNT);

  // Show 5 dots centered on current index
  const dotCount = 5;
  const half = Math.floor(dotCount / 2);
  const startDot = Math.max(0, Math.min(idx - half, VERSE_COUNT - dotCount));

  return (
    <div className="daily-verse">
      <div className="daily-verse-label"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6z"/></svg> {t("dailyVerse.label")}</div>
      <p className="daily-verse-text">{t(`verses.${idx}.text`)}</p>
      {(() => {
        const ref = t(`verses.${idx}.ref`);
        const url = wolRefUrl(ref, lang);
        return url
          ? <a className="daily-verse-ref" href={url} target="_blank" rel="noopener noreferrer">- {ref} ↗</a>
          : <span className="daily-verse-ref">- {ref}</span>;
      })()}
      <div className="daily-verse-nav">
        <button className="daily-verse-arrow" onClick={prev} data-tip={t("dailyVerse.prev")}>‹</button>
        <div className="daily-verse-dots">
          {Array.from({ length: dotCount }, (_, i) => {
            const dotIdx = startDot + i;
            if (dotIdx >= VERSE_COUNT) return null;
            return (
              <button
                key={dotIdx}
                className={`daily-verse-dot${dotIdx === idx ? " active" : ""}`}
                onClick={() => setIdx(dotIdx)}
                aria-label={`Verse ${dotIdx + 1}`}
              />
            );
          })}
        </div>
        <button className="daily-verse-arrow" onClick={next} data-tip={t("dailyVerse.next")}>›</button>
      </div>

    </div>
  );
}
