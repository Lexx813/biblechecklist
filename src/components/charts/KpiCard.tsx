import AnimatedNumber from "./AnimatedNumber";
import Sparkline from "./Sparkline";

interface Props {
  label: string;
  /** Either a numeric value (will animate) or a pre-formatted string (will not animate). */
  value: number | string;
  /** Custom format applied to the animated number. Ignored when value is a string. */
  format?: (n: number) => string;
  /** Delta value, e.g. "+12%" or 5 (rendered with arrow if numeric). */
  delta?: string | number;
  /** Trailing label next to the delta, e.g. "vs last week". */
  deltaLabel?: string;
  /** Optional inline trend below the value. */
  spark?: number[];
  /** Color for the spark + accent. Default: purple. */
  accent?: string;
}

export default function KpiCard({
  label, value, format, delta, deltaLabel, spark, accent = "#7c3aed",
}: Props) {
  const isPositive =
    typeof delta === "number" ? delta >= 0 : String(delta ?? "").startsWith("+");
  const showDelta = delta !== undefined;

  return (
    <div className="an-kpi-card" style={{ ["--an-accent" as string]: accent }}>
      <div className="an-kpi-accent" style={{ background: accent }} />
      <div className="an-kpi-value">
        {typeof value === "number"
          ? <AnimatedNumber value={value} format={format} />
          : value}
      </div>
      <div className="an-kpi-label">{label}</div>
      {showDelta && (
        <div className={`an-kpi-delta ${isPositive ? "an-kpi-delta--up" : "an-kpi-delta--down"}`}>
          {typeof delta === "number" ? (delta >= 0 ? `+${delta}%` : `${delta}%`) : delta}
          {deltaLabel && <span className="an-kpi-delta-label"> {deltaLabel}</span>}
        </div>
      )}
      {!showDelta && deltaLabel && (
        <div className="an-kpi-delta an-kpi-delta--up">
          <span className="an-kpi-delta-label">{deltaLabel}</span>
        </div>
      )}
      {spark && spark.length >= 2 && (
        <div className="an-kpi-spark">
          <Sparkline data={spark} color={accent} width={88} height={24} />
        </div>
      )}
    </div>
  );
}
