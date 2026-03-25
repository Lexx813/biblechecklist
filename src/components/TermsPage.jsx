import PageNav from "./PageNav";
import "../styles/about.css";

export default function TermsPage({ navigate, darkMode, setDarkMode, i18n, user, onLogout }) {
  return (
    <div className="about-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />

      <section className="about-hero" style={{ paddingTop: "80px", paddingBottom: "48px" }}>
        <div className="about-hero-glow about-hero-glow--1" />
        <div className="about-hero-glow about-hero-glow--2" />
        <div className="about-hero-inner">
          <div className="about-hero-badge">Legal</div>
          <h1 className="about-hero-title">Terms of Service</h1>
          <p className="about-hero-sub">Last updated: March 24, 2025</p>
        </div>
      </section>

      <div className="about-content" style={{ maxWidth: 720 }}>

        <section className="about-section">
          <h2 className="about-section-title">1. Acceptance of Terms</h2>
          <p className="about-section-body">
            By accessing or using NWT Progress ("the App") at nwtprogress.com, you agree to be bound by these Terms of Service. If you do not agree, please do not use the App.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">2. Description of Service</h2>
          <p className="about-section-body">
            NWT Progress is a free Bible reading tracker and community platform designed for readers of the New World Translation. The App provides tools for tracking reading progress, participating in forums, writing blog posts, taking quizzes, and connecting with other users.
          </p>
          <p className="about-section-body">
            The App is provided free of charge with no ads. We reserve the right to modify, suspend, or discontinue any part of the service at any time.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">3. User Accounts</h2>
          <p className="about-section-body">
            You must create an account to access most features. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate information when registering.
          </p>
          <p className="about-section-body">
            You must be at least 13 years of age to use this App. By creating an account, you confirm that you meet this requirement.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">4. User Content</h2>
          <p className="about-section-body">
            You retain ownership of content you create (blog posts, forum threads, comments). By posting content, you grant NWT Progress a non-exclusive, royalty-free license to display that content within the App.
          </p>
          <p className="about-section-body">
            You agree not to post content that is:
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Hateful, abusive, harassing, or threatening</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Sexually explicit or harmful to minors</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Spam, misinformation, or misleading</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Infringing on another person's intellectual property</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Illegal under applicable law</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            We reserve the right to remove any content and suspend or terminate accounts that violate these guidelines.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">5. Community Standards</h2>
          <p className="about-section-body">
            NWT Progress is a spiritually-focused community platform. We ask that all users engage respectfully and in a manner consistent with the values of the community. Debates intended to discourage faith or disrespect other users' beliefs are not permitted.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">6. Intellectual Property</h2>
          <p className="about-section-body">
            The NWT Progress name, logo, design, and original code are the intellectual property of Lexx Solutionz. Scripture quotations are from the New World Translation of the Holy Scriptures and are used for personal and community study purposes.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">7. Disclaimer of Warranties</h2>
          <p className="about-section-body">
            The App is provided "as is" without warranties of any kind. We do not guarantee that the App will be error-free, uninterrupted, or that data will never be lost. Use the App at your own risk.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">8. Limitation of Liability</h2>
          <p className="about-section-body">
            To the fullest extent permitted by law, NWT Progress and Lexx Solutionz shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">9. Changes to Terms</h2>
          <p className="about-section-body">
            We may update these Terms at any time. Continued use of the App after changes are posted constitutes acceptance of the updated Terms. We will update the "Last updated" date at the top of this page.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">10. Contact</h2>
          <p className="about-section-body">
            If you have questions about these Terms, you can reach us through the App's community forum or via the contact information listed on nwtprogress.com.
          </p>
        </section>

      </div>

    </div>
  );
}
