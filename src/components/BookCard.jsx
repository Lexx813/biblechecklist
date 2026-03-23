import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function BookCard({ book, bookIndex, chaptersState, onToggleChapter, onToggleBook, notes = [] }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const total = book.chapters;
  const done = Array.from({ length: total }, (_, i) => chaptersState[bookIndex]?.[i + 1]).filter(Boolean).length;
  const allDone = done === total;
  const partial = done > 0 && !allDone;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const bookName = t(`bookNames.${bookIndex}`, book.name);
  const bookAbbr = t(`bookAbbrs.${bookIndex}`, book.abbr);

  return (
    <div className={`book-card${allDone ? " fully-done" : ""}`}>
      <div className="book-row" onClick={() => setOpen(o => !o)}>
        <div className="book-num">{bookIndex + 1}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="book-name">{bookName}</div>
          <div className="book-abbr">{bookAbbr} · {t("book.chapters", { count: total })}</div>
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
          title={allDone ? t("book.markUnread") : t("book.markBookRead")}
        >
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className={`chevron${open ? " open" : ""}`}>›</span>
      </div>

      {open && (
        <div className="chapters-panel">
          <div className="ch-section-label">{t("book.chLabel")}</div>
          <div className="ch-grid">
            {Array.from({ length: total }, (_, i) => {
              const ch = i + 1;
              const isDone = !!chaptersState[bookIndex]?.[ch];
              return (
                <button
                  key={ch}
                  className={`ch-pill${isDone ? " done" : ""}`}
                  onClick={() => onToggleChapter(bookIndex, ch)}
                  title={t("book.chapterTitle", { ch })}
                >
                  {ch}
                </button>
              );
            })}
          </div>
          <div className="ch-actions">
            <button className="ch-action-btn" onClick={() => onToggleBook(bookIndex, false)}>
              {t("book.clearAll")}
            </button>
            <button className="ch-action-btn primary" onClick={() => onToggleBook(bookIndex, true)}>
              {t("book.markAllRead")}
            </button>
          </div>

          {notes.length > 0 && (
            <div className="ch-notes">
              <div className="ch-section-label" style={{ marginTop: 12 }}>{t("book.notesLabel")}</div>
              {notes.map(note => (
                <div key={note.id} className="ch-note">
                  <span className="ch-note-ref">
                    {t("profile.chAbbr")} {note.chapter}{note.verse ? ` ${t("profile.verseAbbr")}${note.verse}` : ""}
                  </span>
                  <span className="ch-note-content">{note.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
