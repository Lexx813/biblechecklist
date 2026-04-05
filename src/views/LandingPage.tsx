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
    t("landing.feat1"), t("landing.feat2"), t("landing.feat3"),
    t("landing.feat4"), t("landing.feat5"), t("landing.feat6"),
  ];

  const steps = [
    { num: "1", title: t("landing.step1Title"), desc: t("landing.step1Desc") },
    { num: "2", title: t("landing.step2Title"), desc: t("landing.step2Desc") },
    { num: "3", title: t("landing.step3Title"), desc: t("landing.step3Desc") },
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
            <a href="/blog" className="lp-nav-link">{t("landing.nav.blog")}</a>
            <a href="/about" className="lp-nav-link">{t("landing.nav.about")}</a>
          </nav>

          <div className="lp-nav-actions">
            {i18n && (
              <div className="lp-lang-picker" ref={langRef}>
                <button
                  className="lp-theme-toggle"
                  onClick={() => setLangOpen(o => !o)}
                  aria-label={t("landing.nav.changeLanguage")}
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
              aria-label={dark ? t("landing.nav.switchLight") : t("landing.nav.switchDark")}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button className="lp-nav-signin" onClick={onGetStarted}>{t("landing.nav.signIn")}</button>
            <button className="lp-nav-cta" onClick={onGetStarted}>{t("landing.nav.getStarted")}</button>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-badge">{t("landing.heroBadge")}</div>

          <h1 className="lp-heading">
            {t("landing.heroTitle1")}<br />
            <span className="lp-heading-accent">{t("landing.heroTitle2")}</span>
          </h1>

          <p className="lp-subtitle">{t("landing.heroSub")}</p>

          <div className="lp-hero-actions">
            <button className="lp-cta-primary" onClick={onGetStarted}>
              {t("landing.nav.getStarted")} <ArrowIcon />
            </button>
            <a href="/blog" className="lp-cta-secondary">{t("landing.readBlog")}</a>
          </div>

          <p className="lp-social-proof">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {t("landing.publishersCount", { count: stats.users.toLocaleString() })}
            {stats.chaptersRead > 0 && t("landing.chaptersRead", { count: stats.chaptersRead.toLocaleString() })}
          </p>
        </div>
      </section>

      {/* ── App Preview ─────────────────────────────────────────── */}
      <section className="lp-preview" aria-label="App preview">
        <div className="lp-preview-inner">
          <div className="lp-preview-label">
            <span className="lp-badge">Bible Tracker</span>
            <h2 className="lp-preview-title">See every chapter at a glance</h2>
            <p className="lp-preview-sub">Tap any chapter to mark it read — or select individual verses. Your progress is always saved and synced.</p>
          </div>
          <div className="lp-phone-wrap">
            <div className="lp-phone">
              <div className="lp-phone-bar">
                <span className="lp-phone-dot" /><span className="lp-phone-dot" /><span className="lp-phone-dot" />
                <span className="lp-phone-title">NWT Progress</span>
              </div>
              <div className="lp-phone-screen">
                {/* Book 1 — Genesis */}
                <div className="lp-mock-book">
                  <div className="lp-mock-book-header">
                    <div className="lp-mock-book-info">
                      <span className="lp-mock-num">1</span>
                      <div>
                        <div className="lp-mock-book-name">Genesis</div>
                        <div className="lp-mock-book-sub">Gen · 50 chapters</div>
                      </div>
                    </div>
                    <div className="lp-mock-progress">
                      <span className="lp-mock-frac">32/50</span>
                      <div className="lp-mock-ring">
                        <svg viewBox="0 0 32 32" aria-hidden="true">
                          <circle cx="16" cy="16" r="13" fill="none" stroke="var(--lp-border)" strokeWidth="3"/>
                          <circle cx="16" cy="16" r="13" fill="none" stroke="#6A3DAA" strokeWidth="3"
                            strokeDasharray="81.68" strokeDashoffset="27.77" strokeLinecap="round"
                            transform="rotate(-90 16 16)"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="lp-mock-grid">
                    {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32].map(ch => (
                      <div key={ch} className="lp-mock-pill lp-mock-pill--done">{ch}</div>
                    ))}
                    <div className="lp-mock-pill lp-mock-pill--partial">33</div>
                    {[34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50].map(ch => (
                      <div key={ch} className="lp-mock-pill">{ch}</div>
                    ))}
                  </div>
                </div>
                {/* Book 2 — Exodus */}
                <div className="lp-mock-book lp-mock-book--collapsed">
                  <div className="lp-mock-book-header">
                    <div className="lp-mock-book-info">
                      <span className="lp-mock-num">2</span>
                      <div>
                        <div className="lp-mock-book-name">Exodus</div>
                        <div className="lp-mock-book-sub">Exo · 40 chapters</div>
                      </div>
                    </div>
                    <div className="lp-mock-progress">
                      <span className="lp-mock-frac">40/40</span>
                      <div className="lp-mock-ring lp-mock-ring--full">
                        <svg viewBox="0 0 32 32" aria-hidden="true">
                          <circle cx="16" cy="16" r="13" fill="none" stroke="#6A3DAA" strokeWidth="3"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Book 3 — Leviticus */}
                <div className="lp-mock-book lp-mock-book--collapsed">
                  <div className="lp-mock-book-header">
                    <div className="lp-mock-book-info">
                      <span className="lp-mock-num">3</span>
                      <div>
                        <div className="lp-mock-book-name">Leviticus</div>
                        <div className="lp-mock-book-sub">Lev · 27 chapters</div>
                      </div>
                    </div>
                    <div className="lp-mock-progress">
                      <span className="lp-mock-frac">0/27</span>
                      <div className="lp-mock-ring">
                        <svg viewBox="0 0 32 32" aria-hidden="true">
                          <circle cx="16" cy="16" r="13" fill="none" stroke="var(--lp-border)" strokeWidth="3"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lp-phone-tabbar">
                <div className="lp-phone-tab">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  <span>Home</span>
                </div>
                <div className="lp-phone-tab lp-phone-tab--active">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  <span>Bible</span>
                </div>
                <div className="lp-phone-tab">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span>Messages</span>
                </div>
                <div className="lp-phone-tab">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <span>Profile</span>
                </div>
              </div>
            </div>
            {/* Floating verse-modal callout */}
            <div className="lp-phone-callout">
              <div className="lp-callout-dot lp-callout-dot--done" />
              <span>64% read</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Pills ────────────────────────────────────────── */}
      <section className="lp-features">
        <div className="lp-features-inner">
          {features.map(f => (
            <div key={f} className="lp-feature-pill">
              <span className="lp-feature-check"><CheckIcon /></span>
              {f}
            </div>
          ))}
        </div>
      </section>

      {/* ── From the Blog ────────────────────────────────────────── */}
      {featuredPosts.length > 0 && (
        <section className="lp-blog">
          <div className="lp-section-inner">
            <div className="lp-section-header">
              <h2 className="lp-section-title">{t("landing.blogTitle")}</h2>
              <p className="lp-section-sub">{t("landing.blogSub")}</p>
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
                    <span className="lp-blog-read">{t("landing.readArticle")}</span>
                  </div>
                </a>
              ))}
            </div>
            <div className="lp-blog-footer">
              <a href="/blog" className="lp-blog-all">{t("landing.viewAll")}</a>
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="lp-how">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <h2 className="lp-section-title">{t("landing.howTitle")}</h2>
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
            <h2 className="lp-section-title">{t("landing.testiTitle")}</h2>
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
          <h2 className="lp-cta-banner-title">{t("landing.ctaTitle")}</h2>
          <p className="lp-cta-banner-sub">{t("landing.ctaSub")}</p>
          <button className="lp-cta-primary lp-cta-primary--large" onClick={onGetStarted}>
            {t("landing.createAccount")} <ArrowIcon />
          </button>
          <p className="lp-cta-signin">
            {t("landing.alreadyHave")}{" "}
            <button className="lp-text-link" onClick={onGetStarted}>{t("landing.nav.signIn")}</button>
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
            <a href="/blog" className="lp-footer-link">{t("landing.nav.blog")}</a>
            <a href="/about" className="lp-footer-link">{t("landing.nav.about")}</a>
            <a href="/terms" className="lp-footer-link">{t("landing.footerTerms")}</a>
            <a href="/privacy" className="lp-footer-link">{t("landing.footerPrivacy")}</a>
          </nav>
          <p className="lp-footer-copy">{t("landing.footerCopy", { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
}
