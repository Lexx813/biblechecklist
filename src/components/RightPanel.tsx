import { useReadingStreak } from "../hooks/useProgress";
import "../styles/right-panel.css";

// Daily verse, static rotation by day-of-year
const DAILY_VERSES = [
  { text: "Happy are those conscious of their spiritual need.", ref: "Matthew 5:3" },
  { text: "Trust in Jehovah with all your heart.", ref: "Proverbs 3:5" },
  { text: "The meek will possess the earth.", ref: "Psalm 37:11" },
  { text: "Draw close to God and he will draw close to you.", ref: "James 4:8" },
  { text: "Let your light shine before men.", ref: "Matthew 5:16" },
  { text: "Love your neighbor as yourself.", ref: "Matthew 22:39" },
  { text: "Do not be anxious over anything.", ref: "Philippians 4:6" },
  { text: "This is the day Jehovah has made; let us be joyful.", ref: "Psalm 118:24" },
  { text: "Put on the complete suit of armor from God.", ref: "Ephesians 6:11" },
  { text: "Seek first the Kingdom and his righteousness.", ref: "Matthew 6:33" },
];

function getDailyVerse() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

interface Props {
  page: string;
  user: { id?: string; email?: string } | null | undefined;
  navigate: (page: string) => void;
}

export default function RightPanel({ page, user, navigate }: Props) {
  const { data: streakData } = useReadingStreak(user?.id);
  const verse = getDailyVerse();
  const streak = streakData?.current_streak ?? 0;

  return (
    <>
      {/* Daily Verse */}
      <div className="rp-widget">
        <div className="rp-widget-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Daily Verse
        </div>
        <div className="rp-verse">"{verse.text}"</div>
        <div className="rp-verse-ref">- {verse.ref}</div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="rp-widget">
          <div className="rp-widget-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2c0 0-5 5-5 10a5 5 0 0 0 10 0C17 7 12 2 12 2z"/></svg>
            Your Streak
          </div>
          <div className="rp-streak-count">{streak}</div>
          <div className="rp-streak-label">day{streak !== 1 ? "s" : ""} in a row</div>
        </div>
      )}

    </>
  );
}
