"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  const [pendingDelete, setPendingDelete] = useState<Conversation | null>(null);

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
                    onClick={() => setPendingDelete(c)}
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

      <DeleteConfirmDialog
        conversation={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={(id) => {
          setPendingDelete(null);
          onDelete(id);
        }}
      />
    </>
  );
}

// ── Delete confirmation modal ───────────────────────────────────────────
function DeleteConfirmDialog({
  conversation,
  onCancel,
  onConfirm,
}: {
  conversation: Conversation | null;
  onCancel: () => void;
  onConfirm: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Esc to dismiss
  useEffect(() => {
    if (!conversation) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm(conversation.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [conversation, onCancel, onConfirm]);

  if (!mounted || !conversation) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-conv-title"
      className="ai-app fixed inset-0 z-100 flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm dark:bg-black/60"
      />

      {/* Card */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#160f2e]">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="delete-conv-title" className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Delete this conversation?
              </h2>
              <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
                &ldquo;{conversation.title}&rdquo;
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                This can&rsquo;t be undone. The messages will be permanently removed.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 dark:border-white/5 dark:bg-white/2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(conversation.id)}
            autoFocus
            className="inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#160f2e]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
