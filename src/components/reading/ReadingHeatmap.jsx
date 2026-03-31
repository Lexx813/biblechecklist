import { useMemo } from "react";
import "../../styles/reading-plan.css";

function getLevel(chapters, goal) {
  if (!chapters || chapters === 0) return 0;
  if (chapters < Math.ceil(goal * 0.5)) return 1;
  if (chapters < goal) return 2;
  return 3;
}

export default function ReadingHeatmap({ data = [], dailyGoal = 3 }) {
  const { weeks } = useMemo(() => {
    // Build a map of date → chapters from real data
    const dataMap = new Map((data ?? []).map(d => [d.date, d.chapters]));

    // Always render 52 weeks (364 days) ending today
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const days = [];
    for (let i = 363; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const chapters = dataMap.get(dateStr) ?? 0;
      days.push({ date: dateStr, chapters, level: getLevel(chapters, dailyGoal) });
    }

    // Pad start so first day aligns to Monday
    const startDay = (new Date(days[0].date + "T12:00:00").getDay() + 6) % 7;
    const padded = [...Array(startDay).fill(null), ...days];

    const w = [];
    for (let i = 0; i < padded.length; i += 7) {
      w.push(padded.slice(i, i + 7));
    }
    return { weeks: w };
  }, [data, dailyGoal]);

  return (
    <div className="heatmap-outer">
      <div className="heatmap-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="heatmap-col">
            {Array(7).fill(null).map((_, di) => {
              const cell = week[di] ?? null;
              return (
                <div
                  key={di}
                  className="heatmap-cell"
                  data-level={cell ? cell.level : (di < week.length ? 0 : -1)}
                >
                  {cell && (
                    <span className="heatmap-tooltip">
                      {new Date(cell.date + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      {cell.chapters > 0 && <><br />{cell.chapters} chapter{cell.chapters !== 1 ? "s" : ""}</>}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        {[0, 1, 2, 3].map(l => (
          <div key={l} className="heatmap-cell heatmap-cell--legend" data-level={l} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
