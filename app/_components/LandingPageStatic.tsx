import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

async function getLatestPosts() {
  try {
    const { data } = await getSupabase()
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

async function getUserCount() {
  try {
    const { count } = await getSupabase()
      .from("profiles")
      .select("id", { count: "exact", head: true });
    return Math.max(count ?? 0, 500);
  } catch {
    return 500;
  }
}

const FEATURE_ICON = {
  cal: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  note: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>,
  clip: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  ai: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/></svg>,
  msg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  group: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  book: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  brain: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/></svg>,
  chat: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  pencil: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>,
  fire: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
};

const FAQS = [
  { q: "Is JW Study affiliated with the Watch Tower Society or jw.org?", a: "No. JW Study is an independent tool built by a publisher to help fellow Witnesses track Bible reading and study. We are not endorsed by, sponsored by, or connected to the Watch Tower Bible and Tract Society. All Bible text and references link out to the official jw.org and JW Library." },
  { q: "Is it really free?", a: "Yes. JW Study is 100% free — no trial, no card, no hidden tiers. Everything on the site is free to use." },
  { q: "Do I need to create an account to try it?", a: "No. You can use the full Bible reading tracker without signing up — just visit Try the tracker, check off chapters, and your progress is saved on your device. Create a free account when you're ready to sync across devices and unlock streaks, notes, and reading plans." },
  { q: "Is my data private?", a: "Yes. Your reading progress, notes, and study data are private to you by default. We never share or sell your data. You can delete your account and all data at any time." },
  { q: "Does it work on my phone?", a: "Yes. JW Study is a Progressive Web App — install it on iPhone, Android, or desktop with one tap. It works like a native app, no App Store needed." },
];

export default async function LandingPageStatic() {
  const [posts, userCount] = await Promise.all([getLatestPosts(), getUserCount()]);

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

        <div className="landing-cta-row">
          <button className="landing-cta" type="button">
            <span>Start free — no card</span>
            <span className="landing-cta-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </button>
          <a href="/try" className="landing-cta-secondary">Try the tracker — no signup</a>
        </div>

        <p className="landing-social-proof" aria-label="Community size">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ opacity: 0.7 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Join {userCount.toLocaleString()}+ publishers worldwide
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

      {/* FAQ */}
      <section className="landing-faq" aria-labelledby="landing-faq-title">
        <div className="landing-faq-header">
          <h2 className="landing-faq-title" id="landing-faq-title">Frequently asked questions</h2>
          <p className="landing-faq-sub">Everything you need to know before you sign up.</p>
        </div>
        <div className="landing-faq-list">
          {FAQS.map((item) => (
            <details key={item.q} className="landing-faq-item">
              <summary className="landing-faq-q">
                <span>{item.q}</span>
                <svg className="landing-faq-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <p className="landing-faq-a">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        © {new Date().getFullYear()} JW Study · Lexx Solutionz
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
