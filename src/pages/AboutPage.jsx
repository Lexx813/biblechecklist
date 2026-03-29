import { useTranslation, Trans } from "react-i18next";
import DOMPurify from "dompurify";
import PageNav from "../components/PageNav";
import { useMeta } from "../hooks/useMeta";
import "../styles/about.css";

// Set this to the creator's actual photo URL to show a real avatar
const CREATOR_AVATAR_URL = null;

export default function AboutPage({ navigate, darkMode, setDarkMode, i18n, user, onLogout, onUpgrade }) {
  const { t } = useTranslation();
  useMeta({ title: "About", description: "Learn about NWT Progress — a Bible reading tracker built for Jehovah's Witnesses and Bible students." });
  return (
    <div className="about-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout}  onUpgrade={onUpgrade}/>

      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-glow about-hero-glow--1" />
        <div className="about-hero-glow about-hero-glow--2" />
        <div className="about-hero-inner">
          <div className="about-hero-badge">{t("about.heroBadge")}</div>
          <h1 className="about-hero-title">{t("about.heroTitle")}</h1>
          <p className="about-hero-sub">{t("about.heroSub")}</p>
        </div>
      </section>

      <div className="about-content" id="main-content">

        {/* Purpose */}
        <section className="about-section">
          <div className="about-section-icon">🎯</div>
          <h2 className="about-section-title">{t("about.purposeTitle")}</h2>
          <p className="about-section-body">{t("about.purposeBody1")}</p>
          <p className="about-section-body">{t("about.purposeBody2")}</p>
        </section>

        {/* Who it's for */}
        <section className="about-section about-section--card-row">
          <h2 className="about-section-title about-section-title--center">{t("about.audienceTitle")}</h2>
          <div className="about-cards">
            <div className="about-card">
              <div className="about-card-icon">📚</div>
              <h3 className="about-card-title">{t("about.card1Title")}</h3>
              <p className="about-card-body">{t("about.card1Body")}</p>
            </div>
            <div className="about-card">
              <div className="about-card-icon">🕊️</div>
              <h3 className="about-card-title">{t("about.card2Title")}</h3>
              <p className="about-card-body">{t("about.card2Body")}</p>
            </div>
            <div className="about-card">
              <div className="about-card-icon">👨‍👩‍👧‍👦</div>
              <h3 className="about-card-title">{t("about.card3Title")}</h3>
              <p className="about-card-body">{t("about.card3Body")}</p>
            </div>
          </div>
        </section>

        {/* NWT / JW Library */}
        <section className="about-section about-section--highlight">
          <div className="about-highlight-inner">
            <div className="about-highlight-icon">📱</div>
            <div>
              <h2 className="about-highlight-title">{t("about.jwTitle")}</h2>
              <p className="about-highlight-body">{t("about.jwBody")}</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="about-section">
          <h2 className="about-section-title about-section-title--center">{t("about.featuresTitle")}</h2>
          <ul className="about-features">
            {["feat1","feat2","feat3","feat4","feat5","feat6"].map((key, i) => (
              <li key={key} className="about-feature">
                <span className="about-feature-icon">{["✅","📝","💬","🧠","👥","📊"][i]}</span>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t(`about.${key}`)) }} />
              </li>
            ))}
          </ul>
        </section>

        {/* Subscription transparency */}
        <section className="about-section about-section--transparency">
          <div className="about-section-icon">🤝</div>
          <h2 className="about-section-title">{t("about.subTitle", "Why There's a Subscription")}</h2>
          <p className="about-section-body">
            {t("about.subBody1", "This app is built and maintained by one person who loves Jehovah and wants to help those in the faith study His Word. Keeping it running requires real monthly costs:")}
          </p>
          <ul className="about-sub-costs">
            <li><span>🖥️</span><span>{t("about.subCost1", "Hosting & infrastructure (Vercel)")}</span></li>
            <li><span>🗄️</span><span>{t("about.subCost2", "Database (Supabase)")}</span></li>
            <li><span>✨</span><span>{t("about.subCost3", "AI API — the engine behind the AI Study Companion (Claude / Anthropic)")}</span></li>
            <li><span>🌐</span><span>{t("about.subCost4", "Domain name")}</span></li>
          </ul>
          <p className="about-section-body">
            {t("about.subBody2", "The $3/month subscription is set at cost — not for profit. Every dollar goes toward keeping the lights on.")}
          </p>
          <div className="about-sub-surplus">
            <span className="about-sub-surplus-icon">❤️</span>
            <p>
              {t("about.subSurplus", "Any surplus left after covering these costs will be used to support brothers and sisters in need and for donations to JW.org — because that's what this community is about.")}
            </p>
          </div>
          <p className="about-sub-hardship">
            {t("about.subHardship1", "If the subscription is a financial hardship, please")}{" "}
            <a href="mailto:luaq777@gmail.com" className="about-sub-hardship-link">
              {t("about.subHardship2", "reach out")}
            </a>
            {t("about.subHardship3", " — no one in the faith should be left out.")}
          </p>
        </section>

        {/* Creator */}
        <section className="about-section about-section--creator">
          <div className="about-creator-card">
            <div className="about-creator-avatar-wrap">
              {CREATOR_AVATAR_URL
                ? <img className="about-creator-avatar about-creator-avatar--img" src={CREATOR_AVATAR_URL} alt={t("about.creatorName")} />
                : <div className="about-creator-avatar">L</div>
              }
            </div>
            <div className="about-creator-info">
              <div className="about-creator-label">{t("about.creatorLabel")}</div>
              <h2 className="about-creator-name">{t("about.creatorName")}</h2>
              <p className="about-creator-bio">{t("about.creatorBio")}</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <section className="about-cta">
            <h2 className="about-cta-title">{t("about.ctaTitle")}</h2>
            <p className="about-cta-sub">{t("about.ctaSub")}</p>
            <button className="about-cta-btn" onClick={() => navigate("home")}>
              {t("about.ctaBtn")}
            </button>
          </section>
        )}

      </div>

    </div>
  );
}
