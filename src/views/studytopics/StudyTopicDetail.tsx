import { useTranslation } from "react-i18next";
import { getTopicBySlug, STUDY_TOPICS } from "../../data/studyTopics";
import { wolRefUrl } from "../../utils/wol";
import AppLayout from "../../components/AppLayout";
import "../../styles/study-topics.css";

export default function StudyTopicDetail({ user, navigate, slug, ...sharedNav }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] ?? "en";
  const topic = getTopicBySlug(slug);
  const loc = topic ? t(`studyTopics.topics.${slug}`, { returnObjects: true }) as any : null;
  const localTopic = (loc && typeof loc === "object")
    ? {
        ...topic,
        title: loc.title || topic.title,
        subtitle: loc.subtitle || topic.subtitle,
        sections: (Array.isArray(loc.sections) ? loc.sections : topic.sections).map((s: any, i: number) => {
          const base: any = topic.sections[i] ?? {};
          return {
            heading: s.heading || base.heading,
            paragraphs: Array.isArray(s.paragraphs) ? s.paragraphs : base.paragraphs,
            scriptures: Array.isArray(s.scriptures) ? s.scriptures : base.scriptures,
          };
        }),
      }
    : topic;

  if (!topic) {
    return (
      <AppLayout navigate={navigate} user={user} currentPage="studyTopics">
      <div className="std-page">
        <div className="std-header">
          <h1 className="std-title">{t("studyTopics.notFound", "Topic not found")}</h1>
        </div>
      </div>
      </AppLayout>
    );
  }

  const currentIndex = STUDY_TOPICS.findIndex(t => t.slug === slug);
  const prevTopic = currentIndex > 0 ? STUDY_TOPICS[currentIndex - 1] : null;
  const nextTopic = currentIndex < STUDY_TOPICS.length - 1 ? STUDY_TOPICS[currentIndex + 1] : null;

  return (
    <AppLayout navigate={navigate} user={user} currentPage="studyTopics">
    <div className="std-page">
      <div className="std-header">
        <button className="stp-nav-back" onClick={() => navigate("studyTopics")}>
          ← {t("studyTopics.allTopics", "All Topics")}
        </button>
        <span className="std-icon">{localTopic.icon}</span>
        <h1 className="std-title">{localTopic.title}</h1>
        <p className="std-subtitle">{localTopic.subtitle}</p>
      </div>

      <div className="std-body">
        {localTopic.sections.map((section, i) => (
          <div key={i} className="std-section">
            <h2 className="std-section-heading">{section.heading}</h2>
            {section.paragraphs.map((para, j) => (
              <p key={j} className="std-para">{para}</p>
            ))}
            {section.scriptures?.length > 0 && (
              <div className="std-scriptures">
                {section.scriptures.map((s, k) => (
                  <div key={k} className="std-scripture">
                    {wolRefUrl(s.ref, lang)
                      ? <a className="std-scripture-ref" href={wolRefUrl(s.ref, lang)} target="_blank" rel="noopener noreferrer">{s.ref} ↗</a>
                      : <div className="std-scripture-ref">{s.ref}</div>
                    }
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
              <span className="std-nav-btn-title">{prevTopic.icon} {((t(`studyTopics.topics.${prevTopic.slug}`, { returnObjects: true }) as any)?.title) || prevTopic.title}</span>
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
              <span className="std-nav-btn-title">{nextTopic.icon} {((t(`studyTopics.topics.${nextTopic.slug}`, { returnObjects: true }) as any)?.title) || nextTopic.title}</span>
            </span>
          </button>
        )}
      </div>
    </div>
    </AppLayout>
  );
}
