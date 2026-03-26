import PageNav from "./PageNav";
import { useMeta } from "../hooks/useMeta";
import "../styles/about.css";

export default function TermsPage({ navigate, darkMode, setDarkMode, i18n, user, onLogout }) {
  useMeta({ title: "Terms of Service" });
  return (
    <div className="about-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />

      <section className="about-hero" style={{ paddingTop: "80px", paddingBottom: "48px" }}>
        <div className="about-hero-glow about-hero-glow--1" />
        <div className="about-hero-glow about-hero-glow--2" />
        <div className="about-hero-inner">
          <div className="about-hero-badge">Legal</div>
          <h1 className="about-hero-title">Terms of Service</h1>
          <p className="about-hero-sub">Last updated: March 25, 2026</p>
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
            You retain ownership of content you create (blog posts, forum threads, replies, comments, notes, and profile information). By posting content, you grant NWT Progress a non-exclusive, royalty-free license to display that content within the App.
          </p>
          <p className="about-section-body">
            You agree not to post content that is:
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Hateful, abusive, harassing, or threatening toward any person or group</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Sexually explicit or harmful to minors</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Spam, misinformation, or deliberately misleading</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Infringing on another person's intellectual property</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Illegal under applicable law</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div>Profane or using language that is obscene, vulgar, or offensive</div></li>
          </ul>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">5. Personal Information &amp; Link Policy</h2>
          <p className="about-section-body">
            To protect the privacy and safety of all users, the following are strictly prohibited in all user-generated content — including forum posts, blog posts, comments, profile bios, and display names:
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>Email addresses</strong> — do not share your own or anyone else's email</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>Phone numbers</strong> — including mobile, landline, or WhatsApp numbers</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>Physical addresses</strong> — street addresses, home addresses, or meeting locations</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>Social media links or handles</strong> — links to Facebook, Instagram, Twitter/X, TikTok, Snapchat, YouTube, LinkedIn, Threads, Telegram, WhatsApp, Discord, or similar platforms, as well as @username handles</div></li>
            <li className="about-feature"><span className="about-feature-icon">🚫</span><div><strong>Insecure links (http://)</strong> — only secure links beginning with https:// are permitted</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            These restrictions exist to keep this a safe, private environment and to prevent the App from being used to exchange contact information or redirect users to external platforms. Our systems automatically scan all content before it is submitted and will block any post that contains prohibited information.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">6. Community Standards</h2>
          <p className="about-section-body">
            NWT Progress is a spiritually-focused community platform. We ask that all users engage respectfully and in a manner consistent with the values of the community. Debates intended to discourage faith or disrespect other users' beliefs are not permitted.
          </p>
          <p className="about-section-body">
            This is a community built on mutual respect and shared faith. Please keep all discussions uplifting, constructive, and free of hostility.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">7. Enforcement &amp; Account Bans</h2>
          <p className="about-section-body">
            Violations of these Terms — including posting prohibited content, attempting to circumvent automated filters, or engaging in harmful behavior toward other users — may result in:
          </p>
          <ul className="about-features" style={{ marginTop: 8 }}>
            <li className="about-feature"><span className="about-feature-icon">⚠️</span><div><strong>Content removal</strong> — violating posts, comments, or profile content will be removed without notice</div></li>
            <li className="about-feature"><span className="about-feature-icon">⚠️</span><div><strong>Temporary suspension</strong> — your account may be suspended pending review</div></li>
            <li className="about-feature"><span className="about-feature-icon">⚠️</span><div><strong>Permanent ban</strong> — serious or repeated violations will result in a permanent ban from the App with no right to appeal</div></li>
          </ul>
          <p className="about-section-body" style={{ marginTop: 16 }}>
            We reserve the right to take enforcement action at our sole discretion. The severity of the response will be proportional to the nature of the violation, but we are not obligated to issue warnings before taking action. By using this App, you accept that we may remove your access at any time if these Terms are violated.
          </p>
        </section>

        <section className="about-section">
          <h2 className="about-section-title">9. Intellectual Property</h2>
          <p className="about-section-body">
            The NWT Progress name, logo, design, and original code are the intellectual property of Lexx Solutionz. Scripture quotations are from the New World Translation of the Holy Scriptures and are used for personal and community study purposes.
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
            To the fullest extent permitted by law, NWT Progress and Lexx Solutionz shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App.
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
