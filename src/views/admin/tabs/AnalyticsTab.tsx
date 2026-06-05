import { useState } from "react";
import { useAnalytics, useFeatureLeaders, useGrowthSeries, type GrowthBucket } from "../../../hooks/useAdmin";
import { VIOLET_600 } from "../../../lib/colors";
import { BOOKS } from "../../../data/books";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  useChartTheme, KpiCard, ChartCard, RichTooltip,
  AreaGradient, BarGradient, Glow,
} from "../../../components/charts";

function AnalyticsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="an-kpi-row">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />
        ))}
      </div>
      {[0,1,2].map(i => (
        <div key={i} className="skeleton" style={{ height: 220, borderRadius: 14 }} />
      ))}
    </div>
  );
}

function SectionHeader({ title, live }: { title: string; live?: boolean }) {
  return (
    <div className="an-section-header">
      {live && <span className="an-live-dot" />}
      <h2 className="an-section-title">{title}</h2>
    </div>
  );
}

// ── Time-range selector for the growth charts ────────────────────────────────
// Matches the "Range:" pill pattern used by the Songs + AI Usage tabs.
const VIOLET = VIOLET_600;
type RangePreset = { key: string; label: string; bucket: GrowthBucket; points: number };
const RANGES: RangePreset[] = [
  { key: "7d",  label: "7d",  bucket: "day",   points: 7 },
  { key: "30d", label: "30d", bucket: "day",   points: 30 },
  { key: "90d", label: "90d", bucket: "day",   points: 90 },
  { key: "1y",  label: "1y",  bucket: "month", points: 12 },
];

// Bucket-aware axis/tooltip label, e.g. day → "6/5", month → "Jun '26", year → "2026".
function makeDateFormatter(bucket: GrowthBucket) {
  return (d: string) => {
    const date = new Date(d + "T00:00:00");
    if (bucket === "year") return String(date.getFullYear());
    if (bucket === "month") return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
}

// "today" / "this month" etc. for the ChartCard latest-value caption.
const LATEST_LABEL: Record<GrowthBucket, string> = {
  day: "today", week: "this week", month: "this month", year: "this year",
};

function RangeSelector({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Range:</span>
      {RANGES.map(r => (
        <button
          key={r.key}
          onClick={() => onChange(r.key)}
          style={{
            padding: "5px 14px",
            borderRadius: 999,
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600,
            background: r.key === value ? VIOLET : "transparent",
            color: r.key === value ? "#fff" : "var(--text-muted)",
            border: `1px solid ${r.key === value ? "transparent" : "var(--border)"}`,
            transition: "all 180ms ease",
          }}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

/** Compute "latest vs prior period average" for a numeric series. */
function summarizeSeries(series: Array<{ count?: number; cost?: number }>, key: "count" | "cost") {
  if (!series || series.length === 0) return { value: 0, deltaPct: null as number | null };
  const last = Number(series[series.length - 1][key] ?? 0);
  const priorCount = Math.min(7, series.length - 1);
  if (priorCount === 0) return { value: last, deltaPct: null };
  const priorAvg =
    series.slice(-1 - priorCount, -1).reduce((s, r) => s + Number(r[key] ?? 0), 0) / priorCount;
  return { value: last, deltaPct: pctDelta(last, priorAvg) };
}

function relTime(s: string | null | undefined): string {
  if (!s) return "—";
  const then = new Date(s).getTime();
  const diff = Date.now() - then;
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function FeatureLeadersPanel({ feature, onClose }: { feature: string; onClose: () => void }) {
  const { data, isLoading } = useFeatureLeaders(feature, 50);

  return (
    <div style={{
      marginTop: 12,
      borderRadius: 12,
      background: "var(--bg-elev-1, rgba(124,58,237,0.04))",
      border: "1px solid rgba(124,58,237,0.15)",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderBottom: "1px solid rgba(124,58,237,0.12)",
      }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
          Top users — {feature} (last 30 days)
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: 18, lineHeight: 1, padding: 4,
          }}
          aria-label="Close"
        >×</button>
      </div>
      {isLoading ? (
        <div className="skeleton" style={{ height: 200, margin: 12, borderRadius: 8 }} />
      ) : !data || data.length === 0 ? (
        <p style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          No activity in the last 30 days for {feature}.
        </p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Email</th>
                <th>Activity</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u, i) => (
                <tr key={u.user_id}>
                  <td><strong>{i + 1}</strong></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {u.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatar_url} alt="" width={24} height={24} style={{ borderRadius: "50%" }} />
                      ) : (
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(124,58,237,0.2)" }} />
                      )}
                      <span>{u.display_name ?? "—"}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{u.email ?? "—"}</td>
                  <td><strong>{u.count}</strong></td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{relTime(u.last_activity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AnalyticsTab() {
  const { data, isLoading, isError } = useAnalytics();
  const t = useChartTheme();
  const [drillFeature, setDrillFeature] = useState<string | null>(null);

  // Growth-chart range selector (days / months / years).
  const [rangeKey, setRangeKey] = useState("30d");
  const range = RANGES.find(r => r.key === rangeKey) ?? RANGES[1];
  const { data: signupsSeries } = useGrowthSeries("signups", range.bucket, range.points);
  const { data: dauSeries } = useGrowthSeries("dau", range.bucket, range.points);
  const fmt = makeDateFormatter(range.bucket);
  const dauTitle = { day: "Daily", week: "Weekly", month: "Monthly", year: "Yearly" }[range.bucket] + " Active Users";

  if (isLoading) return <AnalyticsSkeleton />;
  if (isError || !data) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
      Failed to load analytics
    </div>
  );

  const { kpis, signups, dau, features, retention, adoption, histogram, heatmap } = data;

  const histogramColor = (bucket: string) => bucket === "100%" ? t.green : t.purple;

  const heatmapColor = (pct: number) => {
    if (t.isDark) {
      if (pct === 0)  return "#0a0315";
      if (pct < 10)  return "#1e0a3c";
      if (pct < 25)  return "#3b0764";
      if (pct < 50)  return "#5b21b6";
      if (pct < 75)  return "#7c3aed";
      return "#a78bfa";
    } else {
      if (pct === 0)  return "#f5f3ff";
      if (pct < 10)  return "#ede9fe";
      if (pct < 25)  return "#ddd6fe";
      if (pct < 50)  return "#a78bfa";
      if (pct < 75)  return "#7c3aed";
      return "#4c1d95";
    }
  };

  // Growth charts follow the range selector; fall back to the dashboard's
  // default 30-day daily series until the ranged query resolves.
  const growthSignups = signupsSeries ?? signups;
  const growthDau = dauSeries ?? dau;
  const signupsLatest = summarizeSeries(growthSignups, "count");
  const dauLatest = summarizeSeries(growthDau, "count");
  const latestLabel = LATEST_LABEL[range.bucket];

  return (
    <div className="an-wrap">

      {/* Range selector — drives the Growth & Activity charts below */}
      <RangeSelector value={rangeKey} onChange={setRangeKey} />

      {/* KPI Cards */}
      <SectionHeader title="Live Overview" live />
      <div className="an-kpi-row">
        <KpiCard
          label="Total Users"
          value={kpis.totalUsers}
          delta={`+${kpis.newUsersThisWeek}`}
          deltaLabel="this week"
          accent={t.purple}
          spark={signups.slice(-14).map(s => s.count)}
        />
        <KpiCard
          label="Daily Active"
          value={kpis.dailyActiveToday}
          delta={kpis.dauChangePct}
          deltaLabel="vs last week"
          accent={t.teal}
          spark={dau.slice(-14).map(d => d.count)}
        />
        <KpiCard
          label="30-Day Retention"
          value={`${kpis.retentionPct30d}%`}
          deltaLabel="of 30–60 day users"
          accent={t.purpleLight}
        />
        <KpiCard
          label="Chapters Today"
          value={kpis.chaptersToday}
          deltaLabel="site-wide"
          accent={t.amber}
        />
        <KpiCard
          label="Avg Streak"
          value={`${kpis.avgStreak}d`}
          deltaLabel="active readers"
          accent={t.green}
        />
      </div>

      {/* Signups + DAU */}
      <SectionHeader title="Growth & Activity" />
      <div className="an-chart-grid">
        <ChartCard
          title={`New Signups · ${range.label}`}
          latest={{ value: signupsLatest.value, label: latestLabel, deltaPct: signupsLatest.deltaPct }}
        >
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={growthSignups} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <AreaGradient id="signupGrad" color={t.purple} />
                <Glow id="signupGlow" stdDeviation={2.4} />
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: t.tick, fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={16} />
              <YAxis tick={{ fill: t.tick, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
              <Tooltip
                cursor={t.tooltip.cursor}
                content={<RichTooltip series={growthSignups as unknown as Array<Record<string, unknown>>} valueLabel="signups" labelFormatter={(d) => fmt(String(d))} />}
              />
              <Area
                type="monotone" dataKey="count" stroke={t.purple} strokeWidth={2.2}
                fill="url(#signupGrad)"
                style={{ filter: "url(#signupGlow)" }}
                isAnimationActive
                animationDuration={900}
                activeDot={{ r: 5, fill: t.purpleLight, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={`${dauTitle} · ${range.label}`}
          latest={{ value: dauLatest.value, label: latestLabel, deltaPct: dauLatest.deltaPct }}
        >
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={growthDau} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <AreaGradient id="dauGrad" color={t.teal} />
                <Glow id="dauGlow" stdDeviation={2.4} />
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: t.tick, fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={16} />
              <YAxis tick={{ fill: t.tick, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
              <Tooltip
                cursor={t.tooltip.cursor}
                content={<RichTooltip series={growthDau as unknown as Array<Record<string, unknown>>} valueLabel="users" labelFormatter={(d) => fmt(String(d))} />}
              />
              <Area
                type="monotone" dataKey="count" stroke={t.teal} strokeWidth={2.2}
                fill="url(#dauGrad)"
                style={{ filter: "url(#dauGlow)" }}
                isAnimationActive
                animationDuration={900}
                activeDot={{ r: 5, fill: t.tealLight, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Feature Usage */}
      <ChartCard title="Feature Adoption (% of all users, last 30 days) — click a bar for top users">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={features}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 60, bottom: 4 }}
            onClick={(e) => {
              const label = (e as { activeLabel?: string | number } | null)?.activeLabel;
              if (typeof label === "string") setDrillFeature(label);
            }}
          >
            <defs>
              <linearGradient id="featGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={t.purpleDark} stopOpacity={0.85} />
                <stop offset="100%" stopColor={t.purpleLight} stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={t.grid} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: t.tick, fontSize: 10 }} unit="%" tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="feature" tick={{ fill: t.isDark ? "#c4b5fd" : "#6d28d9", fontSize: 12 }} width={56} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={t.tooltip.cursor}
              contentStyle={t.tooltip.contentStyle}
              itemStyle={t.tooltip.itemStyle}
              formatter={(v: unknown) => [`${v}%`, "Users"]}
            />
            <Bar dataKey="pct" fill="url(#featGrad)" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={900} cursor="pointer" />
          </BarChart>
        </ResponsiveContainer>
        {drillFeature && (
          <FeatureLeadersPanel feature={drillFeature} onClose={() => setDrillFeature(null)} />
        )}
      </ChartCard>

      {/* Retention Cohorts */}
      <ChartCard title="Retention by Signup Cohort (active in last 7 days)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={retention} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <BarGradient id="retGrad" color={t.purpleDark} highlight={t.purpleLight} />
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: t.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: t.tick, fontSize: 10 }} unit="%" tickLine={false} axisLine={false} width={36} />
            <Tooltip
              cursor={t.tooltip.cursor}
              contentStyle={t.tooltip.contentStyle}
              itemStyle={t.tooltip.itemStyle}
              formatter={(v: unknown) => [`${v}%`, "Retained"]}
            />
            <Bar dataKey="pct" fill="url(#retGrad)" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={900} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Reading Adoption */}
      <ChartCard title="Reading Engagement">
        <div className="an-adoption-list">
          {adoption.map(({ bucket, count }) => {
            const maxCount = Math.max(...adoption.map(a => a.count), 1);
            const pct = Math.round((count / maxCount) * 100);
            return (
              <div key={bucket} className="an-adoption-row">
                <div className="an-adoption-label">{bucket}</div>
                <div className="an-adoption-bar-track">
                  <div className="an-adoption-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="an-adoption-count">{count.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Completion Histogram */}
      <SectionHeader title="Bible Progress" />
      <ChartCard title="Bible Completion Distribution">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={histogram} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <BarGradient id="histPurple" color={t.purpleDark} highlight={t.purpleLight} />
              <BarGradient id="histGreen" color="#15803d" highlight="#86efac" />
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
            <XAxis dataKey="bucket" tick={{ fill: t.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: t.tick, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
            <Tooltip
              cursor={t.tooltip.cursor}
              contentStyle={t.tooltip.contentStyle}
              itemStyle={t.tooltip.itemStyle}
              formatter={(v: unknown) => [`${v}`, "Users"]}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={900}>
              {histogram.map(entry => (
                <Cell key={entry.bucket} fill={entry.bucket === "100%" ? "url(#histGreen)" : "url(#histPurple)"} stroke={histogramColor(entry.bucket)} strokeWidth={0} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Book Heatmap */}
      <ChartCard title="Bible Book Reach (% of users who read each book)">
        <div className="an-heatmap">
          {heatmap.map(({ bookIndex, pct }) => {
            const book = BOOKS[bookIndex];
            if (!book) return null;
            return (
              <div
                key={bookIndex}
                className="an-heatmap-cell"
                style={{ background: heatmapColor(pct) }}
                title={`${book.name}: ${pct}%`}
              >
                <span className="an-heatmap-abbr">{book.abbr}</span>
              </div>
            );
          })}
        </div>
        <div className="an-heatmap-legend">
          <span>0%</span>
          <div className="an-heatmap-gradient" />
          <span>100%</span>
        </div>
      </ChartCard>

    </div>
  );
}
