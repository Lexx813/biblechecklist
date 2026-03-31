import { useTranslation } from "react-i18next";
import "../styles/landing.css";
import LanguageSelect from "../components/LanguageSelect";

const IconBook = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const FEATURE_ICONS = {
  book: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  notes: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  forum: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  blog: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
};

export default function LandingPage({ onGetStarted }) {
  const { t } = useTranslation();

  const FEATURES = [
    { icon: FEATURE_ICONS.book,  label: t("landing.feature66Books") },
    { icon: FEATURE_ICONS.check, label: t("landing.featureChapters") },
    { icon: FEATURE_ICONS.notes, label: t("landing.featureNotes") },
    { icon: FEATURE_ICONS.forum, label: t("landing.featureForum") },
    { icon: FEATURE_ICONS.blog,  label: t("landing.featureBlog") },
  ];

  return (
    <div className="landing-wrap" role="main" id="main-content">
      {/* Animated background */}
      <div className="landing-bg" aria-hidden="true">
        <div className="landing-orb landing-orb--1" />
        <div className="landing-orb landing-orb--2" />
        <div className="landing-orb landing-orb--3" />
        <div className="landing-orb landing-orb--4" />
        <div className="landing-orb landing-orb--5" />
        <div className="landing-star landing-star--1" />
        <div className="landing-star landing-star--2" />
        <div className="landing-star landing-star--3" />
        <div className="landing-grid" />
      </div>

      {/* Language select */}
      <div className="landing-lang">
        <LanguageSelect />
      </div>

      {/* Hero */}
      <div className="landing-hero">
        {/* Pulsing icon */}
        <div className="landing-icon-wrap">
          <div className="landing-icon-ring landing-icon-ring--1" />
          <div className="landing-icon-ring landing-icon-ring--2" />
          <div className="landing-icon-ring landing-icon-ring--3" />
          <span className="landing-icon" style={{ color: "#c084fc" }}><IconBook /></span>
        </div>

        <div className="landing-badge">{t("landing.badge")}</div>

        <h1 className="landing-title">
          {t("landing.titleLine1")}
          <span className="landing-title-accent">{t("landing.titleAccent")}</span>
        </h1>

        <p className="landing-subtitle">{t("landing.subtitle")}</p>

        <div className="landing-features">
          {FEATURES.map(({ icon, label }) => (
            <div key={label} className="landing-feature">
              {icon}
              <span>{label}</span>
            </div>
          ))}
        </div>

        <button className="landing-cta" onClick={onGetStarted}>
          <span>{t("landing.cta")}</span>
          <span className="landing-cta-arrow"><IconArrow /></span>
        </button>

        <p className="landing-social-proof" aria-label="Community size">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ opacity: 0.7 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Join 500+ readers tracking their progress
        </p>

        <p className="landing-signin">
          {t("landing.alreadyHaveAccount")}{" "}
          <button className="landing-signin-link" onClick={onGetStarted}>
            {t("landing.signIn")}
          </button>
        </p>
      </div>


      <footer style={{
        position: "relative", zIndex: 10,
        textAlign: "center", padding: "24px 16px",
        fontSize: 12, color: "rgba(255,255,255,0.3)",
      }}>
        © {new Date().getFullYear()} NWT Progress · Lexx Solutionz
        {" · "}
        <a href="/terms" style={{ color: "rgba(139,92,246,0.7)", textDecoration: "underline", cursor: "pointer" }}>Terms of Service</a>
        {" · "}
        <a href="/privacy" style={{ color: "rgba(139,92,246,0.7)", textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</a>
      </footer>
    </div>
  );
}
