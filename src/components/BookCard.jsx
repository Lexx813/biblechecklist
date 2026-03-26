import { memo, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BOOK_INFO } from "../data/bookInfo";

function formatReadDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const BookCard = memo(function BookCard({ book, bookIndex, chaptersState, chapterTimestamps = {}, onToggleChapter, onToggleBook, notes = [], onAddNote }) {
  const [open, setOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const { t } = useTranslation();
  const total = book.chapters;
  const bookChapters = chaptersState[bookIndex];
  const done = bookChapters ? Object.values(bookChapters).filter(Boolean).length : 0;
  const allDone = done === total;
  const partial = done > 0 && !allDone;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const bookName = t(`bookNames.${bookIndex}`, book.name);
  const bookAbbr = t(`bookAbbrs.${bookIndex}`, book.abbr);
  const info = BOOK_INFO[bookIndex];
  const summary = info ? t(`bookSummaries.${bookIndex}`, info.summary) : null;
  const theme = info ? t(`bookThemes.${bookIndex}`, info.theme) : null;

  const notesByChapter = useMemo(() => {
    const map = new Map();
    for (const note of notes) {
      const arr = map.get(note.chapter) ?? [];
      arr.push(note);
      map.set(note.chapter, arr);
    }
    return map;
  }, [notes]);

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
          {/* Book info toggle + Add Note */}
          <div className="book-top-actions">
            {info && (
              <button
                className="book-info-toggle"
                onClick={() => setShowInfo(s => !s)}
              >
                <span>{showInfo ? "▾" : "▸"}</span>
                {t("book.infoToggle")}
              </button>
            )}
            {onAddNote && (
              <button
                className="ch-add-note-btn"
                onClick={() => onAddNote(bookIndex)}
              >
                + {t("app.addNote")}
              </button>
            )}
          </div>

          {/* Book info panel */}
          {showInfo && info && (
            <div className="book-info-panel">
              <p className="book-info-summary">{summary}</p>
              <div className="book-info-meta-row">
                {info.author && (
                  <div className="book-info-meta-item">
                    <span className="book-info-meta-label">{t("book.infoAuthor")}</span>
                    <span className="book-info-meta-value">{info.author}</span>
                  </div>
                )}
                {info.date && (
                  <div className="book-info-meta-item">
                    <span className="book-info-meta-label">{t("book.infoWritten")}</span>
                    <span className="book-info-meta-value">{info.date}</span>
                  </div>
                )}
                {theme && (
                  <div className="book-info-meta-item">
                    <span className="book-info-meta-label">{t("book.infoTheme")}</span>
                    <span className="book-info-meta-value">{theme}</span>
                  </div>
                )}
              </div>
              {info.keyVerses?.length > 0 && (
                <div className="book-info-verses">
                  <span className="book-info-meta-label">{t("book.infoKeyVerses")}</span>
                  <div className="book-info-verse-pills">
                    {info.keyVerses.map(v => (
                      <span key={v} className="book-info-verse-pill">{v}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="ch-section-label" style={{ marginTop: showInfo ? 12 : 0 }}>{t("book.chLabel")}</div>
          <div className="ch-grid">
            {Array.from({ length: total }, (_, i) => {
              const ch = i + 1;
              const isDone = !!chaptersState[bookIndex]?.[ch];
              const chNotes = notesByChapter.get(ch);
              const hasNote = chNotes?.length > 0;
              const readDate = isDone ? formatReadDate(chapterTimestamps[ch]) : null;
              const tooltipParts = [];
              if (readDate) tooltipParts.push(`✓ ${readDate}`);
              if (hasNote) tooltipParts.push(chNotes.map(n => n.content).join(" · "));
              const tooltipText = tooltipParts.length ? tooltipParts.join("\n") : null;
              return (
                <button
                  key={ch}
                  className={`ch-pill${isDone ? " done" : ""}${hasNote ? " has-note" : ""}`}
                  onClick={() => onToggleChapter(bookIndex, ch)}
                  title={t("book.chapterTitle", { ch })}
                >
                  {ch}
                  {tooltipText && (
                    <span className="ch-pill-tooltip">{tooltipText}</span>
                  )}
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
});

export default BookCard;
