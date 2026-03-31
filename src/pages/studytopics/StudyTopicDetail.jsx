import { useTranslation } from "react-i18next";
import PageNav from "../../components/PageNav";
import { getTopicBySlug, STUDY_TOPICS } from "../../data/studyTopics";
import "../../styles/study-topics.css";

export default function StudyTopicDetail({ user, navigate, slug, ...sharedNav }) {
  const { t } = useTranslation();
  const topic = getTopicBySlug(slug);

  if (!topic) {
    return (
      <div className="std-page">
        <PageNav user={user} navigate={navigate} {...sharedNav} />
        <div className="std-header">
          <button className="st-nav-back" onClick={() => navigate("studyTopics")}>
            {t("common.back")}
          </button>
          <h1 className="std-title">{t("studyTopics.notFound", "Topic not found")}</h1>
        </div>
      </div>
    );
  }

  const currentIndex = STUDY_TOPICS.findIndex(t => t.slug === slug);
  const prevTopic = currentIndex > 0 ? STUDY_TOPICS[currentIndex - 1] : null;
  const nextTopic = currentIndex < STUDY_TOPICS.length - 1 ? STUDY_TOPICS[currentIndex + 1] : null;

  return (
    <div className="std-page">
      <PageNav user={user} navigate={navigate} {...sharedNav} />
      <div className="std-header">
        <button className="st-nav-back" onClick={() => navigate("studyTopics")}>
          ← {t("studyTopics.allTopics", "All Topics")}
        </button>
        <span className="std-icon">{topic.icon}</span>
        <h1 className="std-title">{topic.title}</h1>
        <p className="std-subtitle">{topic.subtitle}</p>
      </div>

      <div className="std-body">
        {topic.sections.map((section, i) => (
          <div key={i} className="std-section">
            <h2 className="std-section-heading">{section.heading}</h2>
            {section.paragraphs.map((para, j) => (
              <p key={j} className="std-para">{para}</p>
            ))}
            {section.scriptures?.length > 0 && (
              <div className="std-scriptures">
                {section.scriptures.map((s, k) => (
                  <div key={k} className="std-scripture">
                    <div className="std-scripture-ref">{s.ref}</div>
                    <div className="std-scripture-text">{s.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="std-nav-footer">
        {prevTopic ? (
          <button
            className="std-nav-btn"
            onClick={() => navigate("studyTopicDetail", { slug: prevTopic.slug })}
          >
            <span>←</span>
            <span>
              <span className="std-nav-btn-label">{t("studyTopics.previous", "Previous")}</span>
              <span className="std-nav-btn-title">{prevTopic.icon} {prevTopic.title}</span>
            </span>
          </button>
        ) : <span />}
        {nextTopic && (
          <button
            className="std-nav-btn std-nav-btn--next"
            onClick={() => navigate("studyTopicDetail", { slug: nextTopic.slug })}
          >
            <span>→</span>
            <span>
              <span className="std-nav-btn-label">{t("studyTopics.next", "Next")}</span>
              <span className="std-nav-btn-title">{nextTopic.icon} {nextTopic.title}</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
