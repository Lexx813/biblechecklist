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
    if (!data.length) return { weeks: [] };

    // Pad start so first day aligns to Monday (0=Mon)
    const first = new Date(data[0].date + "T12:00:00");
    const startDay = (first.getDay() + 6) % 7; // Monday-based
    const padded = [
      ...Array(startDay).fill(null),
      ...data.map(d => ({ ...d, level: getLevel(d.chapters, dailyGoal) })),
    ];

    // Split into weeks (columns of 7)
    const w = [];
    for (let i = 0; i < padded.length; i += 7) {
      w.push(padded.slice(i, i + 7));
    }
    return { weeks: w };
  }, [data, dailyGoal]);

  if (!weeks.length) return null;

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
                  title={cell ? `${cell.date}: ${cell.chapters} chapter${cell.chapters !== 1 ? "s" : ""}` : ""}
                />
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
