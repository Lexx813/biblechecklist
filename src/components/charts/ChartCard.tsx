interface Props {
  title: string;
  /** Optional latest-value summary shown on the right side of the title row. */
  latest?: { value: string | number; label?: string; deltaPct?: number | null };
  children: React.ReactNode;
}

export default function ChartCard({ title, latest, children }: Props) {
  const showSummary = latest !== undefined;
  const deltaPct = latest?.deltaPct ?? null;
  const dir = deltaPct === null ? "flat" : deltaPct > 0 ? "up" : deltaPct < 0 ? "down" : "flat";

  return (
    <div className="an-chart-card">
      <div className="an-chart-header">
        <div className="an-chart-title">{title}</div>
        {showSummary && (
          <div className="an-chart-summary">
            <span className="an-chart-summary-value">{latest!.value}</span>
            {latest!.label && <span className="an-chart-summary-label">{latest!.label}</span>}
            {deltaPct !== null && (
              <span className={`an-chart-summary-delta an-chart-summary-delta--${dir}`}>
                {dir === "up" ? "▲" : dir === "down" ? "▼" : "—"} {deltaPct > 0 ? "+" : ""}{deltaPct}%
              </span>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
