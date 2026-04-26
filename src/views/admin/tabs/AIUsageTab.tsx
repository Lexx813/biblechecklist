import { useState } from "react";
import { useAIUsage } from "../../../hooks/useAdmin";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  useChartTheme, KpiCard, ChartCard, RichTooltip,
  AreaGradient, BarGradient, Glow,
} from "../../../components/charts";

const PURPLE = "#7c3aed";
const TEAL   = "#0d9488";
const AMBER  = "#d97706";

const TOOL_COLORS: Record<string, string> = {
  none:               "#6b7280",
  save_note:          TEAL,
  get_my_notes:       "#3b82f6",
  create_blog_draft:  PURPLE,
};

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="an-kpi-row">
        {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />)}
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

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

function summarize(series: Array<Record<string, unknown>>, key: string) {
  if (!series || series.length === 0) return { value: 0, deltaPct: null as number | null };
  const last = Number(series[series.length - 1][key] ?? 0);
  const priorCount = Math.min(7, series.length - 1);
  if (priorCount === 0) return { value: last, deltaPct: null };
  const priorAvg =
    series.slice(-1 - priorCount, -1).reduce((s, r) => s + Number(r[key] ?? 0), 0) / priorCount;
  return { value: last, deltaPct: pctDelta(last, priorAvg) };
}

export function AIUsageTab() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useAIUsage(days);
  const t = useChartTheme();

  if (isLoading) return <Skeleton />;
  if (isError || !data) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
      Failed to load AI usage data. Make sure the migration has been applied.
    </div>
  );

  const { totalMessages, totalCost, totalTokens, uniqueUsers, dailySeries, toolBreakdown, topPages, topUsers } = data;
  const avgCostPerMsg = totalMessages > 0 ? (totalCost / totalMessages * 100) : 0;

  const msgsLatest = summarize(dailySeries as unknown as Array<Record<string, unknown>>, "count");
  const costLatest = summarize(dailySeries as unknown as Array<Record<string, unknown>>, "cost");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Range selector */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Range:</span>
        {[7, 14, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              padding: "5px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer", fontWeight: 600,
              background: days === d
                ? `linear-gradient(135deg, ${PURPLE}, ${"#a78bfa"})`
                : "transparent",
              color: days === d ? "#fff" : "var(--text-muted)",
              border: `1px solid ${days === d ? "transparent" : "var(--border)"}`,
              boxShadow: days === d ? `0 4px 14px ${PURPLE}40` : "none",
              transition: "all 180ms ease",
            }}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="an-kpi-row">
        <KpiCard
          label="Total Messages"
          value={totalMessages}
          deltaLabel={`last ${days} days`}
          accent={PURPLE}
          spark={dailySeries.slice(-14).map(d => d.count)}
        />
        <KpiCard
          label="Total Cost"
          value={`$${totalCost.toFixed(4)}`}
          deltaLabel="USD"
          accent={AMBER}
          spark={dailySeries.slice(-14).map(d => d.cost)}
        />
        <KpiCard
          label="Avg Cost / Msg"
          value={avgCostPerMsg}
          format={n => `${n.toFixed(3)}¢`}
          deltaLabel="cents"
          accent={"#fbbf24"}
        />
        <KpiCard
          label="Active AI Users"
          value={uniqueUsers}
          deltaLabel="unique users"
          accent={TEAL}
        />
        <KpiCard
          label="Total Tokens"
          value={totalTokens}
          deltaLabel="in + out"
          accent={"#3b82f6"}
        />
      </div>

      {/* Messages per day */}
      <ChartCard
        title="Messages per Day"
        latest={{ value: msgsLatest.value, label: "today", deltaPct: msgsLatest.deltaPct }}
      >
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailySeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <AreaGradient id="aiMsgGrad" color={PURPLE} />
              <Glow id="aiMsgGlow" stdDeviation={2.4} />
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
            <XAxis dataKey="date" tickFormatter={dateFmt} tick={{ fill: t.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: t.tick, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
            <Tooltip
              cursor={t.tooltip.cursor}
              content={<RichTooltip series={dailySeries as unknown as Array<Record<string, unknown>>} valueLabel="messages" labelFormatter={(d) => dateFmt(String(d))} />}
            />
            <Area
              type="monotone" dataKey="count" stroke={PURPLE} fill="url(#aiMsgGrad)"
              strokeWidth={2.2} dot={false}
              style={{ filter: "url(#aiMsgGlow)" }}
              isAnimationActive
              animationDuration={900}
              activeDot={{ r: 5, fill: "#a78bfa", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Cost per day */}
      <ChartCard
        title="Cost per Day (USD)"
        latest={{
          value: `$${(costLatest.value as number).toFixed(4)}`,
          label: "today",
          deltaPct: costLatest.deltaPct,
        }}
      >
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={dailySeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <AreaGradient id="aiCostGrad" color={AMBER} />
              <Glow id="aiCostGlow" stdDeviation={2.4} />
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
            <XAxis dataKey="date" tickFormatter={dateFmt} tick={{ fill: t.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: t.tick, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={44} />
            <Tooltip
              cursor={t.tooltip.cursor}
              content={<RichTooltip series={dailySeries as unknown as Array<Record<string, unknown>>} valueLabel="USD" valueFormatter={v => `$${v.toFixed(4)}`} labelFormatter={(d) => dateFmt(String(d))} />}
            />
            <Area
              type="monotone" dataKey="cost" stroke={AMBER} fill="url(#aiCostGrad)"
              strokeWidth={2.2} dot={false}
              style={{ filter: "url(#aiCostGlow)" }}
              isAnimationActive
              animationDuration={900}
              activeDot={{ r: 5, fill: "#fbbf24", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="an-chart-grid">
        {/* Tool usage breakdown */}
        <ChartCard title="Tool Usage">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={toolBreakdown} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                {toolBreakdown.map(({ tool }) => {
                  const c = TOOL_COLORS[tool] ?? PURPLE;
                  return (
                    <BarGradient
                      key={`tool-${tool}`}
                      id={`toolGrad-${tool}`}
                      color={c}
                      highlight={c}
                    />
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
              <XAxis dataKey="tool" tickFormatter={toolLabel} tick={{ fill: t.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: t.tick, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
              <Tooltip
                cursor={t.tooltip.cursor}
                contentStyle={t.tooltip.contentStyle}
                itemStyle={t.tooltip.itemStyle}
                formatter={(v: unknown) => [`${v}`, "messages"]}
                labelFormatter={(t: unknown) => toolLabel(String(t))}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={900}>
                {toolBreakdown.map(({ tool }) => (
                  <Cell key={tool} fill={`url(#toolGrad-${tool})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top pages */}
        <ChartCard title="Top Pages (where AI is used)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topPages} layout="vertical" margin={{ top: 4, right: 16, left: 40, bottom: 0 }}>
              <defs>
                <linearGradient id="pageGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#5eead4" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} horizontal={false} />
              <XAxis type="number" tick={{ fill: t.tick, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="page" tick={{ fill: t.tick, fontSize: 11 }} width={60} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={t.tooltip.cursor}
                contentStyle={t.tooltip.contentStyle}
                itemStyle={t.tooltip.itemStyle}
                formatter={(v: unknown) => [`${v}`, "messages"]}
              />
              <Bar dataKey="count" fill="url(#pageGrad)" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top users by spend */}
      {topUsers && topUsers.length > 0 && (
        <ChartCard title="Top Users by AI Spend (last 30 days)">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.grid}`, textAlign: "left" }}>
                  <th style={{ padding: "8px 12px", color: t.tick, fontWeight: 600 }}>User</th>
                  <th style={{ padding: "8px 12px", color: t.tick, fontWeight: 600, textAlign: "right" }}>Messages</th>
                  <th style={{ padding: "8px 12px", color: t.tick, fontWeight: 600, textAlign: "right" }}>Tokens</th>
                  <th style={{ padding: "8px 12px", color: t.tick, fontWeight: 600, textAlign: "right" }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((u) => (
                  <tr key={u.user_id} style={{ borderBottom: `1px solid ${t.grid}` }}>
                    <td style={{ padding: "8px 12px" }}>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      {u.email && u.email !== u.name && (
                        <div style={{ fontSize: 11, color: t.tick, marginTop: 2 }}>{u.email}</div>
                      )}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{u.messages.toLocaleString()}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{u.tokens.toLocaleString()}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: u.cost > 1 ? AMBER : undefined, fontWeight: u.cost > 1 ? 700 : 400 }}>${u.cost.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
    </div>
  );
}
