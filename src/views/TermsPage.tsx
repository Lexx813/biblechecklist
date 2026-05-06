import { useTranslation } from "react-i18next";
import { useMeta } from "../hooks/useMeta";
import "../styles/about.css";

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const BanIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" />
  </svg>
);
const DotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function TermsPage({ navigate, darkMode, setDarkMode, i18n, user, onLogout }) {
  const { t } = useTranslation();
  useMeta({ title: t("terms.meta.title"), description: t("terms.meta.description") });
  return (
    <div className="about-wrap">

      {!user && (
        <div className="w-full px-4 pt-4 sm:px-6 lg:px-8">
          <button className="back-btn" onClick={() => navigate("")}>{t("terms.backHome")}</button>
        </div>
      )}

      <section className="about-hero" style={{ paddingTop: "48px", paddingBottom: "48px" }}>
        <div className="about-hero-glow about-hero-glow--1" />
        <div className="about-hero-glow about-hero-glow--2" />
        <div className="about-hero-inner">
          <div className="about-hero-badge">{t("terms.badge")}</div>
          <h1 className="about-hero-title">{t("terms.title")}</h1>
          <p className="about-hero-sub">{t("terms.lastUpdated")}</p>
        </div>
      </section>

      <div className="about-content w-full px-4 sm:px-6 lg:px-8">

        <section className="about-section">
          <h2 className="about-section-title">{t("terms.section1.heading")}</h2>
          <p className="about-section-body">
            {t("terms.section1.body")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("terms.section2.heading")}</h2>
          <p className="about-section-body">
            {t("terms.section2.body1")}
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("terms.section2.list.tracker.bold")}</strong>{t("terms.section2.list.tracker.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("terms.section2.list.blog.bold")}</strong>{t("terms.section2.list.blog.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("terms.section2.list.forum.bold")}</strong>{t("terms.section2.list.forum.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("terms.section2.list.ai.bold")}</strong>{t("terms.section2.list.ai.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("terms.section2.list.meeting.bold")}</strong>{t("terms.section2.list.meeting.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("terms.section2.list.videos.bold")}</strong>{t("terms.section2.list.videos.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("terms.section2.list.quizzes.bold")}</strong>{t("terms.section2.list.quizzes.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("terms.section2.list.notifications.bold")}</strong>{t("terms.section2.list.notifications.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon"><DotIcon /></span><div><strong>{t("terms.section2.list.profiles.bold")}</strong>{t("terms.section2.list.profiles.text")}</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            <strong>{t("terms.section2.body2.bold")}</strong>{t("terms.section2.body2.text")}
          </p>
          <p className="about-section-body">
            {t("terms.section2.body3")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("terms.section3.heading")}</h2>
          <p className="about-section-body">
            {t("terms.section3.body1")}
          </p>
          <p className="about-section-body">
            <strong>{t("terms.section3.body2.bold")}</strong>{t("terms.section3.body2.text")}
          </p>
          <p className="about-section-body">
            {t("terms.section3.body3")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("terms.section4.heading")}</h2>
          <p className="about-section-body">
            {t("terms.section4.body1")}
          </p>
          <p className="about-section-body">
            {t("terms.section4.body2")}
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ban"><BanIcon /></span><div>{t("terms.section4.list.item1")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ban"><BanIcon /></span><div>{t("terms.section4.list.item2")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ban"><BanIcon /></span><div>{t("terms.section4.list.item3")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ban"><BanIcon /></span><div>{t("terms.section4.list.item4")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ban"><BanIcon /></span><div>{t("terms.section4.list.item5")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ban"><BanIcon /></span><div>{t("terms.section4.list.item6")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ban"><BanIcon /></span><div>{t("terms.section4.list.item7")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ban"><BanIcon /></span><div>{t("terms.section4.list.item8")}</div></li>
          </ul>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("terms.section5.heading")}</h2>
          <p className="about-section-body">
            {t("terms.section5.body1")}
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><CheckIcon /></span><div>{t("terms.section5.list.item1")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ok"><CheckIcon /></span><div>{t("terms.section5.list.item2")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ban"><BanIcon /></span><div>{t("terms.section5.list.item3")}</div></li>
            <li className="about-feature"><span className="about-feature-icon about-feature-icon--ban"><BanIcon /></span><div>{t("terms.section5.list.item4")}</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            {t("terms.section5.body2")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("terms.section6.heading")}</h2>
          <p className="about-section-body">
            {t("terms.section6.body1")}
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>{t("terms.section6.list.email.bold")}</strong>{t("terms.section6.list.email.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>{t("terms.section6.list.phone.bold")}</strong>{t("terms.section6.list.phone.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>{t("terms.section6.list.address.bold")}</strong>{t("terms.section6.list.address.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>{t("terms.section6.list.social.bold")}</strong>{t("terms.section6.list.social.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>{t("terms.section6.list.insecure.bold")}</strong>{t("terms.section6.list.insecure.text")}</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            {t("terms.section6.body2")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title" style={{ color: "var(--text-primary)" }}>
            {t("terms.section7.heading")}
          </h2>
          <p className="about-section-body">
            {t("terms.section7.body1")}
          </p>
          <p className="about-section-body"><strong>{t("terms.section7.body2")}</strong></p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>{t("terms.section7.list1.item1")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>{t("terms.section7.list1.item2")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>{t("terms.section7.list1.item3")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>{t("terms.section7.list1.item4")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>{t("terms.section7.list1.item5")}</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            <strong>{t("terms.section7.body3.bold")}</strong>{t("terms.section7.body3.text")}
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">🔴</span><div><strong>{t("terms.section7.list2.item1.bold")}</strong>{t("terms.section7.list2.item1.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">🔴</span><div><strong>{t("terms.section7.list2.item2.bold")}</strong>{t("terms.section7.list2.item2.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">🔴</span><div><strong>{t("terms.section7.list2.item3.bold")}</strong>{t("terms.section7.list2.item3.text")}</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            {t("terms.section7.body4")}
          </p>
          <p className="about-section-body">
            <strong>{t("terms.section7.body5.bold")}</strong>{t("terms.section7.body5.text")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("terms.section8.heading")}</h2>
          <p className="about-section-body">
            {t("terms.section8.body1")}
          </p>
          <p className="about-section-body">
            {t("terms.section8.body2")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("terms.section9.heading")}</h2>
          <p className="about-section-body">
            {t("terms.section9.body1")}
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">⚠️</span><div><strong>{t("terms.section9.list.removal.bold")}</strong>{t("terms.section9.list.removal.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">⚠️</span><div><strong>{t("terms.section9.list.suspension.bold")}</strong>{t("terms.section9.list.suspension.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">⚠️</span><div><strong>{t("terms.section9.list.ban.bold")}</strong>{t("terms.section9.list.ban.text")}</div></li>
            <li className="about-feature"><span className="about-feature-icon">⚠️</span><div><strong>{t("terms.section9.list.report.bold")}</strong>{t("terms.section9.list.report.text")}</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            {t("terms.section9.body2")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("terms.section10.heading")}</h2>
          <p className="about-section-body">
            {t("terms.section10.body")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("terms.section11.heading")}</h2>
          <p className="about-section-body">
            {t("terms.section11.body")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("terms.section12.heading")}</h2>
          <p className="about-section-body">
            {t("terms.section12.body")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("terms.section13.heading")}</h2>
          <p className="about-section-body">
            {t("terms.section13.body")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("terms.section14.heading")}</h2>
          <p className="about-section-body">
            {t("terms.section14.body")}
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">{t("terms.section15.heading")}</h2>
          <p className="about-section-body">
            {t("terms.section15.body")}
          </p>
        </section>

      </div>

    </div>
  );
}
