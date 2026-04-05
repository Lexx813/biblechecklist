import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface VerseModalProps {
  bookName: string;
  chapter: number;
  totalVerses: number;
  readVerses: number[];       // 1-based verse numbers that are read
  isChapterDone: boolean;
  anchorRect: DOMRect;
  onClose: () => void;
  onMarkComplete: () => void; // toggle chapter complete on/off
  onToggleVerse: (verse: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

const MODAL_W = 308;

export default function VerseModal({
  bookName, chapter, totalVerses, readVerses, isChapterDone,
  anchorRect, onClose, onMarkComplete, onToggleVerse, onSelectAll, onClearAll,
}: VerseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, above: false, ready: false });

  // Calculate position on mount and on resize
  useLayoutEffect(() => {
    function compute() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const pillCX = anchorRect.left + anchorRect.width / 2;

      // Horizontal: center on pill, clamp to viewport
      let left = pillCX - MODAL_W / 2;
      left = Math.max(8, Math.min(vw - MODAL_W - 8, left));

      // Vertical: prefer below, flip above if < 240px space below
      const spaceBelow = vh - anchorRect.bottom;
      const above = spaceBelow < 240 && anchorRect.top > 240;
      const top = above ? anchorRect.top - 8 : anchorRect.bottom + 8;

      setPos({ top, left, above, ready: true });
    }
    compute();
    window.addEventListener("resize", compute, { passive: true });
    return () => window.removeEventListener("resize", compute);
  }, [anchorRect]);

  // Close on Escape or backdrop click
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Trap focus inside modal
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const firstBtn = el.querySelector<HTMLElement>("[tabindex], button");
    firstBtn?.focus();
  }, [pos.ready]);

  const readSet = new Set(readVerses);
  const readCount = isChapterDone ? totalVerses : readVerses.length;
  const pct = totalVerses > 0 ? Math.round((readCount / totalVerses) * 100) : 0;

  const caretLeft = Math.min(
    Math.max(16, (anchorRect.left + anchorRect.width / 2) - pos.left),
    MODAL_W - 16,
  );

  if (!pos.ready) return null;

  return (
    <>
      {/* Invisible backdrop */}
      <div className="vm-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Modal card */}
      <div
        ref={modalRef}
        className={`vm-card${pos.above ? " vm-card--above" : ""}`}
        style={{
          top: pos.above ? undefined : pos.top,
          bottom: pos.above ? window.innerHeight - pos.top : undefined,
          left: pos.left,
          "--caret-left": caretLeft + "px",
        } as React.CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label={`${bookName} Chapter ${chapter}`}
      >
        {/* Caret */}
        {!pos.above && <div className="vm-caret vm-caret--top" />}

        {/* Header */}
        <div className="vm-header">
          <div className="vm-header-left">
            <div className="vm-badge">Ch {chapter}</div>
            <div className="vm-title-group">
              <div className="vm-book">{bookName}</div>
              <div className="vm-sub">{readCount} / {totalVerses} verses</div>
            </div>
          </div>
          <button className="vm-close" onClick={onClose} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="vm-progress-track">
          <div className="vm-progress-fill" style={{ width: pct + "%" }} />
        </div>

        {/* Primary action */}
        <div className="vm-primary-area">
          <button
            className={`vm-complete-btn${isChapterDone ? " vm-complete-btn--done" : ""}`}
            onClick={onMarkComplete}
          >
            {isChapterDone ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Chapter Complete — Undo
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Mark Chapter Complete
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="vm-divider">
          <span>or select verses</span>
        </div>

        {/* Secondary actions */}
        <div className="vm-sec-row">
          <button className="vm-sec-btn" onClick={onSelectAll}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Select all
          </button>
          <button className="vm-sec-btn vm-sec-btn--danger" onClick={onClearAll}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
            Clear
          </button>
        </div>

        {/* Verse grid */}
        <div className="vm-verse-grid">
          {Array.from({ length: totalVerses }, (_, i) => {
            const v = i + 1;
            const isRead = isChapterDone || readSet.has(v);
            return (
              <button
                key={v}
                className={`vm-verse${isRead ? " vm-verse--read" : ""}`}
                onClick={() => onToggleVerse(v)}
                aria-label={`Verse ${v}`}
                aria-pressed={isRead}
              >
                {v}
              </button>
            );
          })}
        </div>

        {pos.above && <div className="vm-caret vm-caret--bottom" />}
      </div>
    </>
  );
}
