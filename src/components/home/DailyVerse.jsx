import { useState } from "react";
import { useTranslation } from "react-i18next";
import { VERSE_COUNT, getDailyVerseIndex } from "../../data/verses";
import AICompanion from "../AICompanion";
import { useSubscription } from "../../hooks/useSubscription";
import "../../styles/daily-verse.css";

export default function DailyVerse({ user }) {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(getDailyVerseIndex);
  const [showAI, setShowAI] = useState(false);
  const { isPremium } = useSubscription(user?.id);

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
              />
            );
          })}
        </div>
        <button className="daily-verse-arrow" onClick={next} data-tip={t("dailyVerse.next")}>›</button>
      </div>

      {user && isPremium && (
        <button
          className="daily-verse-ai-btn"
          onClick={() => setShowAI(v => !v)}
        >
          {showAI ? "Hide AI Companion" : "✨ Ask AI about this verse"}
        </button>
      )}

      {user && isPremium && showAI && (
        <AICompanion
          passage={t(`verses.${idx}.text`)}
          reference={t(`verses.${idx}.ref`)}
          className="daily-verse-ai-panel"
        />
      )}
    </div>
  );
}
