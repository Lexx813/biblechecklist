import { useTranslation } from "react-i18next";
import "../styles/landing.css";
import LanguageSelect from "./LanguageSelect";

const FREE_FEATURES = [
  { icon: "📖", label: "Track all 66 books & chapters" },
  { icon: "🧠", label: "Bible quiz with 1,000+ questions" },
  { icon: "✍️", label: "Community blog" },
  { icon: "💬", label: "Public discussion forum" },
  { icon: "🔖", label: "Bookmarks & activity feed" },
  { icon: "🔔", label: "Notifications" },
];

const PREMIUM_FEATURES = [
  { icon: "📅", label: "Reading Plans", desc: "Structured multi-week plans through any book" },
  { icon: "📝", label: "Study Notes", desc: "Rich-text notes tied to any passage or chapter" },
  { icon: "✨", label: "AI Companion", desc: "Ask AI about any verse, quiz question, or passage" },
  { icon: "💬", label: "Direct Messages", desc: "Private conversations with other members" },
  { icon: "👥", label: "Study Groups", desc: "Group chat and shared progress tracking" },
];

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
    <div className="landing-wrap">
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

      {/* Pricing */}
      <section className="landing-pricing">
        <div className="landing-pricing-header">
          <h2 className="landing-pricing-title">Simple, honest pricing</h2>
          <p className="landing-pricing-sub">Start free. Upgrade when you're ready.</p>
        </div>

        <div className="landing-pricing-cards">
          {/* Free */}
          <div className="landing-plan landing-plan--free">
            <p className="landing-plan-name">Free</p>
            <div className="landing-plan-price">
              <span className="landing-plan-amount">$0</span>
              <span className="landing-plan-period"> / forever</span>
            </div>
            <p className="landing-plan-desc">Everything you need to start tracking your reading journey.</p>
            <ul className="landing-plan-features">
              {FREE_FEATURES.map(({ icon, label }) => (
                <li key={label} className="landing-plan-feature">
                  <span className="landing-plan-feature-icon">{icon}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <button className="landing-plan-cta landing-plan-cta--ghost" onClick={onGetStarted}>
              Get started free
            </button>
          </div>

          {/* Premium */}
          <div className="landing-plan landing-plan--premium">
            <div className="landing-plan-popular">Most Popular</div>
            <p className="landing-plan-name">Premium</p>
            <div className="landing-plan-price">
              <span className="landing-plan-amount">$3</span>
              <span className="landing-plan-period"> / month</span>
            </div>
            <p className="landing-plan-desc">The complete NWT Progress experience — everything in Free, plus:</p>
            <ul className="landing-plan-features">
              {PREMIUM_FEATURES.map(({ icon, label, desc }) => (
                <li key={label} className="landing-plan-feature landing-plan-feature--detailed">
                  <span className="landing-plan-feature-icon">{icon}</span>
                  <span>
                    <strong>{label}</strong>
                    <span className="landing-plan-feature-desc">{desc}</span>
                  </span>
                </li>
              ))}
            </ul>
            <button className="landing-plan-cta landing-plan-cta--primary" onClick={onGetStarted}>
              Get started →
            </button>
            <p className="landing-plan-note">No commitment · Cancel anytime</p>
          </div>
        </div>
      </section>

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
