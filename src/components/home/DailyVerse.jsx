import { useState } from "react";
import { useTranslation } from "react-i18next";
import { VERSE_COUNT, getDailyVerseIndex } from "../../data/verses";
import "../../styles/daily-verse.css";

export default function DailyVerse() {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(getDailyVerseIndex);

  const prev = () => setIdx(i => (i - 1 + VERSE_COUNT) % VERSE_COUNT);
  const next = () => setIdx(i => (i + 1) % VERSE_COUNT);

  // Show 5 dots centered on current index
  const dotCount = 5;
  const half = Math.floor(dotCount / 2);
  const startDot = Math.max(0, Math.min(idx - half, VERSE_COUNT - dotCount));

  return (
    <div className="daily-verse">
      <div className="daily-verse-label">✦ {t("dailyVerse.label")}</div>
      <p className="daily-verse-text">{t(`verses.${idx}.text`)}</p>
      <span className="daily-verse-ref">— {t(`verses.${idx}.ref`)}</span>
      <div className="daily-verse-nav">
        <button className="daily-verse-arrow" onClick={prev} title={t("dailyVerse.prev")}>‹</button>
        <div className="daily-verse-dots">
          {Array.from({ length: dotCount }, (_, i) => {
            const dotIdx = startDot + i;
            if (dotIdx >= VERSE_COUNT) return null;
            return (
              <button
                key={dotIdx}
                className={`daily-verse-dot${dotIdx === idx ? " active" : ""}`}
                onClick={() => setIdx(dotIdx)}
              />
            );
          })}
        </div>
        <button className="daily-verse-arrow" onClick={next} title={t("dailyVerse.next")}>›</button>
      </div>
    </div>
  );
}
