import PageNav from "./PageNav";
import "../styles/about.css";

export default function AboutPage({ navigate, darkMode, setDarkMode, i18n, user, onLogout }) {
  return (
    <div className="about-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />

      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-glow about-hero-glow--1" />
        <div className="about-hero-glow about-hero-glow--2" />
        <div className="about-hero-inner">
          <div className="about-hero-badge">📖 About NWT Progress</div>
          <h1 className="about-hero-title">A Home for Bible Readers</h1>
          <p className="about-hero-sub">
            Track your reading, connect with fellow students, and grow in your love for God's Word.
          </p>
        </div>
      </section>

      <div className="about-content">

        {/* Purpose */}
        <section className="about-section">
          <div className="about-section-icon">🎯</div>
          <h2 className="about-section-title">Why This App Exists</h2>
          <p className="about-section-body">
            NWT Progress was built with one simple goal: give Bible students a <strong>persistent,
            cross-device tracker</strong> for their Bible reading. Whether you're on your phone at the
            Kingdom Hall, on your laptop at home, or on a tablet during family worship — your progress
            is always with you.
          </p>
          <p className="about-section-body">
            Beyond tracking, we wanted to create a space where people studying with Jehovah's Witnesses
            — and active Witnesses themselves — can encourage one another, share thoughts, and
            grow together as a community of Bible students.
          </p>
        </section>

        {/* Who it's for */}
        <section className="about-section about-section--card-row">
          <h2 className="about-section-title about-section-title--center">Who Is This For?</h2>
          <div className="about-cards">
            <div className="about-card">
              <div className="about-card-icon">📚</div>
              <h3 className="about-card-title">Bible Students</h3>
              <p className="about-card-body">
                Those who are studying with Jehovah's Witnesses and want to follow along
                in the New World Translation as they learn.
              </p>
            </div>
            <div className="about-card">
              <div className="about-card-icon">🕊️</div>
              <h3 className="about-card-title">Active Witnesses</h3>
              <p className="about-card-body">
                Jehovah's Witnesses looking to log their personal Bible reading and connect
                with a community that shares the same values.
              </p>
            </div>
            <div className="about-card">
              <div className="about-card-icon">👨‍👩‍👧‍👦</div>
              <h3 className="about-card-title">Families & Groups</h3>
              <p className="about-card-body">
                Families doing family worship, or study groups wanting to encourage
                each other's reading progress and share insights.
              </p>
            </div>
          </div>
        </section>

        {/* NWT / JW Library */}
        <section className="about-section about-section--highlight">
          <div className="about-highlight-inner">
            <div className="about-highlight-icon">📱</div>
            <div>
              <h2 className="about-highlight-title">Works Alongside JW Library</h2>
              <p className="about-highlight-body">
                NWT Progress is designed as a <strong>companion to the JW Library app</strong>.
                Do your reading in JW Library — where you can access a free digital copy of the
                New World Translation — then come here to log your chapters, take notes, and
                share your journey with the community.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="about-section">
          <h2 className="about-section-title about-section-title--center">What You Can Do Here</h2>
          <ul className="about-features">
            <li className="about-feature">
              <span className="about-feature-icon">✅</span>
              <div>
                <strong>Track every chapter</strong> — mark chapters read across all 66 books of the Bible,
                with your progress saved to the cloud so it follows you everywhere.
              </div>
            </li>
            <li className="about-feature">
              <span className="about-feature-icon">📝</span>
              <div>
                <strong>Save personal notes</strong> — write private notes tied to any book and chapter
                as you study.
              </div>
            </li>
            <li className="about-feature">
              <span className="about-feature-icon">💬</span>
              <div>
                <strong>Join the community forum</strong> — discuss Bible topics, ask questions,
                and encourage fellow students.
              </div>
            </li>
            <li className="about-feature">
              <span className="about-feature-icon">🧠</span>
              <div>
                <strong>Test your knowledge</strong> — take Bible quizzes and earn badges as you
                grow in your understanding of Scripture.
              </div>
            </li>
            <li className="about-feature">
              <span className="about-feature-icon">👥</span>
              <div>
                <strong>Follow other readers</strong> — see activity from the people you follow
                and share your own updates with your community.
              </div>
            </li>
            <li className="about-feature">
              <span className="about-feature-icon">📊</span>
              <div>
                <strong>Share your progress</strong> — generate a shareable image of your reading
                progress to encourage others.
              </div>
            </li>
          </ul>
        </section>

        {/* Creator */}
        <section className="about-section about-section--creator">
          <div className="about-creator-card">
            <div className="about-creator-avatar">L</div>
            <div className="about-creator-info">
              <div className="about-creator-label">Created by</div>
              <h2 className="about-creator-name">Luis</h2>
              <p className="about-creator-bio">
                Luis is a Bible student and Jehovah's Witness who built NWT Progress out of a
                personal need — a simple, reliable way to track Bible reading across any device,
                without losing progress. What started as a personal tool grew into a full community
                platform for others walking the same spiritual journey.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <section className="about-cta">
            <h2 className="about-cta-title">Ready to Start?</h2>
            <p className="about-cta-sub">Create a free account and begin tracking your Bible reading today.</p>
            <button className="about-cta-btn" onClick={() => navigate("home")}>
              Get Started — It's Free
            </button>
          </section>
        )}

      </div>

      <footer className="about-footer">
        <p>NWT Progress is an independent community project and is not affiliated with or endorsed by Jehovah's Witnesses or the Watch Tower Society.</p>
      </footer>
    </div>
  );
}
