import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BOOKS } from "../../data/books";
import { BOOK_INFO } from "../../data/bookInfo";
import { BOOK_HIGHLIGHTS } from "../../data/bookHighlights";
import { wolRefUrl, wolBookUrl } from "../../utils/wol";
import AppLayout from "../../components/AppLayout";
import "../../styles/study-topics.css";

const HEBREW_GREEK_LABEL = (bookIndex: number) =>
  bookIndex < 39 ? "Hebrew Scriptures" : "Greek Scriptures";

export default function BookDetailPage({ user, navigate, bookIndex, ...sharedNav }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] ?? "en";

  const idx = typeof bookIndex === "string" ? parseInt(bookIndex, 10) : bookIndex;
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [idx]);

  const book = BOOKS[idx];
  const info = BOOK_INFO[idx];
  const extra = BOOK_HIGHLIGHTS[idx];

  if (!book || !info) {
    return (
      <AppLayout navigate={navigate} user={user} currentPage="studyTopics">
        <div className="std-page">
          <div className="std-header">
            <h1 className="std-title">Book not found</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  const bookName = t(`bookNames.${idx}`, book.name);
  const prevBook = idx > 0 ? BOOKS[idx - 1] : null;
  const nextBook = idx < BOOKS.length - 1 ? BOOKS[idx + 1] : null;

  return (
    <AppLayout navigate={navigate} user={user} currentPage="studyTopics">
      <div className="std-page">
        <div className="std-header">
          <button className="stp-nav-back" onClick={() => navigate("studyTopics")}>
            ← All Bible Books
          </button>

          <span className="bkd-corpus">{HEBREW_GREEK_LABEL(idx)} · Book {idx + 1} of 66</span>
          <h1 className="std-title">{bookName}</h1>
          <p className="std-subtitle">{info.theme}</p>

          <div className="bkd-meta">
            <span className="bkd-meta-item">
              <span className="bkd-meta-label">Author</span>
              <span className="bkd-meta-value">{info.author}</span>
            </span>
            <span className="bkd-meta-sep" aria-hidden="true">·</span>
            <span className="bkd-meta-item">
              <span className="bkd-meta-label">Written</span>
              <span className="bkd-meta-value">{info.date}</span>
            </span>
            <a
              className="bkd-meta-wol"
              href={wolBookUrl(idx, lang)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read on WOL ↗
            </a>
          </div>
        </div>

        <div className="std-body">
          {/* Summary */}
          <div className="std-section">
            <h2 className="std-section-heading">Overview</h2>
            <p className="std-para">{info.summary}</p>
          </div>

          {/* Highlights */}
          {extra?.highlights?.length > 0 && (
            <div className="std-section">
              <h2 className="std-section-heading">Key Highlights</h2>
              <ul className="bkd-highlights">
                {extra.highlights.map((h, i) => (
                  <li key={i} className="bkd-highlight">{h}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Why Beneficial */}
          {extra?.whyBeneficial && (
            <div className="std-section">
              <h2 className="std-section-heading">Why Beneficial</h2>
              <p className="std-para bkd-why">{extra.whyBeneficial}</p>
            </div>
          )}

          {/* Key Verses */}
          {info.keyVerses?.length > 0 && (
            <div className="std-section">
              <h2 className="std-section-heading">Key Verses</h2>
              <div className="bkd-key-verses">
                {info.keyVerses.map((ref, i) => {
                  const url = wolRefUrl(ref, lang);
                  return url ? (
                    <a key={i} className="bkd-verse-chip" href={url} target="_blank" rel="noopener noreferrer">
                      {ref} ↗
                    </a>
                  ) : (
                    <span key={i} className="bkd-verse-chip">{ref}</span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notable Passages */}
          {info.notablePassages?.length > 0 && (
            <div className="std-section">
              <h2 className="std-section-heading">Notable Passages</h2>
              <div className="std-scriptures">
                {info.notablePassages.map((passage, i) => {
                  const url = wolRefUrl(passage.ref, lang);
                  return (
                    <div key={i} className="std-scripture">
                      {url
                        ? <a className="std-scripture-ref" href={url} target="_blank" rel="noopener noreferrer">{passage.ref} ↗</a>
                        : <div className="std-scripture-ref">{passage.ref}</div>
                      }
                      <div className="std-scripture-text">{passage.note}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Study Questions */}
          {info.questions?.length > 0 && (
            <div className="std-section">
              <h2 className="std-section-heading">Study Questions</h2>
              <ol className="bkd-questions">
                {info.questions.map((q, i) => (
                  <li key={i} className="bkd-question">{q}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="std-nav-footer">
          {prevBook ? (
            <button
              className="std-nav-btn"
              onClick={() => navigate("bookDetail", { bookIndex: idx - 1 })}
            >
              <span>←</span>
              <span>
                <span className="std-nav-btn-label">Previous</span>
                <span className="std-nav-btn-title">{t(`bookNames.${idx - 1}`, prevBook.name)}</span>
              </span>
            </button>
          ) : <span />}
          {nextBook && (
            <button
              className="std-nav-btn std-nav-btn--next"
              onClick={() => navigate("bookDetail", { bookIndex: idx + 1 })}
            >
              <span>→</span>
              <span>
                <span className="std-nav-btn-label">Next</span>
                <span className="std-nav-btn-title">{t(`bookNames.${idx + 1}`, nextBook.name)}</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
