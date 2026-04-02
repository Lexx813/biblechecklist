import { useTranslation } from "react-i18next";
import PageNav from "../../components/PageNav";
import { STUDY_TOPICS } from "../../data/studyTopics";
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

  return (
    <div className="stp-page">
      <PageNav user={user} navigate={navigate} {...sharedNav} />
      <div className="stp-header">
        <button className="stp-nav-back" onClick={() => navigate("home")}>
          {t("common.back")}
        </button>
        <h1 className="stp-title">{t("studyTopics.title", "Study Topics")}</h1>
        <p className="stp-subtitle">
          {t("studyTopics.subtitle", "Explore key Bible topics with scripture-based answers")}
        </p>
      </div>

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
    </div>
  );
}
