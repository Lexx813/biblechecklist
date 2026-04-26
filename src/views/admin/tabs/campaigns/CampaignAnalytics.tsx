import { useState } from "react";
import {
  useCampaign, useCampaignStats, useCampaignTimeline, useCampaignSends,
} from "../../../../hooks/useCampaigns";
import { buildSegmentSummary } from "../../../../api/campaigns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useChartTheme, BarGradient } from "../../../../components/charts";

function pct(num: number, den: number) {
  if (!den) return "—";
  return `${Math.round((num / den) * 100)}%`;
}

const STATUS_COLORS: Record<string, string> = {
  sent:         "bg-gray-700 text-gray-300",
  delivered:    "bg-blue-900/50 text-blue-300",
  opened:       "bg-green-900/50 text-green-300",
  clicked:      "bg-purple-900/50 text-purple-300",
  bounced:      "bg-orange-900/50 text-orange-300",
  unsubscribed: "bg-red-900/50 text-red-300",
};

function TimelineChart({ data }: { data: Array<{ date: string; opens: number; clicks: number }> }) {
  const t = useChartTheme();
  if (!data.length) {
    return <p className="text-center text-gray-500 py-10 text-sm">No event data yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="22%">
        <defs>
          <BarGradient id="opensGrad" color="#16a34a" highlight="#86efac" />
          <BarGradient id="clicksGrad" color="#7c3aed" highlight="#a78bfa" />
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={d => String(d).slice(5)}
          tick={{ fill: t.tick, fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis tick={{ fill: t.tick, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
        <Tooltip
          cursor={t.tooltip.cursor}
          contentStyle={t.tooltip.contentStyle}
          itemStyle={t.tooltip.itemStyle}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
          formatter={(v: string) => <span style={{ color: t.tick }}>{v}</span>}
        />
        <Bar dataKey="opens" name="Opens" fill="url(#opensGrad)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
        <Bar dataKey="clicks" name="Clicks" fill="url(#clicksGrad)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface Props {
  campaignId: string;
  onBack:     () => void;
}

export function CampaignAnalytics({ campaignId, onBack }: Props) {
  const { data: campaign }          = useCampaign(campaignId);
  const { data: stats }             = useCampaignStats(campaignId);
  const { data: timeline = [] }     = useCampaignTimeline(campaignId);
  const [sendsPage, setSendsPage]   = useState(0);
  const { data: sends = [] }        = useCampaignSends(campaignId, sendsPage);
  const [statusFilter, setStatusFilter] = useState("all");

  const totalSent = stats?.sent ?? 0;

  const kpis = [
    { label: "Sent",         value: totalSent.toLocaleString() },
    { label: "Open Rate",    value: pct(stats?.opened ?? 0, totalSent) },
    { label: "Click Rate",   value: pct(stats?.clicked ?? 0, totalSent) },
    { label: "Unsubscribed", value: String(stats?.unsubscribed ?? 0) },
  ];

  const filteredSends = statusFilter === "all"
    ? sends
    : sends.filter(s => s.status === statusFilter);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{campaign?.name ?? "Analytics"}</h2>
          {campaign && (
            <p className="text-xs text-gray-500 mt-0.5">{buildSegmentSummary(campaign.segment_config)}</p>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k, i) => {
          const accent = ["#7c3aed", "#16a34a", "#a855f7", "#f87171"][i] ?? "#7c3aed";
          return (
            <div
              key={k.label}
              className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-linear-to-br dark:from-[#1a0f35] dark:to-[#120b28] p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(124,58,237,0.18)]"
            >
              <span
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: `linear-gradient(90deg, ${accent}, ${accent}66)` }}
              />
              <p
                className="text-2xl font-bold tabular-nums tracking-tight bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(180deg, color-mix(in srgb, ${accent} 30%, #fff) 0%, ${accent} 100%)` }}
              >
                {k.value}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-white/50 mt-1 font-semibold">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Timeline chart */}
      <div className="rounded-xl border border-gray-200 dark:border-[#2d1f4e] bg-white dark:bg-linear-to-br dark:from-[#1a0f35] dark:to-[#120b28] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-violet-200">Opens &amp; Clicks Over Time</h3>
        </div>
        <TimelineChart data={timeline} />
      </div>

      {/* Per-user table */}
      <div className="bg-white dark:bg-white/4 border border-gray-200 dark:border-white/8 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/8">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recipients</h3>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-100 dark:bg-white/6 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-gray-700 dark:text-white focus:outline-none"
          >
            <option value="all">All statuses</option>
            {["sent", "delivered", "opened", "clicked", "bounced", "unsubscribed"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/5">
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">User</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Status</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Sent</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Opened</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Clicked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {filteredSends.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                <td className="px-4 py-2.5">
                  <p className="text-gray-900 dark:text-white text-xs font-medium">{s.profiles?.display_name ?? "—"}</p>
                  <p className="text-gray-500 text-xs">{s.profiles?.email}</p>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status]}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                  {s.sent_at ? new Date(s.sent_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                  {s.opened_at ? new Date(s.opened_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                  {s.clicked_at ? new Date(s.clicked_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {filteredSends.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-600 text-sm">
                  No recipients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-white/8">
          <button
            disabled={sendsPage === 0}
            onClick={() => setSendsPage(p => p - 1)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-500">Page {sendsPage + 1}</span>
          <button
            disabled={sends.length < 50}
            onClick={() => setSendsPage(p => p + 1)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
