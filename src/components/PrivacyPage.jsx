import PageNav from "./PageNav";
import { useMeta } from "../hooks/useMeta";
import "../styles/about.css";

export default function PrivacyPage({ navigate, darkMode, setDarkMode, i18n, user, onLogout }) {
  useMeta({ title: "Privacy Policy" });
  return (
    <div className="about-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />

      <section className="about-hero" style={{ paddingTop: "80px", paddingBottom: "48px" }}>
        <div className="about-hero-glow about-hero-glow--1" />
        <div className="about-hero-glow about-hero-glow--2" />
        <div className="about-hero-inner">
          <div className="about-hero-badge">Legal</div>
          <h1 className="about-hero-title">Privacy Policy</h1>
          <p className="about-hero-sub">Last updated: March 24, 2025</p>
        </div>
      </section>

      <div className="about-content" style={{ maxWidth: 720 }}>

        <section className="about-section">
          <h2 className="about-section-title">1. Overview</h2>
          <p className="about-section-body">
            NWT Progress ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information when you use our App at nwtprogress.com.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">2. Information We Collect</h2>
          <p className="about-section-body"><strong>Account information:</strong> When you register, we collect your email address and any optional display name or profile photo you provide.</p>
          <p className="about-section-body"><strong>Reading progress:</strong> We store which Bible chapters you have marked as read so your progress syncs across devices.</p>
          <p className="about-section-body"><strong>User content:</strong> Blog posts, forum threads, replies, comments, and notes you create are stored and associated with your account.</p>
          <p className="about-section-body"><strong>Usage data:</strong> We use Google Analytics to collect anonymized data about how the App is used (pages visited, session duration, device type). No personally identifiable information is sent to Google Analytics.</p>
          <p className="about-section-body"><strong>Technical data:</strong> Standard server logs including IP address and browser type may be collected by our hosting provider (Vercel) and database provider (Supabase).</p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">3. How We Use Your Information</h2>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">✅</span><div>To provide and maintain the App and your account</div></li>
            <li className="about-feature"><span className="about-feature-icon">✅</span><div>To sync your reading progress across devices</div></li>
            <li className="about-feature"><span className="about-feature-icon">✅</span><div>To send transactional emails (email confirmation, password reset)</div></li>
            <li className="about-feature"><span className="about-feature-icon">✅</span><div>To display your public profile and content to other users</div></li>
            <li className="about-feature"><span className="about-feature-icon">✅</span><div>To improve the App using anonymized analytics</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            We do <strong>not</strong> sell your data. We do <strong>not</strong> use your data for advertising.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">4. Third-Party Services</h2>
          <p className="about-section-body">We use the following third-party services to operate the App:</p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">🔧</span><div><strong>Supabase</strong> — database, authentication, and file storage</div></li>
            <li className="about-feature"><span className="about-feature-icon">🔧</span><div><strong>Vercel</strong> — hosting and deployment</div></li>
            <li className="about-feature"><span className="about-feature-icon">🔧</span><div><strong>Resend</strong> — transactional email delivery</div></li>
            <li className="about-feature"><span className="about-feature-icon">🔧</span><div><strong>Google Analytics</strong> — anonymized usage analytics</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            Each of these services has their own privacy policy governing their data handling.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">5. Data Retention</h2>
          <p className="about-section-body">
            Your data is retained for as long as your account is active. If you delete your account, your personal information and content will be removed from our systems within a reasonable timeframe, except where retention is required by law.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">6. Your Rights</h2>
          <p className="about-section-body">Depending on your location, you may have the right to:</p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">📋</span><div>Access the personal data we hold about you</div></li>
            <li className="about-feature"><span className="about-feature-icon">✏️</span><div>Correct inaccurate data via your profile settings</div></li>
            <li className="about-feature"><span className="about-feature-icon">🗑️</span><div>Request deletion of your account and data</div></li>
            <li className="about-feature"><span className="about-feature-icon">📤</span><div>Request a copy of your data</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            To exercise any of these rights, contact us through the App's forum or via nwtprogress.com.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">7. Cookies</h2>
          <p className="about-section-body">
            The App uses browser localStorage to store your theme preference and cached data for offline use. Google Analytics uses cookies to track anonymized usage. You can disable cookies in your browser settings or use an ad blocker to prevent analytics tracking.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">8. Children's Privacy</h2>
          <p className="about-section-body">
            The App is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us so we can remove it.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">9. Changes to This Policy</h2>
          <p className="about-section-body">
            We may update this Privacy Policy from time to time. We will update the "Last updated" date at the top of this page. Continued use of the App after changes are posted constitutes your acceptance of the updated policy.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">10. Contact</h2>
          <p className="about-section-body">
            If you have any questions or concerns about this Privacy Policy, please reach out via the community forum or through nwtprogress.com.
          </p>
        </section>

      </div>

    </div>
  );
}
