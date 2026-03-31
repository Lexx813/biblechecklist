import { useTranslation } from "react-i18next";
import PageNav from "../../components/PageNav";
import { STUDY_TOPICS } from "../../data/studyTopics";
import "../../styles/study-topics.css";

export default function StudyTopicsPage({ user, navigate, ...sharedNav }) {
  const { t } = useTranslation();

  return (
    <div className="st-page">
      <PageNav user={user} navigate={navigate} {...sharedNav} />
      <div className="st-header">
        <button className="st-nav-back" onClick={() => navigate("home")}>
          {t("common.back")}
        </button>
        <h1 className="st-title">{t("studyTopics.title", "Study Topics")}</h1>
        <p className="st-subtitle">
          {t("studyTopics.subtitle", "Explore key Bible topics with scripture-based answers")}
        </p>
      </div>

      <div className="st-grid">
        {STUDY_TOPICS.map(topic => (
          <button
            key={topic.id}
            className="st-card"
            onClick={() => navigate("studyTopicDetail", { slug: topic.slug })}
          >
            <span className="st-card-icon">{topic.icon}</span>
            <h2 className="st-card-title">{topic.title}</h2>
            <p className="st-card-subtitle">{topic.subtitle}</p>
            <span className="st-card-arrow">{t("studyTopics.readMore", "Read more")} →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
