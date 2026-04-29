import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

export type LikerProfile = { id: string; display_name: string | null; avatar_url: string | null };

interface Props {
  count: number;
  fetchLikers: () => Promise<LikerProfile[]>;
  className?: string;
}

export default function LikedByPopover({ count, fetchLikers, className }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [likers, setLikers] = useState<LikerProfile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  async function openPopover() {
    if (count === 0 || open) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    setOpen(true);
    if (!likers) {
      setLoading(true);
      try {
        const data = await fetchLikers();
        setLikers(data);
      } finally {
        setLoading(false);
      }
    }
  }

  function toggle() {
    if (open) setOpen(false);
    else openPopover();
  }

  function cancelClose() {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 150);
  }

  // Hover-to-open, mouse only. Touch/pen devices still use the existing
  // tap-to-toggle path, avoids phantom hover on mobile.
  function onPointerEnterTrigger(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    cancelClose();
    openPopover();
  }

  function onPointerLeaveTrigger(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return;
    scheduleClose();
  }

  useEffect(() => () => cancelClose(), []);

  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onMouse); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (count === 0) return <span className={className}>{count}</span>;

  const shown = (likers ?? []).slice(0, 6);
  const extra = (likers?.length ?? 0) - 6;

  return (
    <>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        className={`cursor-pointer font-semibold leading-none hover:underline ${className ?? ""}`}
        style={{ color: "inherit", fontSize: "inherit" }}
        onClick={toggle}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && toggle()}
        onPointerEnter={onPointerEnterTrigger}
        onPointerLeave={onPointerLeaveTrigger}
        onFocus={openPopover}
        onBlur={scheduleClose}
        aria-label={t("liked.seeWhoLiked")}
        aria-expanded={open}
      >
        {count}
      </span>

      {open && createPortal(
        <div
          ref={popoverRef}
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
          }}
          className="min-w-[160px] max-w-[220px] rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2.5 shadow-2xl"
        >
          {/* Down-pointing arrow */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: -5,
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: 10,
              height: 10,
              background: "var(--card-bg)",
              borderRight: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
            }}
          />

          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{t("liked.likedBy")}</p>

          {loading ? (
            <div className="flex items-center justify-center py-2">
              <div className="size-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
            </div>
          ) : shown.length === 0 ? (
            <p className="text-[12px] text-[var(--text-muted)]">{t("liked.noLikesYet")}</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {shown.map(u => (
                <div key={u.id} className="flex items-center gap-2">
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt="" className="size-6 shrink-0 rounded-full object-cover" width={24} height={24} loading="lazy" />
                    : <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                        {(u.display_name ?? "?")[0].toUpperCase()}
                      </div>
                  }
                  <span className="truncate text-[12px] text-[var(--text-primary)]">{u.display_name ?? t("liked.someone")}</span>
                </div>
              ))}
              {extra > 0 && (
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{t("liked.plusMore", { count: extra })}</p>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
