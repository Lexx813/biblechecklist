import { useState } from "react";
import { CampaignList }      from "./campaigns/CampaignList";
import { CampaignEditor }    from "./campaigns/CampaignEditor";
import { CampaignAnalytics } from "./campaigns/CampaignAnalytics";
import { UserTagsManager }   from "./campaigns/UserTagsManager";

type View = "list" | "editor" | "analytics" | "tags";

interface Props {
  currentUserId: string;
}

export function CampaignsTab({ currentUserId }: Props) {
  const [view,        setView]        = useState<View>("list");
  const [editId,      setEditId]      = useState<string | null>(null);
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);

  const showSubTabs = view === "list" || view === "tags";

  return (
    <div className="min-h-full dark:bg-[#0e0e18]">
      {showSubTabs && (
        <div className="flex items-center gap-1 px-5 pt-4 pb-0 border-b border-gray-200 dark:border-white/8">
          {(["list", "tags"] as const).map(t => {
            const active = view === t;
            return (
              <button
                key={t}
                onClick={() => setView(t)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-all border-0 outline-none cursor-pointer bg-transparent ${
                  active
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {t === "list" ? "Campaigns" : "User Tags"}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {view === "list" && (
        <CampaignList
          onEdit={id => { setEditId(id); setView("editor"); }}
          onAnalytics={id => { setAnalyticsId(id); setView("analytics"); }}
          onNew={() => { setEditId(null); setView("editor"); }}
        />
      )}
      {view === "editor" && (
        <CampaignEditor
          campaignId={editId}
          currentUserId={currentUserId}
          onBack={() => setView("list")}
          onSent={() => setView("list")}
        />
      )}
      {view === "analytics" && analyticsId && (
        <CampaignAnalytics
          campaignId={analyticsId}
          onBack={() => setView("list")}
        />
      )}
      {view === "tags" && (
        <UserTagsManager currentUserId={currentUserId} />
      )}
    </div>
  );
}
