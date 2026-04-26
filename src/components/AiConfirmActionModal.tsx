import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { notesApi } from "../api/notes";
import { toast } from "../lib/toast";

// Hard confirmation gate for destructive AI actions.
// The server emits a `confirm_action` SSE event INSTEAD of executing the
// destructive tool. This modal listens for that event, shows the user
// what will happen, and only performs the action on a real click.
// Bypasses the AI entirely, the model has no way to confirm itself.

interface ConfirmDetail {
  action: "delete_note";
  note_id: string;
  ref: string;
  preview: string;
}

export default function AiConfirmActionModal() {
  const [pending, setPending] = useState<ConfirmDetail | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onConfirm(e: Event) {
      const detail = (e as CustomEvent<ConfirmDetail>).detail;
      if (!detail || !detail.action) return;
      setPending(detail);
    }
    window.addEventListener("ai:confirm-action", onConfirm as EventListener);
    return () => window.removeEventListener("ai:confirm-action", onConfirm as EventListener);
  }, []);

  useEffect(() => {
    if (!pending) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPending(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending]);

  if (!pending) return null;

  async function handleConfirm() {
    if (!pending || busy) return;
    setBusy(true);
    try {
      if (pending.action === "delete_note") {
        await notesApi.delete(pending.note_id);
        toast.success("Note deleted.");
      }
      setPending(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  const labels = {
    delete_note: { title: "Delete this note?", warn: "This can't be undone.", action: "Delete" },
  }[pending.action];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-confirm-title"
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="Cancel"
        onClick={() => setPending(null)}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm dark:bg-black/60"
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#160f2e]">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-start gap-3">
            <span aria-hidden className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="ai-confirm-title" className="text-base font-semibold text-slate-900 dark:text-slate-50">
                {labels.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{pending.ref}</p>
              <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">
                &ldquo;{pending.preview}&rdquo;
              </p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{labels.warn}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 dark:border-white/5 dark:bg-white/2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setPending(null)}
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200/70 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleConfirm}
            autoFocus
            className="inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#160f2e]"
          >
            {busy ? "Working…" : labels.action}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
