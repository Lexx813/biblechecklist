import { useState } from "react";
import { useTranslation } from "react-i18next";
import { VERSES, getDailyVerse } from "../../data/verses";
import "../../styles/daily-verse.css";

const todayVerse = getDailyVerse();
const todayIdx = VERSES.indexOf(todayVerse);

export default function DailyVerse() {
  const { t, i18n } = useTranslation();
  const [idx, setIdx] = useState(todayIdx);
  const verse = VERSES[idx];

  const prev = () => setIdx(i => (i - 1 + VERSES.length) % VERSES.length);
  const next = () => setIdx(i => (i + 1) % VERSES.length);

  // Show 5 dots centered on current index
  const dotCount = 5;
  const half = Math.floor(dotCount / 2);
  const startDot = Math.max(0, Math.min(idx - half, VERSES.length - dotCount));

  return (
    <div className="daily-verse">
      <div className="daily-verse-label">✦ {t("dailyVerse.label")}</div>
      <p className="daily-verse-text">{i18n.language.startsWith("es") ? (verse.textEs ?? verse.text) : verse.text}</p>
      <span className="daily-verse-ref">— {verse.ref}</span>
      <div className="daily-verse-nav">
        <button className="daily-verse-arrow" onClick={prev} title={t("dailyVerse.prev")}>‹</button>
        <div className="daily-verse-dots">
          {Array.from({ length: dotCount }, (_, i) => {
            const dotIdx = startDot + i;
            if (dotIdx >= VERSES.length) return null;
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
