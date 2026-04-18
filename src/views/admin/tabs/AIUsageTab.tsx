import { useState, useEffect } from "react";
import { useAIUsage } from "../../../hooks/useAdmin";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const PURPLE = "#7c3aed";
const TEAL   = "#0d9488";
const AMBER  = "#d97706";

const TOOL_COLORS: Record<string, string> = {
  none:               "#6b7280",
  save_note:          TEAL,
  get_my_notes:       "#3b82f6",
  create_blog_draft:  PURPLE,
};

function useIsDark() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.dataset.theme !== "light");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="an-kpi-card">
      <div className="an-kpi-accent" />
      <div className="an-kpi-value">{value}</div>
      <div className="an-kpi-label">{label}</div>
      {sub && <div className="an-kpi-delta an-kpi-delta--up"><span className="an-kpi-delta-label">{sub}</span></div>}
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

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="an-kpi-row">
        {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />)}
      </div>
      {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 14 }} />)}
    </div>
  );
}

const dateFmt = (d: string) => {
  const dt = new Date(d + "T00:00:00");
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
};

function toolLabel(tool: string) {
  if (tool === "none") return "Chat only";
  if (tool === "save_note") return "Save Note";
  if (tool === "get_my_notes") return "Get Notes";
  if (tool === "create_blog_draft") return "Blog Draft";
  return tool;
}

export function AIUsageTab() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useAIUsage(days);
  const isDark = useIsDark();

  const tooltipStyle = isDark
    ? { contentStyle: { background: "#1a0f35", border: "1px solid #2d1f4e", borderRadius: 8, fontSize: 12 }, itemStyle: { color: "#e9d5ff" } }
    : { contentStyle: { background: "#fff", border: "1px solid #ddd6fe", borderRadius: 8, fontSize: 12 }, itemStyle: { color: "#4c1d95" } };

  const gridStroke = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const tickColor  = isDark ? "#6b7280" : "#9ca3af";

  if (isLoading) return <Skeleton />;
  if (isError || !data) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
      Failed to load AI usage data. Make sure the migration has been applied.
    </div>
  );

  const { totalMessages, totalCost, totalTokens, uniqueUsers, dailySeries, toolBreakdown, topPages } = data;
  const avgCostPerMsg = totalMessages > 0 ? (totalCost / totalMessages * 100).toFixed(3) : "0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Range selector */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Range:</span>
        {[7, 14, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
              background: days === d ? PURPLE : "transparent",
              color: days === d ? "#fff" : "var(--text-muted)",
              border: `1px solid ${days === d ? PURPLE : "var(--border)"}`,
            }}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="an-kpi-row">
        <KpiCard label="Total Messages"  value={totalMessages.toLocaleString()} sub={`last ${days} days`} />
        <KpiCard label="Total Cost"      value={`$${totalCost.toFixed(4)}`}     sub="USD" />
        <KpiCard label="Avg Cost / Msg"  value={`${avgCostPerMsg}¢`}            sub="cents" />
        <KpiCard label="Active AI Users" value={uniqueUsers.toLocaleString()}   sub="unique users" />
        <KpiCard label="Total Tokens"    value={totalTokens.toLocaleString()}   sub="in + out" />
      </div>

      {/* Messages per day */}
      <ChartCard title="Messages per Day">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailySeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="aiMsgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={PURPLE} stopOpacity={0.3} />
                <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" tickFormatter={dateFmt} tick={{ fill: tickColor, fontSize: 11 }} />
            <YAxis tick={{ fill: tickColor, fontSize: 11 }} allowDecimals={false} />
            <Tooltip {...tooltipStyle} labelFormatter={(d: unknown) => dateFmt(String(d))} formatter={(v: unknown) => [`${v}`, "messages"]} />
            <Area type="monotone" dataKey="count" stroke={PURPLE} fill="url(#aiMsgGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Cost per day */}
      <ChartCard title="Cost per Day (USD)">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={dailySeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="aiCostGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={AMBER} stopOpacity={0.3} />
                <stop offset="95%" stopColor={AMBER} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" tickFormatter={dateFmt} tick={{ fill: tickColor, fontSize: 11 }} />
            <YAxis tick={{ fill: tickColor, fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <Tooltip {...tooltipStyle} labelFormatter={(d: unknown) => dateFmt(String(d))} formatter={(v: unknown) => [`$${v}`, "cost"]} />
            <Area type="monotone" dataKey="cost" stroke={AMBER} fill="url(#aiCostGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Tool usage breakdown */}
        <ChartCard title="Tool Usage">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={toolBreakdown} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="tool" tickFormatter={toolLabel} tick={{ fill: tickColor, fontSize: 11 }} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} allowDecimals={false} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown) => [`${v}`, "messages"]} labelFormatter={(t: unknown) => toolLabel(String(t))} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {toolBreakdown.map(({ tool }) => (
                  <Cell key={tool} fill={TOOL_COLORS[tool] ?? PURPLE} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top pages */}
        <ChartCard title="Top Pages (where AI is used)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topPages} layout="vertical" margin={{ top: 4, right: 16, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis type="number" tick={{ fill: tickColor, fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="page" tick={{ fill: tickColor, fontSize: 11 }} width={60} />
              <Tooltip {...tooltipStyle} formatter={(v: unknown) => [`${v}`, "messages"]} />
              <Bar dataKey="count" fill={TEAL} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
