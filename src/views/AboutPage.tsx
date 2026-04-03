// @ts-nocheck
import { useTranslation, Trans } from "react-i18next";
import DOMPurify from "dompurify";
import { useMeta } from "../hooks/useMeta";
import "../styles/about.css";

// Set this to the creator's actual photo URL to show a real avatar
const CREATOR_AVATAR_URL = null;

export default function AboutPage({ navigate, darkMode, setDarkMode, i18n, user, onLogout, onUpgrade }) {
  const { t } = useTranslation();
  useMeta({ title: "About", description: "Learn about NWT Progress — a Bible reading tracker built for Jehovah's Witnesses and Bible students." });
  return (
    <div className="about-wrap">

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
          <div className="about-section-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
</svg></div>
          <h2 className="about-section-title">{t("about.purposeTitle")}</h2>
          <p className="about-section-body">{t("about.purposeBody1")}</p>
          <p className="about-section-body">{t("about.purposeBody2")}</p>
        </section>

        {/* Who it's for */}
        <section className="about-section about-section--card-row">
          <h2 className="about-section-title about-section-title--center">{t("about.audienceTitle")}</h2>
          <div className="about-cards">
            <div className="about-card">
              <div className="about-card-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
</svg></div>
              <h3 className="about-card-title">{t("about.card1Title")}</h3>
              <p className="about-card-body">{t("about.card1Body")}</p>
            </div>
            <div className="about-card">
              <div className="about-card-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22c-4-3-8-6-8-11a8 8 0 0 1 16 0c0 5-4 8-8 11z"/><circle cx="12" cy="11" r="3"/></svg></div>
              <h3 className="about-card-title">{t("about.card2Title")}</h3>
              <p className="about-card-body">{t("about.card2Body")}</p>
            </div>
            <div className="about-card">
              <div className="about-card-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
              <h3 className="about-card-title">{t("about.card3Title")}</h3>
              <p className="about-card-body">{t("about.card3Body")}</p>
            </div>
          </div>
        </section>

        {/* NWT / JW Library */}
        <section className="about-section about-section--highlight">
          <div className="about-highlight-inner">
            <div className="about-highlight-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></div>
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
                <span className="about-feature-icon">{[
                  <svg key="f1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
                  <svg key="f2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>,
                  <svg key="f3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
                  <svg key="f4" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
                  <svg key="f5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                  <svg key="f6" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
                ][i]}</span>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t(`about.${key}`)) }} />
              </li>
            ))}
          </ul>
        </section>

        {/* Subscription transparency */}
        <section className="about-section about-section--transparency">
          <div className="about-section-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 12.5c0 .8-.3 1.5-.8 2l-4 4.5c-.5.5-1.1.8-1.8.8H9.3C8.6 19.8 8 19.5 7.5 19L3 14.5a2.8 2.8 0 0 1 4-4l1 1V6.5a2 2 0 0 1 4 0v3a2 2 0 0 1 2 0v1a2 2 0 0 1 2 0v1a2 2 0 0 1 4 0v1z"/></svg></div>
          <h2 className="about-section-title">{t("about.subTitle", "Why There's a Subscription")}</h2>
          <p className="about-section-body">
            {t("about.subBody1", "This app is built and maintained by one person who loves Jehovah and wants to help those in the faith study His Word. Keeping it running requires real monthly costs:")}
          </p>
          <ul className="about-sub-costs">
            <li><span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></span><span>{t("about.subCost1", "Hosting & infrastructure (Vercel)")}</span></li>
            <li><span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></span><span>{t("about.subCost2", "Database (Supabase)")}</span></li>
            <li><span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span><span>{t("about.subCost3", "AI API — the engine behind the AI Study Companion (Claude / Anthropic)")}</span></li>
            <li><span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span><span>{t("about.subCost4", "Domain name")}</span></li>
          </ul>
          <p className="about-section-body">
            {t("about.subBody2", "The $3/month subscription is set at cost — not for profit. Every dollar goes toward keeping the lights on.")}
          </p>
          <div className="about-sub-surplus">
            <span className="about-sub-surplus-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg></span>
            <p>
              {t("about.subSurplus", "Any surplus left after covering these costs will be used to support brothers and sisters in need and for donations to JW.org — because that's what this community is about.")}
            </p>
          </div>
          <p className="about-sub-hardship">
            {t("about.subHardship1", "If the subscription is a financial hardship, please")}{" "}
            <a href="mailto:support@nwtprogress.com" className="about-sub-hardship-link">
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
