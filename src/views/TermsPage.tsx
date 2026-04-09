import { useMeta } from "../hooks/useMeta";
import "../styles/about.css";

export default function TermsPage({ navigate, darkMode, setDarkMode, i18n, user, onLogout, onUpgrade }) {
  useMeta({ title: "Terms of Service | JW Study", description: "Review the JW Study terms of service governing use of the Bible reading tracker and community features." });
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
          <h1 className="about-hero-title">Terms of Service</h1>
          <p className="about-hero-sub">Last updated: March 31, 2026</p>
        </div>
      </section>

      <div className="about-content" style={{ maxWidth: 720 }}>

        <section className="about-section">
          <h2 className="about-section-title">1. Acceptance of Terms</h2>
          <p className="about-section-body">
            By accessing or using JW Study ("the App") at nwtprogress.com, you agree to be bound by these Terms of Service. If you do not agree, please do not use the App.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">2. Description of Service</h2>
          <p className="about-section-body">
            JW Study is a Bible reading tracker and community platform designed for readers of the New World Translation. The App provides tools for tracking reading progress, participating in forums, writing blog posts, taking quizzes, and connecting with other users.
          </p>
          <p className="about-section-body">
            We reserve the right to modify, suspend, or discontinue any part of the service at any time.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">3. User Accounts &amp; Age Requirements</h2>
          <p className="about-section-body">
            You must create an account to access most features. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate information when registering.
          </p>
          <p className="about-section-body">
            <strong>Age requirement:</strong> You must be at least 13 years of age to use this App. Users between the ages of 13 and 17 must have the permission of a parent or legal guardian. By creating an account, you confirm that you meet this requirement and, if under 18, that a parent or guardian has reviewed and agreed to these Terms on your behalf.
          </p>
          <p className="about-section-body">
            If we discover that an account belongs to a user under 13, we will terminate that account and remove associated data without notice.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">4. User Content</h2>
          <p className="about-section-body">
            You retain ownership of content you create (blog posts, forum threads, replies, comments, notes, and profile information). By posting content, you grant JW Study a non-exclusive, royalty-free license to display that content within the App.
          </p>
          <p className="about-section-body">
            You agree not to post content that is:
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Hateful, abusive, harassing, or threatening toward any person or group</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Sexually explicit or pornographic in any form</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Harmful, exploitative, or sexualizing toward minors in any way</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Spam, misinformation, or deliberately misleading</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Infringing on another person's intellectual property</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Illegal under applicable law</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Profane or using language that is obscene, vulgar, or offensive</div></li>
          </ul>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">5. Personal Information &amp; Link Policy</h2>
          <p className="about-section-body">
            To protect the privacy and safety of all users — especially minors — the following are strictly prohibited in all user-generated content, including forum posts, blog posts, comments, profile bios, and display names:
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>Email addresses</strong> — do not share your own or anyone else's email</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>Phone numbers</strong> — including mobile, landline, or WhatsApp numbers</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>Physical addresses</strong> — street addresses, home addresses, or meeting locations</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>Social media links or handles</strong> — links to or @username handles for Facebook, Instagram, Twitter/X, TikTok, Snapchat, YouTube, LinkedIn, Telegram, WhatsApp, Discord, or similar platforms</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>Insecure links (http://)</strong> — only secure links beginning with https:// are permitted</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            These restrictions exist to keep this a safe, private environment and to prevent the App from being used to exchange contact information or redirect users to external platforms. Our systems automatically scan all content before submission and will block any post containing prohibited information.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title" style={{ color: "var(--text-primary)" }}>
            🛡️ 6. Child Safety Policy
          </h2>
          <p className="about-section-body">
            The safety of children is a non-negotiable priority at JW Study. We have a zero-tolerance policy for any content or behavior that endangers, exploits, or sexualizes minors.
          </p>
          <p className="about-section-body"><strong>The following are strictly prohibited and will result in immediate permanent ban:</strong></p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Child Sexual Abuse Material (CSAM) of any kind — images, text, video, or links</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Grooming behavior — attempting to build inappropriate relationships with minors to gain their trust for exploitation</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Soliciting personal information from minors, including age, location, school, or contact details</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Any sexual content directed at or involving minors</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Attempting to move a conversation with a minor to another platform for the purpose of exploitation</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            <strong>We will report violations to authorities.</strong> Any content or behavior that we identify as involving the sexual exploitation of children will be reported immediately to:
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">🔴</span><div><strong>The National Center for Missing &amp; Exploited Children (NCMEC)</strong> via the CyberTipline at CyberTipLine.org — as required by U.S. federal law (18 U.S.C. § 2258A)</div></li>
            <li className="about-feature"><span className="about-feature-icon">🔴</span><div><strong>Local law enforcement</strong> and relevant national authorities in the user's jurisdiction</div></li>
            <li className="about-feature"><span className="about-feature-icon">🔴</span><div><strong>The Internet Watch Foundation (IWF)</strong> for international cases involving child sexual abuse imagery</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            We preserve all relevant account data, IP addresses, timestamps, and content associated with reported violations and will cooperate fully with law enforcement investigations.
          </p>
          <p className="about-section-body">
            <strong>If you witness behavior that may endanger a child on this platform, please report it immediately</strong> using the report function available on any post or profile, or contact us directly. If you believe a child is in immediate danger, contact your local emergency services (911 in the US) first.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">7. Community Standards</h2>
          <p className="about-section-body">
            JW Study is a spiritually-focused community platform. We ask that all users engage respectfully and in a manner consistent with the values of the community. Debates intended to discourage faith or disrespect other users' beliefs are not permitted.
          </p>
          <p className="about-section-body">
            This is a community built on mutual respect and shared faith. Please keep all discussions uplifting, constructive, and free of hostility.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">8. Enforcement &amp; Account Bans</h2>
          <p className="about-section-body">
            Violations of these Terms — including posting prohibited content, attempting to circumvent automated filters, or engaging in harmful behavior toward other users — may result in:
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">⚠️</span><div><strong>Content removal</strong> — violating posts, comments, or profile content will be removed without notice</div></li>
            <li className="about-feature"><span className="about-feature-icon">⚠️</span><div><strong>Temporary suspension</strong> — your account may be suspended pending review</div></li>
            <li className="about-feature"><span className="about-feature-icon">⚠️</span><div><strong>Permanent ban</strong> — serious or repeated violations will result in a permanent ban with no right to appeal</div></li>
            <li className="about-feature"><span className="about-feature-icon">⚠️</span><div><strong>Report to authorities</strong> — violations involving child safety or illegal content will be reported to law enforcement and relevant agencies without prior notice</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            We reserve the right to take enforcement action at our sole discretion. We are not obligated to issue warnings before taking action.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">9. Intellectual Property</h2>
          <p className="about-section-body">
            The JW Study name, logo, design, and original code are the intellectual property of Lexx Solutionz. Scripture quotations are from the New World Translation of the Holy Scriptures and are used for personal and community study purposes.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">10. Disclaimer of Warranties</h2>
          <p className="about-section-body">
            The App is provided "as is" without warranties of any kind. We do not guarantee that the App will be error-free, uninterrupted, or that data will never be lost. Use the App at your own risk.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">11. Limitation of Liability</h2>
          <p className="about-section-body">
            To the fullest extent permitted by law, JW Study and Lexx Solutionz shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">12. Changes to Terms</h2>
          <p className="about-section-body">
            We may update these Terms at any time. Continued use of the App after changes are posted constitutes acceptance of the updated Terms. We will update the "Last updated" date at the top of this page.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">13. Contact</h2>
          <p className="about-section-body">
            If you have questions about these Terms, you can reach us through the App's community forum or via the contact information listed on nwtprogress.com.
          </p>
        </section>

      </div>

    </div>
  );
}
