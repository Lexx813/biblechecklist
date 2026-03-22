import { useState } from "react";

export default function BookCard({ book, bookIndex, chaptersState, onToggleChapter, onToggleBook }) {
  const [open, setOpen] = useState(false);
  const total = book.chapters;
  const done = Array.from({ length: total }, (_, i) => chaptersState[bookIndex]?.[i + 1]).filter(Boolean).length;
  const allDone = done === total;
  const partial = done > 0 && !allDone;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={`book-card${allDone ? " fully-done" : ""}`}>
      <div className="book-row" onClick={() => setOpen(o => !o)}>
        <div className="book-num">{bookIndex + 1}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="book-name">{book.name}</div>
          <div className="book-abbr">{book.abbr} · {total} chapters</div>
        </div>
        <div className="book-meta">
          <div className="book-ch-count">{done}/{total}</div>
          <div className="mini-bar">
            <div className="mini-bar-fill" style={{ width: pct + "%" }} />
          </div>
        </div>
        <div
          className={`check-circle${allDone ? " checked" : partial ? " partial" : ""}`}
          onClick={e => { e.stopPropagation(); onToggleBook(bookIndex); }}
          title={allDone ? "Mark unread" : "Mark whole book read"}
        >
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className={`chevron${open ? " open" : ""}`}>›</span>
      </div>

      {open && (
        <div className="chapters-panel">
          <div className="ch-section-label">Chapters — tap to mark read</div>
          <div className="ch-grid">
            {Array.from({ length: total }, (_, i) => {
              const ch = i + 1;
              const isDone = !!chaptersState[bookIndex]?.[ch];
              return (
                <button
                  key={ch}
                  className={`ch-pill${isDone ? " done" : ""}`}
                  onClick={() => onToggleChapter(bookIndex, ch)}
                  title={`Chapter ${ch}`}
                >
                  {ch}
                </button>
              );
            })}
          </div>
          <div className="ch-actions">
            <button className="ch-action-btn" onClick={() => onToggleBook(bookIndex, false)}>
              Clear all
            </button>
            <button className="ch-action-btn primary" onClick={() => onToggleBook(bookIndex, true)}>
              Mark all read ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
