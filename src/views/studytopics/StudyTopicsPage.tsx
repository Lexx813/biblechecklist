// @ts-nocheck
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { STUDY_TOPICS } from "../../data/studyTopics";
import { BOOKS } from "../../data/books";
import { BOOK_INFO } from "../../data/bookInfo";
import { useSubscription } from "../../hooks/useSubscription";
import "../../styles/study-topics.css";

function StudyTopicsSkeleton() {
  return (
    <div className="study-topics">
      <div className="skeleton" style={{ height: 38, width: '45%', marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ padding: 16, background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div className="skeleton" style={{ height: 20, width: '70%', marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 14, width: '90%', marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 14, width: '65%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudyTopicsPage({ user, navigate, ...sharedNav }) {
  const { t } = useTranslation();
  const { isPremium } = useSubscription(user?.id);
  const [tab, setTab] = useState("topics"); // "topics" | "books"

  return (
    <div className="stp-page">
      <div className="stp-header">
        <button className="stp-nav-back" onClick={() => navigate("home")}>
          {t("common.back")}
        </button>
        <h1 className="stp-title">{t("studyTopics.title", "Study Topics")}</h1>
        <p className="stp-subtitle">
          {t("studyTopics.subtitle", "Explore key Bible topics with scripture-based answers")}
        </p>
      </div>

      <div className="stp-tabs" role="tablist">
        <button
          className={`stp-tab${tab === "topics" ? " stp-tab--active" : ""}`}
          onClick={() => setTab("topics")}
          role="tab"
          aria-selected={tab === "topics"}
        >
          {t("studyTopics.tabTopics", "Topics")}
        </button>
        <button
          className={`stp-tab${tab === "books" ? " stp-tab--active" : ""}`}
          onClick={() => setTab("books")}
          role="tab"
          aria-selected={tab === "books"}
        >
          {t("studyTopics.tabBooks", "Bible Books")}
        </button>
      </div>

      {tab === "topics" && (
      <div className="stp-grid">
        {STUDY_TOPICS.map(topic => {
          const loc = t(`studyTopics.topics.${topic.slug}`, { returnObjects: true });
          const title = (loc && typeof loc === "object" && loc.title) || topic.title;
          const subtitle = (loc && typeof loc === "object" && loc.subtitle) || topic.subtitle;
          return (
            <button
              key={topic.id}
              className="stp-card"
              onClick={() => navigate("studyTopicDetail", { slug: topic.slug })}
            >
              <span className="stp-card-icon">{topic.icon}</span>
              <h2 className="stp-card-title">{title}</h2>
              <p className="stp-card-subtitle">{subtitle}</p>
              <span className="stp-card-arrow">{t("studyTopics.readMore", "Read more")} →</span>
            </button>
          );
        })}
      </div>
      )}

      {tab === "books" && (
        <div className="stp-grid">
          {BOOKS.map((book, bookIndex) => {
            const info = BOOK_INFO[bookIndex];
            const bookName = t(`bookNames.${bookIndex}`, book.name);
            const theme = info ? t(`bookThemes.${bookIndex}`, info.theme) : "";
            return (
              <button
                key={bookIndex}
                className={`stp-card${!isPremium ? " stp-card--locked" : ""}`}
                onClick={() => {
                  if (!isPremium) { sharedNav.onUpgrade?.(); return; }
                  navigate("readingTracker");
                }}
                aria-label={`${bookName}${!isPremium ? " (Premium)" : ""}`}
              >
                {!isPremium && (
                  <span className="stp-card-lock" aria-hidden="true">✦</span>
                )}
                <h2 className="stp-card-title">{bookName}</h2>
                <p className="stp-card-subtitle">{theme}</p>
                <span className="stp-card-arrow">
                  {isPremium ? t("studyTopics.readMore", "Read more") + " →" : "✦ Premium"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
