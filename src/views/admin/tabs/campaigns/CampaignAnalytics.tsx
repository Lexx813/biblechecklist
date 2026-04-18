import { useState } from "react";
import {
  useCampaign, useCampaignStats, useCampaignTimeline, useCampaignSends,
} from "../../../../hooks/useCampaigns";
import { buildSegmentSummary } from "../../../../api/campaigns";

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

function SvgBarChart({ data }: { data: Array<{ date: string; opens: number; clicks: number }> }) {
  if (!data.length) {
    return <p className="text-center text-gray-600 py-8 text-sm">No event data yet</p>;
  }

  const maxVal = Math.max(...data.flatMap(d => [d.opens, d.clicks]), 1);
  const W = 480, H = 120, PAD = 8;
  const slotW = (W - PAD * 2) / data.length;
  const barW  = Math.max(4, slotW / 2.5);

  function y(v: number) {
    return H - PAD - (v / maxVal) * (H - PAD * 2);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Opens and clicks timeline">
      {data.map((d, i) => {
        const x = PAD + i * slotW;
        return (
          <g key={d.date}>
            <rect x={x} y={y(d.opens)} width={barW} height={H - PAD - y(d.opens)} fill="#22c55e" fillOpacity={0.7} rx={2}>
              <title>{d.date}: {d.opens} opens</title>
            </rect>
            <rect x={x + barW + 2} y={y(d.clicks)} width={barW} height={H - PAD - y(d.clicks)} fill="#a855f7" fillOpacity={0.7} rx={2}>
              <title>{d.date}: {d.clicks} clicks</title>
            </rect>
            <text x={x + barW / 2} y={H - 1} fontSize={8} fill="#6b7280" textAnchor="middle">
              {d.date.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
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
          className="p-2 rounded-lg hover:bg-white/8 text-gray-400 hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">{campaign?.name ?? "Analytics"}</h2>
          {campaign && (
            <p className="text-xs text-gray-500 mt-0.5">{buildSegmentSummary(campaign.segment_config)}</p>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white/4 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Timeline chart */}
      <div className="bg-white/4 border border-white/8 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Opens &amp; Clicks Over Time</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-500 opacity-70 inline-block" /> Opens
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 opacity-70 inline-block" /> Clicks
            </span>
          </div>
        </div>
        <SvgBarChart data={timeline} />
      </div>

      {/* Per-user table */}
      <div className="bg-white/4 border border-white/8 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <h3 className="text-sm font-semibold text-white">Recipients</h3>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white/6 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
          >
            <option value="all">All statuses</option>
            {["sent", "delivered", "opened", "clicked", "bounced", "unsubscribed"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">User</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Status</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Sent</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Opened</th>
              <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Clicked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredSends.map(s => (
              <tr key={s.id} className="hover:bg-white/3 transition-colors">
                <td className="px-4 py-2.5">
                  <p className="text-white text-xs font-medium">{s.profiles?.display_name ?? "—"}</p>
                  <p className="text-gray-500 text-xs">{s.profiles?.email}</p>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[s.status]}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-400">
                  {s.sent_at ? new Date(s.sent_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-400">
                  {s.opened_at ? new Date(s.opened_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-400">
                  {s.clicked_at ? new Date(s.clicked_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {filteredSends.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-600 text-sm">
                  No recipients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/8">
          <button
            disabled={sendsPage === 0}
            onClick={() => setSendsPage(p => p - 1)}
            className="text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-500">Page {sendsPage + 1}</span>
          <button
            disabled={sends.length < 50}
            onClick={() => setSendsPage(p => p + 1)}
            className="text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
