import { useTranslation } from "react-i18next";
import PageNav from "../../components/PageNav";
import { STUDY_TOPICS } from "../../data/studyTopics";
import "../../styles/study-topics.css";

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
        {STUDY_TOPICS.map(topic => (
          <button
            key={topic.id}
            className="stp-card"
            onClick={() => navigate("studyTopicDetail", { slug: topic.slug })}
          >
            <span className="stp-card-icon">{topic.icon}</span>
            <h2 className="stp-card-title">{topic.title}</h2>
            <p className="stp-card-subtitle">{topic.subtitle}</p>
            <span className="stp-card-arrow">{t("studyTopics.readMore", "Read more")} →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
