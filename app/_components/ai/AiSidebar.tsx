"use client";

import { useState } from "react";

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  drawerOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

function formatDate(s: string): string {
  const d = new Date(s);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  const week = Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  if (week) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AiSidebar({
  conversations, activeId, drawerOpen, onClose, onSelect, onDelete, onRename,
}: Props) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  const startRename = (c: Conversation) => {
    setRenamingId(c.id);
    setRenameDraft(c.title);
  };
  const commitRename = () => {
    if (renamingId && renameDraft.trim()) {
      onRename(renamingId, renameDraft.trim());
    }
    setRenamingId(null);
  };

  const list = (
    <ul className="space-y-1">
      {conversations.length === 0 && (
        <li className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
          No conversations yet. Start a new chat to begin.
        </li>
      )}
      {conversations.map((c) => {
        const isActive = c.id === activeId;
        const isRenaming = c.id === renamingId;
        return (
          <li key={c.id}>
            <div
              className={`group flex items-center gap-2 rounded-md px-2.5 py-2 ${
                isActive
                  ? "bg-violet-50 text-violet-900 dark:bg-violet-900/30 dark:text-violet-100"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
              }`}
            >
              {isRenaming ? (
                <input
                  className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-white/10 dark:bg-white/5"
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className="flex-1 truncate text-left text-sm font-medium"
                  title={c.title}
                >
                  {c.title}
                </button>
              )}

              {!isRenaming && (
                <span className="hidden text-[11px] tabular-nums text-slate-400 group-hover:hidden lg:inline-block">
                  {formatDate(c.updated_at)}
                </span>
              )}

              {!isRenaming && (
                <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => startRename(c)}
                    className="inline-flex size-6 items-center justify-center rounded text-slate-500 hover:bg-white hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-slate-100"
                    aria-label="Rename"
                    title="Rename"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${c.title}"?`)) onDelete(c.id);
                    }}
                    className="inline-flex size-6 items-center justify-center rounded text-slate-500 hover:bg-white hover:text-red-600 dark:hover:bg-white/10"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close conversation list"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar (≥lg always visible; drawer below) */}
      <aside
        className={`${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 top-0 z-50 mt-[3.25rem] flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:mt-0 lg:translate-x-0 dark:border-white/10 dark:bg-[#160f2e]`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-white/10">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Conversations
          </span>
          <span className="text-[11px] tabular-nums text-slate-400">{conversations.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2">{list}</div>
      </aside>
    </>
  );
}
