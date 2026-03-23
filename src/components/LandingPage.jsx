import "../styles/landing.css";

const FEATURES = [
  { icon: "📖", label: "66 Books" },
  { icon: "✅", label: "Track Chapters" },
  { icon: "📝", label: "Personal Notes" },
  { icon: "💬", label: "Community Forum" },
  { icon: "✍️", label: "Inspiring Blog" },
];

export default function LandingPage({ onGetStarted }) {
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

      {/* Hero */}
      <div className="landing-hero">
        {/* Pulsing icon */}
        <div className="landing-icon-wrap">
          <div className="landing-icon-ring landing-icon-ring--1" />
          <div className="landing-icon-ring landing-icon-ring--2" />
          <div className="landing-icon-ring landing-icon-ring--3" />
          <span className="landing-icon">📖</span>
        </div>

        <div className="landing-badge">✦ New World Translation · 66 Books</div>

        <h1 className="landing-title">
          Bible Reading
          <span className="landing-title-accent">Tracker</span>
        </h1>

        <p className="landing-subtitle">
          Journey through all 66 books of scripture. Track your progress chapter
          by chapter, keep personal notes, and grow alongside a vibrant community.
        </p>

        <div className="landing-features">
          {FEATURES.map(({ icon, label }) => (
            <div key={label} className="landing-feature">
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <button className="landing-cta" onClick={onGetStarted}>
          <span>Start Your Journey</span>
          <span className="landing-cta-arrow">→</span>
        </button>

        <p className="landing-signin">
          Already have an account?{" "}
          <button className="landing-signin-link" onClick={onGetStarted}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
