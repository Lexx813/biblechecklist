import { useChartTheme } from "./useChartTheme";

interface PayloadItem {
  value: number;
  name?: string;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

interface Props {
  active?: boolean;
  payload?: PayloadItem[];
  label?: unknown;
  labelFormatter?: (l: unknown) => string;
  valueFormatter?: (v: number) => string;
  valueLabel?: string;
  /** Series array used to look up the previous data point for delta computation */
  series?: Array<Record<string, unknown>>;
  /** Field on each series row that uniquely identifies it (default: "date") */
  seriesKey?: string;
}

/**
 * Custom recharts tooltip with delta-vs-previous indicator.
 * Pass `series` + the same `dataKey` used on the chart to enable delta.
 */
export default function RichTooltip({
  active, payload, label,
  labelFormatter, valueFormatter, valueLabel = "value",
  series, seriesKey = "date",
}: Props) {
  const t = useChartTheme();
  if (!active || !payload || payload.length === 0) return null;

  const cur = payload[0];
  const value = Number(cur.value);

  let delta: number | null = null;
  let pctDelta: number | null = null;
  if (series && cur.payload && cur.dataKey) {
    const id = cur.payload[seriesKey];
    const idx = series.findIndex(s => s[seriesKey] === id);
    if (idx > 0) {
      const prev = Number(series[idx - 1][cur.dataKey] ?? 0);
      delta = value - prev;
      if (prev !== 0) pctDelta = Math.round((delta / prev) * 100);
    }
  }

  const labelText = labelFormatter ? labelFormatter(label) : String(label ?? "");
  const valueText = valueFormatter ? valueFormatter(value) : value.toLocaleString();

  const deltaPositive = delta !== null && delta > 0;
  const deltaNegative = delta !== null && delta < 0;
  const deltaColor = deltaPositive ? t.green : deltaNegative ? t.red : t.tick;

  return (
    <div style={t.tooltip.contentStyle as React.CSSProperties}>
      <div style={{ fontSize: 11, color: t.tick, marginBottom: 4, fontWeight: 500 }}>
        {labelText}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: t.text, fontVariantNumeric: "tabular-nums" }}>
          {valueText}
        </span>
        <span style={{ fontSize: 10, color: t.tick, textTransform: "lowercase" }}>{valueLabel}</span>
      </div>
      {delta !== null && (
        <div style={{ marginTop: 4, fontSize: 11, color: deltaColor, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {deltaPositive ? "▲" : deltaNegative ? "▼" : "-"}{" "}
          {delta > 0 ? "+" : ""}{Math.round(delta).toLocaleString()}
          {pctDelta !== null && <span style={{ opacity: 0.7, marginLeft: 4 }}>({pctDelta > 0 ? "+" : ""}{pctDelta}%)</span>}
          <span style={{ color: t.tick, fontWeight: 400, marginLeft: 4 }}>vs prev</span>
        </div>
      )}
    </div>
  );
}
