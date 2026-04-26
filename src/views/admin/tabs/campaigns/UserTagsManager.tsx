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
      !search ||
      u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
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
    <div className="p-6 space-y-4">

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Tags</h2>
        <p className="text-sm text-gray-500 mt-0.5">Assign custom labels for targeted campaign segmentation.</p>
      </div>

      {/* Tag cloud */}
      {allTags.length > 0 && (
        <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">All Tags</span>
            <span className="text-xs text-gray-400 dark:text-gray-600">{allTags.length} tag{allTags.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="px-5 py-4 flex flex-wrap gap-2">
            {allTags.map(({ tag, count }) => (
              <span
                key={tag}
                className="flex items-center gap-1.5 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/30 text-purple-700 dark:text-purple-300 text-xs px-2.5 py-1 rounded-full"
              >
                {tag}
                <span className="bg-purple-200 dark:bg-purple-700/40 text-purple-700 dark:text-purple-200 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Users card */}
      <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Users</span>
          {selected.size > 0 && (
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-300">{selected.size} selected</span>
          )}
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-700/20 px-5 py-3 flex-wrap">
            <div className="flex gap-1">
              {(["add", "remove"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setBulkMode(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    bulkMode === m
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
              className="flex-1 min-w-30 bg-white dark:bg-white/6 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 transition-colors"
            />
            <datalist id="existing-tags">
              {allTags.map(({ tag }) => <option key={tag} value={tag} />)}
            </datalist>
            <button
              onClick={applyBulkTag}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/12 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-white/8">
          <div className="relative">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users by name or email…"
              className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500/70 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* User list */}
        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {filtered.slice(0, 50).map(u => (
            <div
              key={u.id}
              className={`transition-colors ${
                expandedId === u.id
                  ? "bg-purple-50 dark:bg-purple-900/10"
                  : "hover:bg-gray-50 dark:hover:bg-white/2"
              }`}
            >
              <div
                className="flex items-center gap-3 px-5 py-3 cursor-pointer"
                onClick={() => { toggleSelect(u.id); toggleExpand(u.id); }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(u.id)}
                  readOnly
                  className="accent-purple-500 w-3.5 h-3.5 cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.display_name ?? "-"}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                {(userTags[u.id] ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-end max-w-50">
                    {(userTags[u.id] ?? []).map(tag => (
                      <span key={tag} className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${expandedId === u.id ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded tag editor */}
              {expandedId === u.id && (
                <div className="px-5 pb-4 pt-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.015]">
                  <div className="flex flex-wrap gap-1.5 mb-3 min-h-6">
                    {(userTags[u.id] ?? []).map(tag => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/30 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full"
                      >
                        {tag}
                        <button
                          onClick={e => { e.stopPropagation(); removeTag(u.id, tag); }}
                          className="hover:text-red-500 transition-colors leading-none ml-0.5"
                          aria-label={`Remove ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {!userTags[u.id]?.length && (
                      <span className="text-xs text-gray-400 dark:text-gray-600 italic">No tags yet</span>
                    )}
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <input
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addTag(u.id, newTag)}
                      placeholder="Add tag…"
                      list="existing-tags"
                      className="flex-1 bg-white dark:bg-white/6 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 transition-colors"
                    />
                    <button
                      onClick={() => addTag(u.id, newTag)}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 dark:text-gray-600 py-10 text-sm">No users found</p>
          )}
        </div>
      </div>
    </div>
  );
}
