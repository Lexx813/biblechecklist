import { useState } from "react";
import { useCampaigns, useDeleteCampaign, useDuplicateCampaign } from "../../../../hooks/useCampaigns";
import { buildSegmentSummary } from "../../../../api/campaigns";

const STATUS_STYLES: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  scheduled: "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300",
  sending:   "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  sent:      "bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  recurring: "bg-purple-50 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
};

const TYPE_STYLES: Record<string, string> = {
  broadcast:  "bg-purple-100 text-purple-700 dark:bg-[#1e1040] dark:text-purple-300",
  newsletter: "bg-blue-100 text-blue-700 dark:bg-[#0e1e30] dark:text-blue-300",
  sequence:   "bg-green-100 text-green-700 dark:bg-[#0e2010] dark:text-green-300",
};

interface Props {
  onEdit:      (id: string) => void;
  onAnalytics: (id: string) => void;
  onNew:       () => void;
}

export function CampaignList({ onEdit, onAnalytics, onNew }: Props) {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const deleteCampaign    = useDeleteCampaign();
  const duplicateCampaign = useDuplicateCampaign();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Email Campaigns</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onNew}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-purple-900/20"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Campaign
        </button>
      </div>

      {campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/30 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-500 dark:text-purple-400">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <p className="text-gray-900 dark:text-white font-semibold text-base">No campaigns yet</p>
          <p className="text-sm text-gray-500 mt-1.5 max-w-xs">Create your first broadcast to start reaching your users.</p>
          <button
            onClick={onNew}
            className="mt-5 flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Campaign
          </button>
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-white/8 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/8">
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Campaign</th>
                <th className="text-left px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Segment</th>
                <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Sent</th>
                <th className="text-center px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                <th className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {campaigns.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[c.type]}`}>
                        {c.type}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">{c.name}</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[280px]">{c.subject}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[180px]">
                    <span className="truncate block">{buildSegmentSummary(c.segment_config)}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-900 dark:text-white font-medium">
                    {c.sent_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {c.status === "draft" && (
                        <button
                          onClick={() => onEdit(c.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                          title="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => onAnalytics(c.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                        title="Analytics"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                      </button>
                      <button
                        onClick={() => duplicateCampaign.mutate(c.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                        title="Duplicate"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                      {confirmDelete === c.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { deleteCampaign.mutate(c.id); setConfirmDelete(null); }}
                            className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-600 dark:text-gray-300 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(c.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/40 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
