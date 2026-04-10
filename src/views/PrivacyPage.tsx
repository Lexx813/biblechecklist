import { useMeta } from "../hooks/useMeta";
import "../styles/about.css";

export default function PrivacyPage({ navigate, darkMode, setDarkMode, i18n, user, onLogout, onUpgrade }) {
  useMeta({ title: "Privacy Policy | JW Study", description: "Read the JW Study privacy policy — how we collect, use, and protect your personal information." });
  return (
    <div className="about-wrap">

      {!user && (
        <div style={{ width: "100%", maxWidth: 720, padding: "16px 24px 0", boxSizing: "border-box" }}>
          <button className="back-btn" onClick={() => navigate("")}>← Home</button>
        </div>
      )}

      <section className="about-hero" style={{ paddingTop: "48px", paddingBottom: "48px" }}>
        <div className="about-hero-glow about-hero-glow--1" />
        <div className="about-hero-glow about-hero-glow--2" />
        <div className="about-hero-inner">
          <div className="about-hero-badge">Legal</div>
          <h1 className="about-hero-title">Privacy Policy</h1>
          <p className="about-hero-sub">Last updated: March 31, 2026</p>
        </div>
      </section>

      <div className="about-content" style={{ maxWidth: 720 }}>

        <section className="about-section">
          <h2 className="about-section-title">1. Overview</h2>
          <p className="about-section-body">
            JW Study ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information when you use our App at jwstudy.org.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">2. Information We Collect</h2>
          <p className="about-section-body"><strong>Account information:</strong> When you register, we collect your email address and any optional display name or profile photo you provide.</p>
          <p className="about-section-body"><strong>Reading progress:</strong> We store which Bible chapters you have marked as read so your progress syncs across devices.</p>
          <p className="about-section-body"><strong>User content:</strong> Blog posts, forum threads, replies, comments, notes, and profile information you create are stored and associated with your account.</p>
          <p className="about-section-body"><strong>Content scanning:</strong> All user-submitted content is automatically scanned before it is saved. This scanning checks for prohibited content including personal contact information (email addresses, phone numbers, physical addresses), social media links and handles, insecure links, and profanity. Content that is blocked is not stored.</p>
          <p className="about-section-body"><strong>Usage data:</strong> We use Vercel Analytics to collect anonymized data about how the App is used (pages visited, session duration, device type). No personally identifiable information is sent to analytics services.</p>
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
            <li className="about-feature"><span className="about-feature-icon">✅</span><div>To investigate violations and cooperate with law enforcement where required by law</div></li>
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
            <li className="about-feature"><span className="about-feature-icon">🔧</span><div><strong>Vercel Analytics</strong> — anonymized usage analytics</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            Each of these services has their own privacy policy governing their data handling.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">5. Data Retention</h2>
          <p className="about-section-body">
            Your data is retained for as long as your account is active. If you delete your account, your personal information and content will be removed from our systems within a reasonable timeframe, except where retention is required by law — including data we are legally required to preserve in connection with reports made to law enforcement or child safety authorities.
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
            To exercise any of these rights, contact us through the App's forum or via jwstudy.org.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">7. Cookies &amp; Local Storage</h2>
          <p className="about-section-body">
            The App uses browser localStorage to store your theme preference and cached data for offline use. Vercel Analytics collects anonymized, cookie-free usage data to help improve the App.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title" style={{ color: "var(--text-primary)" }}>
            🛡️ 8. Children's Privacy &amp; Child Safety
          </h2>
          <p className="about-section-body">
            <strong>Age requirement:</strong> This App is intended for users aged 13 and older. Users between 13 and 17 must have a parent or guardian's permission. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has created an account, please contact us immediately so we can remove it.
          </p>
          <p className="about-section-body">
            <strong>Our commitment to child safety:</strong> We take the safety of children on our platform with the utmost seriousness. We actively monitor for and prohibit any content or behavior that could harm, exploit, or sexualize minors. This includes Child Sexual Abuse Material (CSAM), grooming, or any attempt to solicit personal information from minors.
          </p>
          <p className="about-section-body">
            <strong>Mandatory reporting:</strong> We are legally required — and morally committed — to report any apparent child sexual exploitation material or grooming activity discovered on our platform to the appropriate authorities, including:
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">🔴</span><div><strong>NCMEC CyberTipline</strong> (CyberTipLine.org) — as required by U.S. federal law (18 U.S.C. § 2258A)</div></li>
            <li className="about-feature"><span className="about-feature-icon">🔴</span><div><strong>Local law enforcement</strong> in the jurisdiction where the violation occurred</div></li>
            <li className="about-feature"><span className="about-feature-icon">🔴</span><div><strong>The Internet Watch Foundation (IWF)</strong> for international cases</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            When making such reports, we provide all relevant data including account information, IP addresses, timestamps, and content. This data sharing is required by law and is not subject to the privacy protections described elsewhere in this policy.
          </p>
          <p className="about-section-body">
            <strong>Parental guidance:</strong> We encourage parents and guardians to review their child's use of this App. If you have concerns about content or interactions your child has encountered on JW Study, please report it using the in-app report function or contact us directly.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">9. Law Enforcement Requests</h2>
          <p className="about-section-body">
            We may disclose your information to law enforcement, government agencies, or other authorized parties when required by law, court order, or when we believe in good faith that disclosure is necessary to prevent harm, protect the safety of any person, or respond to an emergency.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">10. Changes to This Policy</h2>
          <p className="about-section-body">
            We may update this Privacy Policy from time to time. We will update the "Last updated" date at the top of this page. Continued use of the App after changes are posted constitutes your acceptance of the updated policy.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">11. Contact</h2>
          <p className="about-section-body">
            If you have any questions or concerns about this Privacy Policy, please reach out via the community forum or through jwstudy.org.
          </p>
        </section>

      </div>

    </div>
  );
}
