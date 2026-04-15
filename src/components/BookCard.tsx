import { memo, useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { BOOK_INFO } from "../data/bookInfo";
import { wolChapterUrl, wolRefUrl, jwLibraryChapterUrl, jwOrgBibleUrl } from "../utils/wol";


// jwlibrary:/// deep links only work on mobile (iOS/Android). On desktop the
// JW Library app registers the protocol but doesn't handle the finder action,
// causing it to crash. Hide these links on non-touch devices.
const isTouchDevice = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

function formatReadDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

interface BookReader {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface BookCardProps {
  book: { name: string; chapters: number; abbr: string };
  bookIndex: number;
  chaptersState: Record<number, Record<number, boolean>>;
  chapterTimestamps?: Record<number, string>;
  versesState?: Record<number, Record<number, number[]>>;
  onToggleChapter: (bookIndex: number, chapter: number) => void;
  onToggleBook: (bookIndex: number, value?: boolean) => void;
  onOpenChapterModal?: (bookIndex: number, chapter: number, pillEl: HTMLElement, pillRect: DOMRect) => void;
  notes?: { id: string | number; chapter: number; verse?: number; content: string }[];
  onAddNote?: (bookIndex: number) => void;
  onDeleteNote?: (id: string) => void;
  userId?: string;
  readers?: BookReader[];
  initialOpen?: boolean;
}

const BookCard = memo(function BookCard({ book, bookIndex, chaptersState, chapterTimestamps = {}, versesState, onToggleChapter, onToggleBook, onOpenChapterModal, notes = [], onAddNote, onDeleteNote, userId, readers = [], initialOpen = false }: BookCardProps) {
  const [open, setOpen] = useState(initialOpen);
  const [showInfo, setShowInfo] = useState(false);
  // Rect captured at pointerdown — before Chrome focus-scrolls the element
  const pillRectRef = useRef<DOMRect | null>(null);
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
    <div className={`book-card${allDone ? " fully-done" : ""}${open ? " book-card--open" : ""}`} data-book-index={bookIndex}>
      <div className="book-row" onClick={() => setOpen(o => !o)} role="button" tabIndex={0} aria-expanded={open}>
        <div className="book-num">
          {allDone ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
          ) : bookIndex + 1}
        </div>
        <div className="book-title-wrap" style={{ flex: 1, minWidth: 0 }}>
          <div className="book-name">{bookName}</div>
          <div className="book-abbr">{bookAbbr} · {t("book.chapters", { count: total })}</div>
        </div>
        <div className="book-meta">
          <div className="book-ch-count">{nearDone ? t("book.chaptersLeft", { count: remaining }) : `${done}/${total}`}</div>
          <div className="mini-bar">
            <div className="mini-bar-fill" style={{ width: pct + "%" }} />
          </div>
        </div>
        {readers.length > 0 && (
          <div className="book-readers" title={readers.map(r => r.display_name ?? "Someone").join(", ") + " reading this week"}>
            {readers.slice(0, 3).map(r => (
              <span key={r.user_id} className="book-reader-avatar">
                {r.avatar_url
                  ? <img src={r.avatar_url} alt={r.display_name ?? ""} width={18} height={18} loading="lazy" />
                  : (r.display_name ?? "?")[0].toUpperCase()
                }
              </span>
            ))}
            {readers.length > 3 && <span className="book-reader-more">+{readers.length - 3}</span>}
          </div>
        )}
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
                aria-expanded={showInfo}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transition: "transform 0.2s", transform: showInfo ? "rotate(90deg)" : "rotate(0deg)" }}><polyline points="9 18 15 12 9 6"/></svg>
                {t("book.infoToggle")}
              </button>
            )}
            <a
              className="book-info-toggle"
              href={isTouchDevice ? jwLibraryChapterUrl(bookIndex, 1) : jwOrgBibleUrl(bookIndex, 1, lang)}
              target={isTouchDevice ? undefined : "_blank"}
              rel={isTouchDevice ? undefined : "noopener noreferrer"}
              onClick={e => e.stopPropagation()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              {t("book.readInJwLibrary", "JW Library")}
            </a>
            <a
              className="book-info-toggle"
              href={wolChapterUrl(bookIndex, 1, lang)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              {t("book.readOnWol", "Read on JW.org")}
            </a>
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

              {info.notablePassages?.length > 0 && (
                <div className="book-info-notable">
                  <span className="book-info-meta-label">{t("book.infoNotablePassages", "Notable Passages")}</span>
                  <ul className="book-info-notable-list">
                    {info.notablePassages.map((p, i) => {
                      // Localized ref: replace English book-name prefix with bookNames.N
                      const m = p.ref.match(/^(.+?)\s+([0-9:\-–,\s]+)$/);
                      const localizedRef = m ? `${bookName} ${m[2]}` : p.ref;
                      const note = t(`bookNotablePassages.${bookIndex}.${i}.note`, p.note);
                      const ref = t(`bookNotablePassages.${bookIndex}.${i}.ref`, localizedRef);
                      return (
                        <li key={i} className="book-info-notable-item">
                          <span className="book-info-notable-ref">{ref}</span>
                          <span className="book-info-notable-note">{note}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

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
              const readVerses = versesState?.[bookIndex]?.[ch] ?? [];
              const isPartial = !isDone && readVerses.length > 0;
              const chNotes = notesByChapter.get(ch);
              const hasNote = chNotes?.length > 0;
              const readDate = isDone ? formatReadDate(chapterTimestamps[ch]) : null;
              const tooltipParts = [];
              if (readDate) tooltipParts.push(`✓ ${readDate}`);
              if (hasNote) tooltipParts.push(chNotes.map(n => n.content).join(" · "));
              const tooltipText = tooltipParts.length ? tooltipParts.join("\n") : null;
              const pillClass = `ch-pill${isDone ? " done" : isPartial ? " partial" : ""}${hasNote ? " has-note" : ""}`;
              return (
                <div key={ch} className={pillClass}>
                  <button
                    className="ch-pill-toggle"
                    onPointerDown={e => {
                      // Capture rect before Chrome focus-scrolls the element into view
                      const pill = e.currentTarget.closest(".ch-pill") as HTMLElement;
                      if (pill) pillRectRef.current = pill.getBoundingClientRect();
                    }}
                    onClick={e => {
                      if (onOpenChapterModal) {
                        const pill = e.currentTarget.closest(".ch-pill") as HTMLElement;
                        onOpenChapterModal(bookIndex, ch, pill, pillRectRef.current ?? pill.getBoundingClientRect());
                      } else {
                        onToggleChapter(bookIndex, ch);
                      }
                    }}
                  >
                    {ch}
                  </button>
                  {tooltipText && (
                    <span className="ch-pill-tooltip">{tooltipText}</span>
                  )}
                  <a
                    className="ch-pill-wol"
                    href={isTouchDevice ? jwLibraryChapterUrl(bookIndex, ch) : jwOrgBibleUrl(bookIndex, ch, lang)}
                    target={isTouchDevice ? undefined : "_blank"}
                    rel={isTouchDevice ? undefined : "noopener noreferrer"}
                    onClick={e => e.stopPropagation()}
                    aria-label={`Open chapter ${ch} in JW Library`}
                  >
                    <svg className="ch-pill-wol-icon" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    <span className="ch-pill-wol-tooltip">JW Library</span>
                  </a>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="ch-legend">
            <div className="ch-legend-item"><div className="ch-legend-dot" />{t("book.legendNotStarted", "Not started")}</div>
            <div className="ch-legend-item"><div className="ch-legend-dot ch-legend-dot--partial" />{t("book.legendPartial", "Partial")}</div>
            <div className="ch-legend-item"><div className="ch-legend-dot ch-legend-dot--done" />{t("book.legendComplete", "Complete")}</div>
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
                  {onDeleteNote && (
                    <button
                      className="ch-note-delete"
                      onClick={e => { e.stopPropagation(); onDeleteNote(String(note.id)); }}
                      title={t("common.delete")}
                      aria-label={t("common.delete")}
                    >✕</button>
                  )}
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
