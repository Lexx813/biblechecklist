import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "../styles/landing.css";
import { supabase } from "../lib/supabase";
import { LANGUAGES } from "../i18n";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1455541504462-57ebb2a9cec1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519817914152-22d216bb9170?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?auto=format&fit=crop&w=800&q=80",
];

function hashId(id: string) {
  let h = 0;
  for (const c of (id ?? "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function getFallbackImage(id: string) {
  return FALLBACK_IMAGES[hashId(id) % FALLBACK_IMAGES.length];
}

/* ── Hooks ───────────────────────────────────────────────────────── */
function useCommunityStats() {
  const [stats, setStats] = useState({ users: 500, chaptersRead: 0 });
  useEffect(() => {
    async function load() {
      try {
        const [{ count }, { data: chapters }] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.rpc("get_global_chapter_count").maybeSingle(),
        ]);
        setStats({
          users: Math.max(count ?? 500, 500),
          chaptersRead: (chapters as number) ?? 0,
        });
      } catch {}
    }
    load();
  }, []);
  return stats;
}

function useFeaturedPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_url")
      .eq("published", true)
      .eq("lang", "en")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setPosts(data); });
  }, []);
  return posts;
}

function useDarkMode() {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.dataset.theme === "dark"
      : false
  );
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("nwt-theme", next ? "dark" : "light"); } catch {}
  }
  return { dark, toggle };
}

/* ── Icons ───────────────────────────────────────────────────────── */
const BookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const FLAGS: Record<string, string> = { en: "🇺🇸", es: "🇪🇸", pt: "🇧🇷", tl: "🇵🇭", fr: "🇫🇷", zh: "🇨🇳" };

/* ── Main Component ──────────────────────────────────────────────── */
export default function LandingPage({ onGetStarted, i18n }) {
  const { t } = useTranslation();
  const { dark, toggle } = useDarkMode();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const currentLangCode = i18n
    ? (LANGUAGES.find(l => i18n.language?.split("-")[0]?.startsWith(l.code))?.code ?? "en")
    : "en";

  useEffect(() => {
    if (!langOpen) return;
    function handler(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [langOpen]);
  const stats = useCommunityStats();
  const featuredPosts = useFeaturedPosts();

  const features = [
    { label: "66 Books tracked" },
    { label: "Reading plans" },
    { label: "Bible quiz" },
    { label: "Community forum" },
    { label: "Study notes" },
    { label: "Meeting prep" },
  ];

  const steps = [
    { num: "1", title: "Sign up free", desc: "Email or Google — 30 seconds, no credit card" },
    { num: "2", title: "Check off chapters", desc: "Mark chapters as you read across all 66 books" },
    { num: "3", title: "Build the habit", desc: "Streaks, badges, and a community keep you going" },
  ];

  const testimonials = [
    { quote: "Finally a tool that keeps me consistent with my Bible reading.", author: "M.G.", location: "México" },
    { quote: "The quiz levels and badges make studying feel like a game. I've learned so much.", author: "D.K.", location: "United Kingdom" },
    { quote: "Tracking all 66 books with the heatmap keeps me motivated every single day.", author: "A.P.", location: "Brasil" },
  ];

  return (
    <div className="lp-wrap">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <a href="/" className="lp-logo" aria-label="NWT Progress home">
            <span className="lp-logo-icon"><BookIcon /></span>
            <span className="lp-logo-text">NWT Progress</span>
          </a>

          <nav className="lp-nav-links" aria-label="Main navigation">
            <a href="/blog" className="lp-nav-link">Blog</a>
            <a href="/about" className="lp-nav-link">About</a>
          </nav>

          <div className="lp-nav-actions">
            {i18n && (
              <div className="lp-lang-picker" ref={langRef}>
                <button
                  className="lp-theme-toggle"
                  onClick={() => setLangOpen(o => !o)}
                  aria-label="Change language"
                  aria-expanded={langOpen}
                >
                  <span aria-hidden="true">{FLAGS[currentLangCode] ?? "🌐"}</span>
                </button>
                {langOpen && (
                  <div className="lp-lang-menu">
                    {LANGUAGES.map(l => (
                      <button
                        key={l.code}
                        className={`lp-lang-item${l.code === currentLangCode ? " lp-lang-item--active" : ""}`}
                        onClick={() => { i18n.changeLanguage(l.code); setLangOpen(false); }}
                      >
                        <span>{FLAGS[l.code]}</span>
                        <span>{l.label}</span>
                        {l.code === currentLangCode && <span className="lp-lang-check">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              className="lp-theme-toggle"
              onClick={toggle}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button className="lp-nav-signin" onClick={onGetStarted}>Sign in</button>
            <button className="lp-nav-cta" onClick={onGetStarted}>Get Started</button>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-badge">Free Bible reading tracker</div>

          <h1 className="lp-heading">
            Grow Closer to Jehovah<br />
            <span className="lp-heading-accent">One Chapter at a Time</span>
          </h1>

          <p className="lp-subtitle">
            Track your New World Translation reading, earn quiz badges, prep for meetings,
            and connect with a worldwide community of Jehovah's Witnesses.
          </p>

          <div className="lp-hero-actions">
            <button className="lp-cta-primary" onClick={onGetStarted}>
              Get Started <ArrowIcon />
            </button>
            <a href="/blog" className="lp-cta-secondary">Read the Blog</a>
          </div>

          <p className="lp-social-proof">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {stats.users.toLocaleString()}+ publishers worldwide
            {stats.chaptersRead > 0 && ` · ${stats.chaptersRead.toLocaleString()} chapters read`}
          </p>
        </div>
      </section>

      {/* ── Feature Pills ────────────────────────────────────────── */}
      <section className="lp-features">
        <div className="lp-features-inner">
          {features.map(f => (
            <div key={f.label} className="lp-feature-pill">
              <span className="lp-feature-check"><CheckIcon /></span>
              {f.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── From the Blog ────────────────────────────────────────── */}
      {featuredPosts.length > 0 && (
        <section className="lp-blog">
          <div className="lp-section-inner">
            <div className="lp-section-header">
              <h2 className="lp-section-title">From the Blog</h2>
              <p className="lp-section-sub">Bible study insights for Jehovah's Witnesses</p>
            </div>
            <div className="lp-blog-grid">
              {featuredPosts.map(post => (
                <a key={post.slug} href={`/blog/${post.slug}`} className="lp-blog-card">
                  <div className="lp-blog-img-wrap">
                    <img
                      src={post.cover_url || getFallbackImage(post.id)}
                      alt={post.title}
                      className="lp-blog-img"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = getFallbackImage(post.id); }}
                    />
                  </div>
                  <div className="lp-blog-body">
                    <h3 className="lp-blog-title">{post.title}</h3>
                    {post.excerpt && <p className="lp-blog-excerpt">{post.excerpt}</p>}
                    <span className="lp-blog-read">Read article →</span>
                  </div>
                </a>
              ))}
            </div>
            <div className="lp-blog-footer">
              <a href="/blog" className="lp-blog-all">View all articles</a>
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="lp-how">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <h2 className="lp-section-title">How it works</h2>
          </div>
          <div className="lp-steps">
            {steps.map((s, i) => (
              <div key={s.num} className="lp-step">
                <div className="lp-step-num">{s.num}</div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
                {i < steps.length - 1 && <div className="lp-step-line" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="lp-testimonials">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <h2 className="lp-section-title">What publishers say</h2>
          </div>
          <div className="lp-testi-grid">
            {testimonials.map(t => (
              <blockquote key={t.author} className="lp-testi-card">
                <p className="lp-testi-quote">"{t.quote}"</p>
                <cite className="lp-testi-cite">{t.author} · {t.location}</cite>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="lp-cta-banner">
        <div className="lp-cta-banner-inner">
          <h2 className="lp-cta-banner-title">Start your reading journey today</h2>
          <p className="lp-cta-banner-sub">Join thousands of publishers tracking their Bible reading.</p>
          <button className="lp-cta-primary lp-cta-primary--large" onClick={onGetStarted}>
            Create Your Account <ArrowIcon />
          </button>
          <p className="lp-cta-signin">
            Already have an account?{" "}
            <button className="lp-text-link" onClick={onGetStarted}>Sign in</button>
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-footer-logo"><BookIcon /></span>
            <span>NWT Progress</span>
          </div>
          <nav className="lp-footer-links" aria-label="Footer links">
            <a href="/blog" className="lp-footer-link">Blog</a>
            <a href="/about" className="lp-footer-link">About</a>
            <a href="/terms" className="lp-footer-link">Terms</a>
            <a href="/privacy" className="lp-footer-link">Privacy</a>
          </nav>
          <p className="lp-footer-copy">© {new Date().getFullYear()} NWT Progress · Lexx Solutionz</p>
        </div>
      </footer>
    </div>
  );
}
