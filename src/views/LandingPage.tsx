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

function useFeaturedPosts(lang: string) {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, cover_url, lang, translations")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!data) return;
        const filtered = data.filter((p: any) => p.lang === lang || (p.translations && p.translations[lang]));
        setPosts(filtered.slice(0, 3).map((p: any) => {
          const tr = p.translations?.[lang];
          return { ...p, title: tr?.title || p.title, excerpt: tr?.excerpt || p.excerpt };
        }));
      });
  }, [lang]);
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
  const featuredPosts = useFeaturedPosts(currentLangCode);

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
            <a href="/try" className="lp-cta-secondary">Try the tracker — no signup</a>
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
                {/* App bar with tabs */}
                <div className="lp-mock-appbar">
                  <span className="lp-mock-appbar-title">Bible Tracker</span>
                  <div className="lp-mock-tabs">
                    <span className="lp-mock-tab lp-mock-tab--active">All</span>
                    <span className="lp-mock-tab">OT</span>
                    <span className="lp-mock-tab">NT</span>
                  </div>
                </div>

                {/* JW Library-style flat tile grid */}
                <div className="lp-mock-book-grid">
                  {/* Testament divider */}
                  <div className="lp-mock-testament">Hebrew Scriptures</div>

                  {/* Genesis — expanded tile with chapter pills */}
                  <div className="lp-mock-tile lp-mock-tile--expanded">
                    <div className="lp-mock-tile-row">
                      <div>
                        <div className="lp-mock-tile-name">Genesis</div>
                        <div className="lp-mock-tile-count">32 of 50 chapters</div>
                      </div>
                    </div>
                    <div className="lp-mock-ch-grid">
                      {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32].map(ch => (
                        <div key={ch} className="lp-mock-ch lp-mock-ch--done">{ch}</div>
                      ))}
                      <div className="lp-mock-ch lp-mock-ch--partial">33</div>
                      {[34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50].map(ch => (
                        <div key={ch} className="lp-mock-ch">{ch}</div>
                      ))}
                    </div>
                  </div>

                  {/* Exodus — fully done */}
                  <div className="lp-mock-tile lp-mock-tile--done">
                    <div className="lp-mock-tile-check">✓</div>
                    <div className="lp-mock-tile-name">Exodus</div>
                    <div className="lp-mock-tile-count">40/40</div>
                    <div className="lp-mock-tile-strip"><div className="lp-mock-tile-strip-fill" style={{width:"100%"}} /></div>
                  </div>

                  {/* Leviticus — partial */}
                  <div className="lp-mock-tile">
                    <div className="lp-mock-tile-name">Leviticus</div>
                    <div className="lp-mock-tile-count">14/27</div>
                    <div className="lp-mock-tile-strip"><div className="lp-mock-tile-strip-fill" style={{width:"52%"}} /></div>
                  </div>

                  {/* Numbers — not started */}
                  <div className="lp-mock-tile">
                    <div className="lp-mock-tile-name">Numbers</div>
                    <div className="lp-mock-tile-count">0/36</div>
                    <div className="lp-mock-tile-strip"><div className="lp-mock-tile-strip-fill" style={{width:"0%"}} /></div>
                  </div>

                  {/* Deuteronomy — partial */}
                  <div className="lp-mock-tile">
                    <div className="lp-mock-tile-name">Deuteronomy</div>
                    <div className="lp-mock-tile-count">11/34</div>
                    <div className="lp-mock-tile-strip"><div className="lp-mock-tile-strip-fill" style={{width:"32%"}} /></div>
                  </div>

                  {/* Joshua — fully done */}
                  <div className="lp-mock-tile lp-mock-tile--done">
                    <div className="lp-mock-tile-check">✓</div>
                    <div className="lp-mock-tile-name">Joshua</div>
                    <div className="lp-mock-tile-count">24/24</div>
                    <div className="lp-mock-tile-strip"><div className="lp-mock-tile-strip-fill" style={{width:"100%"}} /></div>
                  </div>

                  {/* Judges — not started */}
                  <div className="lp-mock-tile">
                    <div className="lp-mock-tile-name">Judges</div>
                    <div className="lp-mock-tile-count">0/21</div>
                    <div className="lp-mock-tile-strip"><div className="lp-mock-tile-strip-fill" style={{width:"0%"}} /></div>
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
                  <span>Community</span>
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

      {/* ── JW Integration ───────────────────────────────────────── */}
      <section className="lp-integration" aria-labelledby="lp-integ-title">
        <div className="lp-integration-inner">
          <div className="lp-integ-header">
            <div className="lp-integ-eyebrow">Built for Jehovah's Witnesses</div>
            <h2 id="lp-integ-title" className="lp-integ-title">The perfect JW Library companion</h2>
            <p className="lp-integ-sub">Every book, chapter, and verse in the app links directly to the official New World Translation — one tap opens it right where you are.</p>
          </div>
          <div className="lp-integ-grid">
            <div className="lp-integ-card">
              <div className="lp-integ-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <h3 className="lp-integ-card-title">JW Library on mobile</h3>
              <p className="lp-integ-card-desc">Tap any chapter or verse pill and it opens directly in the JW Library app — no copy-pasting, no searching.</p>
            </div>
            <div className="lp-integ-card">
              <div className="lp-integ-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <h3 className="lp-integ-card-title">JW.org on desktop</h3>
              <p className="lp-integ-card-desc">On desktop, chapter and verse links open the official NWT on JW.org — always the authorised New World Translation text.</p>
            </div>
            <div className="lp-integ-card">
              <div className="lp-integ-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <h3 className="lp-integ-card-title">Verse-level precision</h3>
              <p className="lp-integ-card-desc">Track reading down to the individual verse. Partially read chapters show a distinct state so you always know exactly where you left off.</p>
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

      {/* ── Install ──────────────────────────────────────────────── */}
      <section className="lp-install" aria-labelledby="lp-install-title">
        <div className="lp-install-inner">
          <div className="lp-install-header">
            <span className="lp-badge">Free App</span>
            <h2 className="lp-install-title" id="lp-install-title">Install on any device</h2>
            <p className="lp-install-sub">NWT Progress works like a native app — no App Store needed. Add it to any device in seconds.</p>
          </div>

          <div className="lp-install-cards">

            {/* ── iOS ── */}
            <div className="lp-install-card">
              <h3 className="lp-install-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                iPhone / iPad
              </h3>
              <ol className="lp-install-steps">
                <li><span className="lp-install-step-num">1</span><span>Open in <strong>Safari</strong></span></li>
                <li><span className="lp-install-step-num">2</span><span>Tap the <strong>Share</strong> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> button</span></li>
                <li><span className="lp-install-step-num">3</span><span>Tap <strong>"Add to Home Screen"</strong></span></li>
                <li><span className="lp-install-step-num">4</span><span>Tap <strong>Add</strong></span></li>
              </ol>
            </div>

            {/* ── Android ── */}
            <div className="lp-install-card">
              <h3 className="lp-install-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24C15.12 8.29 13.62 8 12 8s-3.12.29-4.47.91L5.65 5.67c-.19-.29-.54-.38-.83-.22-.3.16-.42.54-.26.85L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25S6.31 12.75 7 12.75s1.25.56 1.25 1.25S7.69 15.25 7 15.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/></svg>
                Android
              </h3>
              <ol className="lp-install-steps">
                <li><span className="lp-install-step-num">1</span><span>Open in <strong>Chrome</strong></span></li>
                <li><span className="lp-install-step-num">2</span><span>Tap the <strong>menu</strong> (⋮)</span></li>
                <li><span className="lp-install-step-num">3</span><span>Tap <strong>"Install App"</strong></span></li>
                <li><span className="lp-install-step-num">4</span><span>Tap <strong>Install</strong></span></li>
              </ol>
            </div>

            {/* ── Desktop ── */}
            <div className="lp-install-card">
              <h3 className="lp-install-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                Desktop (Chrome / Edge)
              </h3>
              <ol className="lp-install-steps">
                <li><span className="lp-install-step-num">1</span><span>Open in <strong>Chrome</strong> or <strong>Edge</strong></span></li>
                <li><span className="lp-install-step-num">2</span><span>Click the <strong>install icon</strong> in the address bar</span></li>
                <li><span className="lp-install-step-num">3</span><span>Click <strong>"Install"</strong> in the popup</span></li>
                <li><span className="lp-install-step-num">4</span><span>App opens in its <strong>own window</strong></span></li>
              </ol>
            </div>

          </div>
          <p className="lp-install-note">Works on all devices — no download, no App Store, always up to date.</p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="lp-faq" aria-labelledby="lp-faq-title">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <h2 id="lp-faq-title" className="lp-section-title">Frequently asked questions</h2>
            <p className="lp-section-sub">Everything you need to know before you sign up.</p>
          </div>
          <div className="lp-faq-list">
            {[
              {
                q: "Is NWT Progress affiliated with the Watch Tower Society or jw.org?",
                a: "No. NWT Progress is an independent tool built by a publisher to help fellow Witnesses track Bible reading and study. We are not endorsed by, sponsored by, or connected to the Watch Tower Bible and Tract Society. All Bible text and references link out to the official jw.org and JW Library.",
              },
              {
                q: "Is it really free?",
                a: "Yes. NWT Progress is 100% free — no trial, no card, no hidden tiers. Everything on the site is free to use.",
              },
              {
                q: "Do I need to create an account to try it?",
                a: "No. You can use the full Bible reading tracker without signing up — just visit Try the tracker, check off chapters, and your progress is saved on your device. Create a free account when you're ready to sync across devices and unlock streaks, notes, and reading plans.",
              },
              {
                q: "Is my data private?",
                a: "Yes. Your reading progress, notes, and study data are private to you by default. We never share or sell your data. You can delete your account and all data at any time.",
              },
              {
                q: "Does it work offline / on my phone?",
                a: "Yes. NWT Progress is a Progressive Web App — install it on iPhone, Android, or desktop with one tap. It works like a native app, no App Store needed, and stays in sync across all your devices.",
              },
              {
                q: "What if I'm not a Jehovah's Witness?",
                a: "You're welcome here too. NWT Progress is built around the New World Translation, but anyone studying the Bible is free to use it.",
              },
            ].map((item) => (
              <details key={item.q} className="lp-faq-item">
                <summary className="lp-faq-q">
                  <span>{item.q}</span>
                  <svg className="lp-faq-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                </summary>
                <p className="lp-faq-a">{item.a}</p>
              </details>
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
