import { useState } from "react";
import { useUsers } from "../../../../hooks/useAdmin";
import { useDistinctTags } from "../../../../hooks/useCampaigns";
import { campaignApi } from "../../../../api/campaigns";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  currentUserId: string;
}

export function UserTagsManager({ currentUserId }: Props) {
  const { data: users = [] }    = useUsers();
  const { data: allTags = [] }  = useDistinctTags();
  const queryClient             = useQueryClient();

  const [search,     setSearch]     = useState("");
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [userTags,   setUserTags]   = useState<Record<string, string[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newTag,     setNewTag]     = useState("");
  const [bulkTag,    setBulkTag]    = useState("");
  const [bulkMode,   setBulkMode]   = useState<"add" | "remove">("add");

  const filtered = (users as Array<{ id: string; display_name?: string | null; email?: string }>)
    .filter(u =>
      (u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
       u.email?.toLowerCase().includes(search.toLowerCase()))
    );

  async function loadTagsForUser(userId: string) {
    if (userTags[userId] !== undefined) return;
    const tags = await campaignApi.listUserTags(userId);
    setUserTags(prev => ({ ...prev, [userId]: tags }));
  }

  async function addTag(userId: string, tag: string) {
    if (!tag.trim()) return;
    await campaignApi.addUserTag(userId, tag.trim().toLowerCase(), currentUserId);
    setUserTags(prev => ({
      ...prev,
      [userId]: [...new Set([...(prev[userId] ?? []), tag.trim().toLowerCase()])],
    }));
    setNewTag("");
    queryClient.invalidateQueries({ queryKey: ["distinctTags"] });
  }

  async function removeTag(userId: string, tag: string) {
    await campaignApi.removeUserTag(userId, tag);
    setUserTags(prev => ({ ...prev, [userId]: (prev[userId] ?? []).filter(t => t !== tag) }));
    queryClient.invalidateQueries({ queryKey: ["distinctTags"] });
  }

  async function applyBulkTag() {
    if (!bulkTag.trim() || !selected.size) return;
    const tag = bulkTag.trim().toLowerCase();
    for (const uid of selected) {
      if (bulkMode === "add") await campaignApi.addUserTag(uid, tag, currentUserId);
      else await campaignApi.removeUserTag(uid, tag);
    }
    queryClient.invalidateQueries({ queryKey: ["distinctTags"] });
    setBulkTag("");
    setSelected(new Set());
  }

  function toggleSelect(userId: string) {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(userId) ? s.delete(userId) : s.add(userId);
      return s;
    });
  }

  function toggleExpand(userId: string) {
    if (expandedId === userId) {
      setExpandedId(null);
    } else {
      setExpandedId(userId);
      loadTagsForUser(userId);
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">User Tags</h2>
        <p className="text-sm text-gray-500 mt-0.5">Assign custom labels for targeted campaign segmentation.</p>
      </div>

      {/* Tag summary */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map(({ tag, count }) => (
            <span
              key={tag}
              className="flex items-center gap-1.5 bg-purple-900/30 border border-purple-700/30 text-purple-300 text-xs px-2.5 py-1 rounded-full"
            >
              {tag}
              <span className="bg-purple-700/40 text-purple-200 text-[10px] px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-purple-900/20 border border-purple-700/30 rounded-xl px-4 py-3 flex-wrap">
          <span className="text-sm text-purple-300 font-medium">{selected.size} selected</span>
          <div className="flex gap-1">
            {(["add", "remove"] as const).map(m => (
              <button
                key={m}
                onClick={() => setBulkMode(m)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  bulkMode === m ? "bg-purple-600 text-white" : "bg-white/8 text-gray-400 hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <input
            value={bulkTag}
            onChange={e => setBulkTag(e.target.value)}
            placeholder="tag name"
            list="existing-tags"
            className="flex-1 min-w-[120px] bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <datalist id="existing-tags">
            {allTags.map(({ tag }) => <option key={tag} value={tag} />)}
          </datalist>
          <button
            onClick={applyBulkTag}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="px-3 py-1.5 bg-white/8 hover:bg-white/12 text-gray-400 text-xs rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search users by name or email…"
        className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
      />

      {/* User list */}
      <div className="space-y-1">
        {filtered.slice(0, 50).map(u => (
          <div
            key={u.id}
            className={`rounded-xl border transition-colors ${
              expandedId === u.id
                ? "border-purple-700/40 bg-purple-900/10"
                : "border-white/6 bg-white/3 hover:border-white/10"
            }`}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              onClick={() => { toggleSelect(u.id); toggleExpand(u.id); }}
            >
              <input
                type="checkbox"
                checked={selected.has(u.id)}
                readOnly
                className="accent-purple-500 w-3.5 h-3.5 cursor-pointer flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{u.display_name ?? "—"}</p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>
              {(userTags[u.id] ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                  {(userTags[u.id] ?? []).map(tag => (
                    <span key={tag} className="text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Expanded tag editor */}
            {expandedId === u.id && (
              <div className="px-4 pb-3 border-t border-white/6 pt-3">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(userTags[u.id] ?? []).map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 bg-purple-900/30 text-purple-300 text-xs px-2 py-0.5 rounded-full"
                    >
                      {tag}
                      <button
                        onClick={e => { e.stopPropagation(); removeTag(u.id, tag); }}
                        className="hover:text-red-400 transition-colors leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {!userTags[u.id]?.length && (
                    <span className="text-xs text-gray-600">No tags yet</span>
                  )}
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <input
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addTag(u.id, newTag)}
                    placeholder="Add tag…"
                    list="existing-tags"
                    className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => addTag(u.id, newTag)}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-600 py-8 text-sm">No users found</p>
        )}
      </div>
    </div>
  );
}
