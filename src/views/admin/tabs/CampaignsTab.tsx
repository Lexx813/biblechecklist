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
    <div>
      {showSubTabs && (
        <div className="flex gap-1 px-6 pt-4 border-b border-white/6">
          {(["list", "tags"] as const).map(t => (
            <button
              key={t}
              onClick={() => setView(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                view === t
                  ? "text-white border-b-2 border-purple-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {t === "list" ? "Campaigns" : "User Tags"}
            </button>
          ))}
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
