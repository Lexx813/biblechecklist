import { useTranslation } from "react-i18next";
import { useReadingStreak } from "../hooks/useProgress";
import "../styles/right-panel.css";

// Daily verse, static rotation by day-of-year. Built inside the component so
// every string is a literal t() call (extractable by the translation script).
function getDailyVerses(t: (k: string, d: string) => string) {
  return [
    { text: t("rightPanel.verse1Text", "Happy are those conscious of their spiritual need."), ref: t("rightPanel.verse1Ref", "Matthew 5:3") },
    { text: t("rightPanel.verse2Text", "Trust in Jehovah with all your heart."), ref: t("rightPanel.verse2Ref", "Proverbs 3:5") },
    { text: t("rightPanel.verse3Text", "The meek will possess the earth."), ref: t("rightPanel.verse3Ref", "Psalm 37:11") },
    { text: t("rightPanel.verse4Text", "Draw close to God and he will draw close to you."), ref: t("rightPanel.verse4Ref", "James 4:8") },
    { text: t("rightPanel.verse5Text", "Let your light shine before men."), ref: t("rightPanel.verse5Ref", "Matthew 5:16") },
    { text: t("rightPanel.verse6Text", "Love your neighbor as yourself."), ref: t("rightPanel.verse6Ref", "Matthew 22:39") },
    { text: t("rightPanel.verse7Text", "Do not be anxious over anything."), ref: t("rightPanel.verse7Ref", "Philippians 4:6") },
    { text: t("rightPanel.verse8Text", "This is the day Jehovah has made; let us be joyful."), ref: t("rightPanel.verse8Ref", "Psalm 118:24") },
    { text: t("rightPanel.verse9Text", "Put on the complete suit of armor from God."), ref: t("rightPanel.verse9Ref", "Ephesians 6:11") },
    { text: t("rightPanel.verse10Text", "Seek first the Kingdom and his righteousness."), ref: t("rightPanel.verse10Ref", "Matthew 6:33") },
  ];
}

function getDailyVerse(t: (k: string, d: string) => string) {
  const verses = getDailyVerses(t);
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
  return verses[dayOfYear % verses.length];
}

interface Props {
  page: string;
  user: { id?: string; email?: string } | null | undefined;
  navigate: (page: string) => void;
}

export default function RightPanel({ page, user, navigate }: Props) {
  const { t } = useTranslation();
  const { data: streakData } = useReadingStreak(user?.id);
  const verse = getDailyVerse(t);
  const streak = streakData?.current_streak ?? 0;

  return (
    <>
      {/* Daily Verse */}
      <div className="rp-widget">
        <div className="rp-widget-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          {t("rightPanel.dailyVerse", "Daily Verse")}
        </div>
        <div className="rp-verse">"{verse.text}"</div>
        <div className="rp-verse-ref">- {verse.ref}</div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="rp-widget">
          <div className="rp-widget-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0C17 7 12 2 12 2z"/></svg>
            {t("rightPanel.yourStreak", "Your Streak")}
          </div>
          <div className="rp-streak-count">{streak}</div>
          <div className="rp-streak-label">{streak !== 1 ? t("rightPanel.daysInARow", "days in a row") : t("rightPanel.dayInARow", "day in a row")}</div>
        </div>
      )}

    </>
  );
}
