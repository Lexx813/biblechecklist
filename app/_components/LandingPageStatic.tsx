import { createClient } from "@supabase/supabase-js";

async function getLatestPosts() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data } = await supabase
      .from("blog_posts")
      .select("title, slug, excerpt, cover_url")
      .eq("published", true)
      .eq("lang", "en")
      .order("created_at", { ascending: false })
      .limit(3);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function LandingPageStatic() {
  const posts = await getLatestPosts();

  return (
    <div className="landing-wrap" role="main" id="main-content">
      {/* Animated background */}
      <div className="landing-bg" aria-hidden="true">
        <div className="landing-orb landing-orb--1" />
        <div className="landing-orb landing-orb--2" />
        <div className="landing-orb landing-orb--3" />
        <div className="landing-orb landing-orb--4" />
        <div className="landing-orb landing-orb--5" />
        <div className="landing-orb landing-orb--gold" />
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
          <span className="landing-icon" style={{ color: "#c084fc" }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
        </div>

        <div className="landing-badge">✦ New World Translation · 66 Books</div>

        <h1 className="landing-title">
          Grow Closer to Jehovah
          <span className="landing-title-accent">One Chapter at a Time</span>
        </h1>

        <p className="landing-subtitle">
          Bible reading tracker, study notes, meeting prep, and AI study tools — built for Jehovah&apos;s Witnesses.
        </p>

        <div className="landing-features">
          {[
            { icon: <svg key="book" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>, label: "66 Books" },
            { icon: <svg key="check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>, label: "Track Chapters" },
            { icon: <svg key="cal" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label: "Reading Plans" },
            { icon: <svg key="ai" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/></svg>, label: "AI Study Tools" },
            { icon: <svg key="clip" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>, label: "Meeting Prep" },
          ].map(({ icon, label }) => (
            <div key={label} className="landing-feature">
              {icon}
              <span>{label}</span>
            </div>
          ))}
        </div>

        <button className="landing-cta" type="button">
          <span>Start Your Journey</span>
          <span className="landing-cta-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </button>

        <p className="landing-social-proof" aria-label="Community size">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ opacity: 0.7 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Join 500+ publishers worldwide
        </p>

        {/* HOW IT WORKS — this is the LCP element */}
        <div className="landing-how">
          <p className="landing-how-label">How it works</p>
          <div className="landing-how-steps">
            <div className="landing-how-step">
              <span className="landing-how-num">1</span>
              <strong>Sign up free</strong>
              <span>Email or Google, 30 seconds</span>
            </div>
            <div className="landing-how-divider" aria-hidden="true" />
            <div className="landing-how-step">
              <span className="landing-how-num">2</span>
              <strong>Check off chapters</strong>
              <span>All 66 books, chapter by chapter</span>
            </div>
            <div className="landing-how-divider" aria-hidden="true" />
            <div className="landing-how-step">
              <span className="landing-how-num">3</span>
              <strong>Build the habit</strong>
              <span>Streaks, plans, quiz badges</span>
            </div>
          </div>
        </div>

        <div className="landing-testimonials">
          <blockquote className="landing-testimonial">
            <p>&ldquo;Finally a tool that keeps me consistent with my Bible reading.&rdquo;</p>
            <cite>M.G. · México</cite>
          </blockquote>
          <blockquote className="landing-testimonial">
            <p>&ldquo;The quiz levels and badges make studying feel like a game. I&apos;ve learned so much.&rdquo;</p>
            <cite>D.K. · United Kingdom</cite>
          </blockquote>
          <blockquote className="landing-testimonial">
            <p>&ldquo;Tracking all 66 books with the heatmap keeps me motivated every single day.&rdquo;</p>
            <cite>A.P. · Brasil</cite>
          </blockquote>
        </div>

        <p className="landing-signin">
          Already have an account?{" "}
          <button className="landing-signin-link" type="button">Sign in</button>
        </p>
      </div>

      {/* Featured Blog Posts */}
      {posts.length > 0 && (
        <section className="landing-blog">
          <div className="landing-blog-header">
            <h2 className="landing-blog-title">From the Blog</h2>
            <p className="landing-blog-sub">Bible study insights for Jehovah&apos;s Witnesses</p>
          </div>
          <div className="landing-blog-grid">
            {posts.map((post) => (
              <a key={post.slug} href={`/blog/${post.slug}`} className="landing-blog-card">
                {post.cover_url && (
                  <div className="landing-blog-img-wrap">
                    <img src={post.cover_url} alt={post.title} className="landing-blog-img" loading="lazy" />
                  </div>
                )}
                <div className="landing-blog-content">
                  <h3 className="landing-blog-post-title">{post.title}</h3>
                  {post.excerpt && <p className="landing-blog-excerpt">{post.excerpt}</p>}
                </div>
              </a>
            ))}
          </div>
          <a href="/blog" className="landing-blog-all">View all articles →</a>
        </section>
      )}

      {/* Pricing */}
      <section className="landing-pricing">
        <div className="landing-pricing-header">
          <h2 className="landing-pricing-title">Simple, transparent pricing</h2>
          <p className="landing-pricing-sub">Start free. Upgrade when you&apos;re ready to go deeper.</p>
        </div>

        <div className="landing-pricing-cards">
          {/* Free plan */}
          <div className="landing-plan">
            <p className="landing-plan-name">Free</p>
            <div className="landing-plan-price">
              <span className="landing-plan-amount">$0</span>
              <span className="landing-plan-period">/ forever</span>
            </div>
            <p className="landing-plan-desc">Everything you need to start tracking your Bible reading.</p>
            <ul className="landing-plan-features">
              {[
                { icon: "📖", label: "Reading Tracker", desc: "Track all 66 books chapter by chapter" },
                { icon: "🧠", label: "Bible Quiz", desc: "1,000+ questions across 12 themes" },
                { icon: "💬", label: "Community Forum", desc: "Discuss and learn together" },
                { icon: "✍️", label: "Blog", desc: "Read and write study articles" },
                { icon: "🔥", label: "Streaks & Heatmap", desc: "Build a daily reading habit" },
              ].map(f => (
                <li key={f.label} className="landing-plan-feature landing-plan-feature--detailed">
                  <span className="landing-plan-feature-icon">{f.icon}</span>
                  <span><strong>{f.label}</strong><span className="landing-plan-feature-desc">{f.desc}</span></span>
                </li>
              ))}
            </ul>
            <button className="landing-plan-cta landing-plan-cta--ghost" type="button">Get Started Free</button>
          </div>

          {/* Premium plan */}
          <div className="landing-plan landing-plan--premium">
            <div className="landing-plan-popular">Most Popular</div>
            <p className="landing-plan-name">Premium</p>
            <div className="landing-plan-price">
              <span className="landing-plan-amount">$3</span>
              <span className="landing-plan-period">/ month</span>
            </div>
            <p className="landing-plan-desc">Go deeper with structured plans, notes, messaging, and AI.</p>
            <ul className="landing-plan-features">
              {[
                { icon: "📅", label: "Reading Plans", desc: "Structured multi-week study plans" },
                { icon: "📝", label: "Study Notes", desc: "Rich-text notes tied to passages" },
                { icon: "📋", label: "Meeting Prep", desc: "CLAM + Watchtower study checklists" },
                { icon: "✨", label: "AI Study Assistant", desc: "Ask anything about any verse" },
                { icon: "💬", label: "Direct Messages", desc: "Private conversations with members" },
                { icon: "👥", label: "Study Groups", desc: "Group chat and progress tracking" },
              ].map(f => (
                <li key={f.label} className="landing-plan-feature landing-plan-feature--detailed">
                  <span className="landing-plan-feature-icon">{f.icon}</span>
                  <span><strong>{f.label}</strong><span className="landing-plan-feature-desc">{f.desc}</span></span>
                </li>
              ))}
            </ul>
            <button className="landing-plan-cta landing-plan-cta--primary" type="button">
              Start 7-Day Free Trial
            </button>
            <p className="landing-plan-note">Cancel anytime · No commitment</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        © {new Date().getFullYear()} NWT Progress · Lexx Solutionz
        {" · "}
        <a href="/blog" className="landing-footer-link">Blog</a>
        {" · "}
        <a href="/terms" className="landing-footer-link">Terms of Service</a>
        {" · "}
        <a href="/privacy" className="landing-footer-link">Privacy Policy</a>
      </footer>
    </div>
  );
}
