import { useAnalytics } from "../../../hooks/useAdmin";
import { BOOKS } from "../../../data/books";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const PURPLE = "#7c3aed";
const TEAL   = "#0d9488";

function AnalyticsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="an-kpi-row">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />
        ))}
      </div>
      {[0,1,2].map(i => (
        <div key={i} className="skeleton" style={{ height: 220, borderRadius: 14 }} />
      ))}
    </div>
  );
}

function KpiCard({ label, value, delta, deltaLabel }: {
  label: string;
  value: string | number;
  delta?: string | number;
  deltaLabel?: string;
}) {
  const isPositive = typeof delta === "number" ? delta >= 0 : String(delta ?? "").startsWith("+");
  return (
    <div className="an-kpi-card">
      <div className="an-kpi-accent" />
      <div className="an-kpi-value">{value}</div>
      <div className="an-kpi-label">{label}</div>
      {delta !== undefined && (
        <div className={`an-kpi-delta ${isPositive ? "an-kpi-delta--up" : "an-kpi-delta--down"}`}>
          {typeof delta === "number" ? (delta >= 0 ? `+${delta}%` : `${delta}%`) : delta}
          {deltaLabel && <span className="an-kpi-delta-label"> {deltaLabel}</span>}
        </div>
      )}
      {delta === undefined && deltaLabel && (
        <div className="an-kpi-delta an-kpi-delta--up">
          <span className="an-kpi-delta-label">{deltaLabel}</span>
        </div>
      )}
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="an-chart-card">
      <div className="an-chart-title">{title}</div>
      {children}
    </div>
  );
}

const dateFormatter = (d: string) => {
  const date = new Date(d + "T00:00:00");
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const tooltipStyle = {
  contentStyle: { background: "#1a0f35", border: "1px solid #2d1f4e", borderRadius: 8, fontSize: 12 },
  itemStyle: { color: "#e9d5ff" },
};

export function AnalyticsTab() {
  const { data, isLoading, isError } = useAnalytics();

  if (isLoading) return <AnalyticsSkeleton />;
  if (isError || !data) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
      Failed to load analytics
    </div>
  );

  const { kpis, signups, dau, features, retention, adoption, histogram, heatmap } = data;

  const histogramColor = (bucket: string) => bucket === "100%" ? "#16a34a" : PURPLE;

  const heatmapColor = (pct: number) => {
    if (pct === 0)  return "#0a0315";
    if (pct < 10)  return "#1e0a3c";
    if (pct < 25)  return "#3b0764";
    if (pct < 50)  return "#5b21b6";
    if (pct < 75)  return "#7c3aed";
    return "#a78bfa";
  };

  return (
    <div className="an-wrap">

      {/* Section 1: KPI Cards */}
      <SectionHeader title="Live Overview" live />
      <div className="an-kpi-row">
        <KpiCard
          label="Total Users"
          value={kpis.totalUsers.toLocaleString()}
          delta={`+${kpis.newUsersThisWeek}`}
          deltaLabel="this week"
        />
        <KpiCard
          label="Daily Active"
          value={kpis.dailyActiveToday.toLocaleString()}
          delta={kpis.dauChangePct}
          deltaLabel="vs last week"
        />
        <KpiCard
          label="30-Day Retention"
          value={`${kpis.retentionPct30d}%`}
          deltaLabel="of 30–60 day users"
        />
        <KpiCard
          label="Chapters Today"
          value={kpis.chaptersToday.toLocaleString()}
          deltaLabel="site-wide"
        />
        <KpiCard
          label="Avg Streak"
          value={`${kpis.avgStreak}d`}
          deltaLabel="active readers"
        />
      </div>

      {/* Section 2a + 2b: Signups + DAU */}
      <SectionHeader title="Growth & Activity" />
      <div className="an-chart-grid">
        <ChartCard title="New Signups (30 days)">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={signups} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PURPLE} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tickFormatter={dateFormatter} tick={{ fill: "#6b7280", fontSize: 10 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                {...tooltipStyle}
                labelStyle={{ color: "#a78bfa" }}
                labelFormatter={(d: unknown) => dateFormatter(String(d))}
              />
              <Area type="monotone" dataKey="count" stroke={PURPLE} strokeWidth={2} fill="url(#signupGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Daily Active Users (30 days)">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dau} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TEAL} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tickFormatter={dateFormatter} tick={{ fill: "#6b7280", fontSize: 10 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                {...tooltipStyle}
                labelStyle={{ color: "#5eead4" }}
                labelFormatter={(d: unknown) => dateFormatter(String(d))}
              />
              <Area type="monotone" dataKey="count" stroke={TEAL} strokeWidth={2} fill="url(#dauGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Section 2c: Feature Usage */}
      <ChartCard title="Feature Adoption (% of all users, last 30 days)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={features}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 60, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} unit="%" />
            <YAxis type="category" dataKey="feature" tick={{ fill: "#c4b5fd", fontSize: 12 }} width={56} />
            <Tooltip
              {...tooltipStyle}
              formatter={(v: unknown) => [`${v}%`, "Users"]}
            />
            <Bar dataKey="pct" fill={PURPLE} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Section 2d: Retention Cohorts */}
      <ChartCard title="Retention by Signup Cohort (active in last 7 days)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={retention} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PURPLE} stopOpacity={1} />
                <stop offset="100%" stopColor="#3b0764" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} unit="%" />
            <Tooltip
              {...tooltipStyle}
              formatter={(v: unknown) => [`${v}%`, "Retained"]}
            />
            <Bar dataKey="pct" fill="url(#retGrad)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Section 2e: Reading Adoption */}
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

      {/* Section 3a: Completion Histogram */}
      <SectionHeader title="Bible Progress" />
      <ChartCard title="Bible Completion Distribution">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={histogram} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="bucket" tick={{ fill: "#6b7280", fontSize: 11 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              {...tooltipStyle}
              formatter={(v: unknown) => [`${v}`, "Users"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {histogram.map(entry => (
                <Cell key={entry.bucket} fill={histogramColor(entry.bucket)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Section 3b: Book Heatmap */}
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
