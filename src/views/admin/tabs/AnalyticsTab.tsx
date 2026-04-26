import { useAnalytics } from "../../../hooks/useAdmin";
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

const dateFormatter = (d: string) => {
  const date = new Date(d + "T00:00:00");
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

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

export function AnalyticsTab() {
  const { data, isLoading, isError } = useAnalytics();
  const t = useChartTheme();

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

  const signupsLatest = summarizeSeries(signups, "count");
  const dauLatest = summarizeSeries(dau, "count");

  return (
    <div className="an-wrap">

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
          title="New Signups (30 days)"
          latest={{ value: signupsLatest.value, label: "today", deltaPct: signupsLatest.deltaPct }}
        >
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={signups} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <AreaGradient id="signupGrad" color={t.purple} />
                <Glow id="signupGlow" stdDeviation={2.4} />
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
              <XAxis dataKey="date" tickFormatter={dateFormatter} tick={{ fill: t.tick, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: t.tick, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
              <Tooltip
                cursor={t.tooltip.cursor}
                content={<RichTooltip series={signups as unknown as Array<Record<string, unknown>>} valueLabel="signups" labelFormatter={(d) => dateFormatter(String(d))} />}
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
          title="Daily Active Users (30 days)"
          latest={{ value: dauLatest.value, label: "today", deltaPct: dauLatest.deltaPct }}
        >
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dau} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <AreaGradient id="dauGrad" color={t.teal} />
                <Glow id="dauGlow" stdDeviation={2.4} />
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
              <XAxis dataKey="date" tickFormatter={dateFormatter} tick={{ fill: t.tick, fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: t.tick, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
              <Tooltip
                cursor={t.tooltip.cursor}
                content={<RichTooltip series={dau as unknown as Array<Record<string, unknown>>} valueLabel="users" labelFormatter={(d) => dateFormatter(String(d))} />}
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
      <ChartCard title="Feature Adoption (% of all users, last 30 days)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={features}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 60, bottom: 4 }}
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
            <Bar dataKey="pct" fill="url(#featGrad)" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={900} />
          </BarChart>
        </ResponsiveContainer>
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
