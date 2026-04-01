import { memo, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BOOK_INFO } from "../data/bookInfo";
import { wolChapterUrl, wolRefUrl } from "../utils/wol";

function formatReadDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const BookCard = memo(function BookCard({ book, bookIndex, chaptersState, chapterTimestamps = {}, onToggleChapter, onToggleBook, notes = [], onAddNote }) {
  const [open, setOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] ?? "en";
  const total = book.chapters;
  const bookChapters = chaptersState[bookIndex];
  const done = bookChapters ? Object.values(bookChapters).filter(Boolean).length : 0;
  const allDone = done === total;
  const partial = done > 0 && !allDone;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const remaining = total - done;
  const nearDone = !allDone && remaining <= 5 && done > 0;

  const bookName = t(`bookNames.${bookIndex}`, book.name);
  const bookAbbr = t(`bookAbbrs.${bookIndex}`, book.abbr);
  const info = BOOK_INFO[bookIndex];
  const summary = info ? t(`bookSummaries.${bookIndex}`, info.summary) : null;
  const theme = info ? t(`bookThemes.${bookIndex}`, info.theme) : null;
  const questions = info?.questions
    ? t(`bookQuestions.${bookIndex}`, { returnObjects: true, defaultValue: info.questions })
    : null;

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
        <div className="book-num">
          {allDone ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
          ) : bookIndex + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="book-name">{bookName}</div>
          <div className="book-abbr">{bookAbbr} · {t("book.chapters", { count: total })}</div>
        </div>
        <div className="book-meta">
          <div className="book-ch-count">{nearDone ? t("book.chaptersLeft", { count: remaining }) : `${done}/${total}`}</div>
          <div className="mini-bar">
            <div className="mini-bar-fill" style={{ width: pct + "%" }} />
          </div>
        </div>
        <div
          className={`check-circle${allDone ? " checked" : partial ? " partial" : ""}`}
          onClick={e => { e.stopPropagation(); onToggleBook(bookIndex); }}
          title={allDone ? t("book.markUnread") : t("book.markBookRead")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span className={`chevron${open ? " open" : ""}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        </span>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transition: "transform 0.2s", transform: showInfo ? "rotate(90deg)" : "rotate(0deg)" }}><polyline points="9 18 15 12 9 6"/></svg>
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
                    {info.keyVerses.map(v => {
                      const url = wolRefUrl(v, lang);
                      return url
                        ? <a key={v} className="book-info-verse-pill" href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>{v} ↗</a>
                        : <span key={v} className="book-info-verse-pill">{v}</span>;
                    })}
                  </div>
                </div>
              )}
              {Array.isArray(questions) && questions.length > 0 && (
                <div className="book-info-questions">
                  <span className="book-info-meta-label">{t("book.infoStudyQuestions", "Study Questions")}</span>
                  <ol className="book-info-question-list">
                    {questions.map((q, i) => (
                      <li key={i} className="book-info-question-item">{q}</li>
                    ))}
                  </ol>
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
                <div key={ch} className={`ch-pill${isDone ? " done" : ""}${hasNote ? " has-note" : ""}`}>
                  <button
                    className="ch-pill-toggle"
                    onClick={() => onToggleChapter(bookIndex, ch)}
                  >
                    {ch}
                  </button>
                  {tooltipText && (
                    <span className="ch-pill-tooltip">{tooltipText}</span>
                  )}
                  <a
                    className="ch-pill-wol"
                    href={wolChapterUrl(bookIndex, ch, lang)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    aria-label={`Read chapter ${ch} on JW.org`}
                  >
                    <svg className="ch-pill-wol-icon" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    <span className="ch-pill-wol-tooltip">Read on JW.org</span>
                  </a>
                </div>
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
