import { useTranslation } from "react-i18next";
import { useMeta } from "../hooks/useMeta";
import "../styles/about.css";

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const DotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default function PrivacyPage({ navigate, darkMode, setDarkMode, i18n, user, onLogout }) {
  const { t } = useTranslation();
  useMeta({ title: t("privacy.meta.title"), description: t("privacy.meta.description") });
  return (
    <div className="about-wrap">

      {!user && (
        <div className="w-full px-4 pt-4 sm:px-6 lg:px-8">
          <button className="back-btn" onClick={() => navigate("")}>{t("privacy.backHome")}</button>
        </div>
      )}

      <section className="about-hero" style={{ paddingTop: "48px", paddingBottom: "48px" }}>
        <div className="about-hero-glow about-hero-glow--1" />
        <div className="about-hero-glow about-hero-glow--2" />
        <div className="about-hero-inner">
          <div className="about-hero-badge">{t("privacy.badge")}</div>
          <h1 className="about-hero-title">{t("privacy.title")}</h1>
          <p className="about-hero-sub">{t("privacy.lastUpdated")}</p>
        </div>
      </section>

      <div className="about-content w-full px-4 sm:px-6 lg:px-8">

        <section className="about-section">
          <h2 className="about-section-title">{t("privacy.section1.heading")}</h2>
          <p className="about-section-body">
            {t("privacy.section1.body1")}
          </p>
          <p className="about-section-body">
            {t("privacy.section1.body2")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("privacy.section2.heading")}</h2>
          <p className="about-section-body"><strong>{t("privacy.section2.item1Label")}</strong> {t("privacy.section2.item1Body")}</p>
          <p className="about-section-body"><strong>{t("privacy.section2.item2Label")}</strong> {t("privacy.section2.item2Body")}</p>
          <p className="about-section-body"><strong>{t("privacy.section2.item3Label")}</strong> {t("privacy.section2.item3Body")}</p>
          <p className="about-section-body"><strong>{t("privacy.section2.item4Label")}</strong> {t("privacy.section2.item4Body")}</p>
          <p className="about-section-body"><strong>{t("privacy.section2.item5Label")}</strong> {t("privacy.section2.item5Body")}</p>
          <p className="about-section-body"><strong>{t("privacy.section2.item6Label")}</strong> {t("privacy.section2.item6Body")}</p>
          <p className="about-section-body"><strong>{t("privacy.section2.item7Label")}</strong> {t("privacy.section2.item7Body")}</p>
          <p className="about-section-body"><strong>{t("privacy.section2.item8Label")}</strong> {t("privacy.section2.item8Body")}</p>
          <p className="about-section-body"><strong>{t("privacy.section2.item9Label")}</strong> {t("privacy.section2.item9Body")}</p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("privacy.section3.heading")}</h2>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><CheckIcon /></span><div>{t("privacy.section3.item1")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><CheckIcon /></span><div>{t("privacy.section3.item2")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><CheckIcon /></span><div>{t("privacy.section3.item3")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><CheckIcon /></span><div>{t("privacy.section3.item4")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><CheckIcon /></span><div>{t("privacy.section3.item5")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><CheckIcon /></span><div>{t("privacy.section3.item6")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><CheckIcon /></span><div>{t("privacy.section3.item7")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><CheckIcon /></span><div>{t("privacy.section3.item8")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><CheckIcon /></span><div>{t("privacy.section3.item9")}</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            {t("privacy.section3.footer1")} <strong>{t("privacy.section3.footerNot")}</strong> {t("privacy.section3.footer2")} <strong>{t("privacy.section3.footerNot")}</strong> {t("privacy.section3.footer3")} <strong>{t("privacy.section3.footerNot")}</strong> {t("privacy.section3.footer4")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("privacy.section4.heading")}</h2>
          <p className="about-section-body">{t("privacy.section4.intro")}</p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("privacy.section4.item1Label")}</strong>{t("privacy.section4.item1Body")}</div></li>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("privacy.section4.item2Label")}</strong>{t("privacy.section4.item2Body")}</div></li>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("privacy.section4.item3Label")}</strong>{t("privacy.section4.item3Body")}</div></li>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("privacy.section4.item4Label")}</strong>{t("privacy.section4.item4Body")}</div></li>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("privacy.section4.item5Label")}</strong>{t("privacy.section4.item5Body")}</div></li>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("privacy.section4.item6Label")}</strong>{t("privacy.section4.item6Body")}</div></li>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("privacy.section4.item7Label")}</strong>{t("privacy.section4.item7Body")}</div></li>
          </ul>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("privacy.section5.heading")}</h2>
          <p className="about-section-body">
            {t("privacy.section5.body1")}
          </p>
          <p className="about-section-body">
            {t("privacy.section5.body2")}
          </p>
          <p className="about-section-body">
            <strong>{t("privacy.section5.body3Strong")}</strong> {t("privacy.section5.body3Rest")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("privacy.section6.heading")}</h2>
          <p className="about-section-body">
            {t("privacy.section6.body")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("privacy.section7.heading")}</h2>
          <p className="about-section-body">{t("privacy.section7.intro")}</p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><ShieldIcon /></span><div>{t("privacy.section7.item1")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><ShieldIcon /></span><div>{t("privacy.section7.item2")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><ShieldIcon /></span><div>{t("privacy.section7.item3")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><ShieldIcon /></span><div>{t("privacy.section7.item4")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><ShieldIcon /></span><div>{t("privacy.section7.item5")}</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            {t("privacy.section7.footer")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("privacy.section8.heading")}</h2>
          <p className="about-section-body">
            {t("privacy.section8.body")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title" style={{ color: "var(--text-primary)" }}>
            {t("privacy.section9.heading")}
          </h2>
          <p className="about-section-body">
            <strong>{t("privacy.section9.ageLabel")}</strong> {t("privacy.section9.ageBody")}
          </p>
          <p className="about-section-body">
            <strong>{t("privacy.section9.commitmentLabel")}</strong> {t("privacy.section9.commitmentBody")}
          </p>
          <p className="about-section-body">
            <strong>{t("privacy.section9.reportingLabel")}</strong> {t("privacy.section9.reportingBody")}
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">🔴</span><div><strong>{t("privacy.section9.item1Label")}</strong> {t("privacy.section9.item1Body")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">🔴</span><div><strong>{t("privacy.section9.item2Label")}</strong> {t("privacy.section9.item2Body")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">🔴</span><div><strong>{t("privacy.section9.item3Label")}</strong> {t("privacy.section9.item3Body")}</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            {t("privacy.section9.dataNote")}
          </p>
          <p className="about-section-body">
            <strong>{t("privacy.section9.parentalLabel")}</strong> {t("privacy.section9.parentalBody")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("privacy.section10.heading")}</h2>
          <p className="about-section-body">
            {t("privacy.section10.body")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("privacy.section11.heading")}</h2>
          <p className="about-section-body">
            {t("privacy.section11.body")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("privacy.section12.heading")}</h2>
          <p className="about-section-body">
            {t("privacy.section12.body")}
          </p>
        </section>

      </div>

    </div>
  );
}
