import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { jwOrgBibleUrl } from "../utils/wol";
import ShareToFriendModal from "./ShareToFriendModal";

const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

interface VerseModalProps {
  bookName: string;
  bookIndex: number;
  chapter: number;
  totalVerses: number;
  readVerses: number[];
  isChapterDone: boolean;
  pillEl: HTMLElement;          // live element — re-queried on scroll
  initialRect: DOMRect;         // rect captured at pointerdown, before any browser scroll
  onClose: () => void;
  onMarkComplete: () => void;
  onToggleVerse: (verse: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  currentUserId?: string | null;
}

const MODAL_W = 308;

function computePos(rect: DOMRect) {
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const pillCX = rect.left + rect.width / 2;

  let left = pillCX - MODAL_W / 2;
  left = Math.max(8, Math.min(vw - MODAL_W - 8, left));

  const top = rect.bottom + 8;
  const maxHeight = Math.max(160, Math.min(vh - top - 8, 480));
  const caretLeft = Math.min(Math.max(16, pillCX - left), MODAL_W - 16);

  return { top, left, caretLeft, maxHeight };
}

export default function VerseModal({
  bookName, bookIndex, chapter, totalVerses, readVerses, isChapterDone,
  pillEl, initialRect, onClose, onMarkComplete, onToggleVerse, onSelectAll, onClearAll,
  currentUserId,
}: VerseModalProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] ?? "en";
  const modalRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(() => computePos(initialRect));
  const [showShare, setShowShare] = useState(false);

  const chapterShareLink = jwOrgBibleUrl(bookIndex, chapter, lang);
  const shareMessage = t("verseModal.shareMessage", "📖 I'm reading {{book}} {{chapter}}: {{url}}", {
    book: bookName,
    chapter,
    url: chapterShareLink,
  });

  // Track pill position on scroll/resize
  useLayoutEffect(() => {
    function update() { setPos(computePos(pillEl.getBoundingClientRect())); }
    window.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
    };
  }, [pillEl]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Focus trap — preventScroll so Android doesn't scroll on focus
  useEffect(() => {
    modalRef.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }, []);

  const readSet = new Set(readVerses);
  const readCount = isChapterDone ? totalVerses : readVerses.length;
  const pct = totalVerses > 0 ? Math.round((readCount / totalVerses) * 100) : 0;

  return createPortal(
    <>
      {/* Backdrop — rendered directly in body, no transformed ancestor */}
      <div className="vm-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Modal card */}
      <div
        ref={modalRef}
        className="vm-card"
        style={{
          top: pos.top,
          left: pos.left,
          "--caret-left": pos.caretLeft + "px",
        } as React.CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label={`${bookName} Chapter ${chapter}`}
      >
        <div className="vm-caret vm-caret--top" />

        <div className="vm-card-inner" style={{ maxHeight: pos.maxHeight }}>

        {/* Header */}
        <div className="vm-header">
          <div className="vm-header-left">
            <div className="vm-badge">Ch {chapter}</div>
            <div className="vm-title-group">
              <div className="vm-book">{bookName}</div>
              <div className="vm-sub">{readCount} / {totalVerses} verses</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {currentUserId && (
              <button
                className="vm-close"
                onClick={() => setShowShare(true)}
                aria-label={t("shareToFriend.title", "Share with a friend")}
                title={t("shareToFriend.title", "Share with a friend")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
            )}
            <button className="vm-close" onClick={onClose} aria-label="Close">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {isChapterDone ? "Chapter Complete · Undo" : "Mark Chapter Complete"}
          </button>
        </div>

        {/* Divider */}
        <div className="vm-divider"><span>or select verses</span></div>

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
            const verseHref = isTouchDevice
              ? `jwlibrary:///finder?bible=${String(bookIndex + 1).padStart(2, "0")}${String(chapter).padStart(3, "0")}${String(v).padStart(3, "0")}`
              : jwOrgBibleUrl(bookIndex, chapter, lang, v);
            return (
              <div key={v} className="vm-verse-wrap">
                <button
                  className={`vm-verse${isRead ? " vm-verse--read" : ""}`}
                  onClick={() => onToggleVerse(v)}
                  aria-label={`Verse ${v}`}
                  aria-pressed={isRead}
                >
                  {v}
                </button>
                <a
                  className="vm-verse-link"
                  href={verseHref}
                  target={isTouchDevice ? undefined : "_blank"}
                  rel={isTouchDevice ? undefined : "noopener noreferrer"}
                  onClick={e => e.stopPropagation()}
                  aria-label={`Open verse ${v} in JW Library`}
                >
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </div>
            );
          })}
        </div>

        </div>{/* end vm-card-inner */}

      </div>

      {showShare && currentUserId && (
        <ShareToFriendModal
          currentUserId={currentUserId}
          message={shareMessage}
          title={t("verseModal.shareTitle", "Share {{book}} {{chapter}}", { book: bookName, chapter })}
          onClose={() => setShowShare(false)}
        />
      )}
    </>,
    document.body
  );
}
