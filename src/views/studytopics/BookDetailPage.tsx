import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BOOKS } from "../../data/books";
import { BOOK_INFO } from "../../data/bookInfo";
import { BOOK_HIGHLIGHTS } from "../../data/bookHighlights";
import { wolRefUrl, wolBookUrl } from "../../utils/wol";
import AppLayout from "../../components/AppLayout";
import "../../styles/study-topics.css";

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
            <h1 className="std-title">{t("book.notFound")}</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  const bookName = t(`bookNames.${idx}`, book.name);
  const scripturesLabel = idx < 39 ? t("book.hebrewScriptures") : t("book.greekScriptures");
  const theme = t(`bookThemes.${idx}`, info.theme);
  const author = t(`bookAuthors.${idx}`, info.author);
  const date = t(`bookDates.${idx}`, info.date);
  const summary = t(`bookSummaries.${idx}`, info.summary);
  const whyBeneficial = extra?.whyBeneficial
    ? t(`bookWhyBeneficial.${idx}`, extra.whyBeneficial)
    : null;
  const prevBook = idx > 0 ? BOOKS[idx - 1] : null;
  const nextBook = idx < BOOKS.length - 1 ? BOOKS[idx + 1] : null;

  return (
    <AppLayout navigate={navigate} user={user} currentPage="studyTopics">
      <div className="std-page">
        <div className="std-header">
          <button className="stp-nav-back" onClick={() => navigate("studyTopics")}>
            ← {t("book.allBooks")}
          </button>

          <span className="bkd-corpus">
            {scripturesLabel} · {t("book.bookOfTotal", { current: idx + 1, total: 66 })}
          </span>
          <h1 className="std-title">{bookName}</h1>
          <p className="std-subtitle">{theme}</p>

          <div className="bkd-meta">
            <span className="bkd-meta-item">
              <span className="bkd-meta-label">{t("book.infoAuthor")}</span>
              <span className="bkd-meta-value">{author}</span>
            </span>
            <span className="bkd-meta-sep" aria-hidden="true">·</span>
            <span className="bkd-meta-item">
              <span className="bkd-meta-label">{t("book.infoWritten")}</span>
              <span className="bkd-meta-value">{date}</span>
            </span>
            <a
              className="bkd-meta-wol"
              href={wolBookUrl(idx, lang)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("book.readOnWolArrow")}
            </a>
          </div>
        </div>

        <div className="std-body">
          {/* Summary */}
          <div className="std-section">
            <h2 className="std-section-heading">{t("book.overview")}</h2>
            <p className="std-para">{summary}</p>
          </div>

          {/* Highlights */}
          {extra?.highlights?.length > 0 && (
            <div className="std-section">
              <h2 className="std-section-heading">{t("book.keyHighlights")}</h2>
              <ul className="bkd-highlights">
                {extra.highlights.map((h, i) => (
                  <li key={i} className="bkd-highlight">
                    {t(`bookHighlights.${idx}.${i}`, h)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Why Beneficial */}
          {whyBeneficial && (
            <div className="std-section">
              <h2 className="std-section-heading">{t("book.whyBeneficial")}</h2>
              <p className="std-para bkd-why">{whyBeneficial}</p>
            </div>
          )}

          {/* Key Verses */}
          {info.keyVerses?.length > 0 && (
            <div className="std-section">
              <h2 className="std-section-heading">{t("book.keyVersesHeading")}</h2>
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
              <h2 className="std-section-heading">{t("book.notablePassagesHeading")}</h2>
              <div className="std-scriptures">
                {info.notablePassages.map((passage, i) => {
                  const m = passage.ref.match(/^(.+?)\s+([0-9:\-–,\s]+)$/);
                  const localizedRef = m ? `${bookName} ${m[2]}` : passage.ref;
                  const ref = t(`bookNotablePassages.${idx}.${i}.ref`, localizedRef);
                  const note = t(`bookNotablePassages.${idx}.${i}.note`, passage.note);
                  const url = wolRefUrl(passage.ref, lang);
                  return (
                    <div key={i} className="std-scripture">
                      {url
                        ? <a className="std-scripture-ref" href={url} target="_blank" rel="noopener noreferrer">{ref} ↗</a>
                        : <div className="std-scripture-ref">{ref}</div>
                      }
                      <div className="std-scripture-text">{note}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Study Questions */}
          {info.questions?.length > 0 && (
            <div className="std-section">
              <h2 className="std-section-heading">{t("book.studyQuestionsHeading")}</h2>
              <ol className="bkd-questions">
                {info.questions.map((q, i) => (
                  <li key={i} className="bkd-question">
                    {t(`bookQuestions.${idx}.${i}`, q)}
                  </li>
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
                <span className="std-nav-btn-label">{t("book.previous")}</span>
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
                <span className="std-nav-btn-label">{t("book.next")}</span>
                <span className="std-nav-btn-title">{t(`bookNames.${idx + 1}`, nextBook.name)}</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
