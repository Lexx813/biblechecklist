import { useTranslation } from "react-i18next";
import "../styles/landing.css";
import LanguageSelect from "../components/LanguageSelect";


export default function LandingPage({ onGetStarted }) {
  const { t } = useTranslation();

  const FEATURES = [
    { icon: "📖", label: t("landing.feature66Books") },
    { icon: "✅", label: t("landing.featureChapters") },
    { icon: "📝", label: t("landing.featureNotes") },
    { icon: "💬", label: t("landing.featureForum") },
    { icon: "✍️", label: t("landing.featureBlog") },
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
          <span className="landing-icon">📖</span>
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
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <button className="landing-cta" onClick={onGetStarted}>
          <span>{t("landing.cta")}</span>
          <span className="landing-cta-arrow">→</span>
        </button>

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
