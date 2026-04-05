import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../styles/landing.css";
import LanguageSelect from "../components/LanguageSelect";
import { supabase } from "../lib/supabase";

const IconBook = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const FEATURE_ICONS = {
  book: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  notes: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  forum: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  blog: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
};

function useFeaturedPosts() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("title, slug, excerpt, cover_url")
      .eq("published", true)
      .eq("lang", "en")
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setPosts(data); });
  }, []);
  return posts;
}

function useCommunityStats() {
  const [stats, setStats] = useState({ users: 500, chaptersRead: 0, spotsLeft: null });
  useEffect(() => {
    async function load() {
      try {
        const [{ count }, { data: chapters }, { data: spots }] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.rpc("get_global_chapter_count").maybeSingle(),
          supabase.rpc("get_early_adopter_spots_left").maybeSingle(),
        ]);
        setStats({
          users: Math.max(count ?? 500, 500),
          chaptersRead: (chapters as number) ?? 0,
          spotsLeft: spots ?? null,
        });
      } catch {}
    }
    load();
  }, []);
  return stats;
}


export default function LandingPage({ onGetStarted }) {
  const { t } = useTranslation();
  const communityStats = useCommunityStats();
  const featuredPosts = useFeaturedPosts();

  const FREE_FEATURES = [
    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>, label: t("landing.freeFeatureReadingTrackerLabel"), desc: t("landing.freeFeatureReadingTrackerDesc") },
    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, label: t("landing.freeFeatureQuizLabel"), desc: t("landing.freeFeatureQuizDesc") },
    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label: t("landing.freeFeatureForumLabel"), desc: t("landing.freeFeatureForumDesc") },
    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>, label: t("landing.freeFeatureBlogLabel"), desc: t("landing.freeFeatureBlogDesc") },
    { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>, label: t("landing.freeFeatureStreaksLabel"), desc: t("landing.freeFeatureStreaksDesc") },
  ];


  const FEATURE_ICONS_V2 = {
    calendar: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    ai: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/>
      </svg>
    ),
    clipboard: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      </svg>
    ),
  };

  const FEATURES = [
    { icon: FEATURE_ICONS.book,          label: t("landing.feature66Books") },
    { icon: FEATURE_ICONS.check,         label: t("landing.featureChapters") },
    { icon: FEATURE_ICONS_V2.calendar,   label: t("landing.featureReadingPlans") },
    { icon: FEATURE_ICONS_V2.ai,         label: t("landing.featureAiTools") },
    { icon: FEATURE_ICONS_V2.clipboard,  label: t("landing.featureMeetingPrep") },
  ];

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

      {/* Language select */}
      <div className="landing-lang">
        <LanguageSelect />
      </div>

      {/* Hero */}
      <div className="landing-hero">
        {/* Pulsing icon */}
        <div className="landing-icon-wrap">
          <div className="landing-icon-ring landing-icon-ring--1" />
          <div className="landing-icon-ring landing-icon-ring--2" />
          <div className="landing-icon-ring landing-icon-ring--3" />
          <span className="landing-icon" style={{ color: "#c084fc" }}><IconBook /></span>
        </div>

        <div className="landing-badge">{t("landing.badge")}</div>

        <h1 className="landing-title">
          {t("landing.titleLine1")}
          <span className="landing-title-accent">{t("landing.titleAccent")}</span>
        </h1>

        <p className="landing-subtitle">{t("landing.subtitle")}</p>

        <div className="landing-features">
          {FEATURES.map(({ icon, label }) => (
            <div key={label} className="landing-feature">
              {icon}
              <span>{label}</span>
            </div>
          ))}
        </div>

        {communityStats.spotsLeft !== null && communityStats.spotsLeft > 0 && (
          <div className="landing-promo" role="status" aria-live="polite">
            <span className="landing-promo-fire">🎁</span>
            <span>
              <strong>{t("landing.promoTitle")}</strong>
              {" — "}
              {t("landing.promoSpotsLeft", { count: communityStats.spotsLeft })}
            </span>
          </div>
        )}

        <button className="landing-cta" onClick={onGetStarted}>
          <span>{communityStats.spotsLeft > 0 ? t("landing.ctaPromo") : t("landing.cta")}</span>
          <span className="landing-cta-arrow"><IconArrow /></span>
        </button>

        <p className="landing-social-proof" aria-label="Community size">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ opacity: 0.7 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {t("landing.joinPublishers", { count: communityStats.users.toLocaleString() })}
          {communityStats.chaptersRead > 0 && ` · ${t("landing.chaptersRead", { count: communityStats.chaptersRead.toLocaleString() })}`}
        </p>

        <div className="landing-how">
          <p className="landing-how-label">{t("landing.howItWorks")}</p>
          <div className="landing-how-steps">
            <div className="landing-how-step">
              <span className="landing-how-num">1</span>
              <strong>{t("landing.howStep1Title")}</strong>
              <span>{t("landing.howStep1Desc")}</span>
            </div>
            <div className="landing-how-divider" aria-hidden="true" />
            <div className="landing-how-step">
              <span className="landing-how-num">2</span>
              <strong>{t("landing.howStep2Title")}</strong>
              <span>{t("landing.howStep2Desc")}</span>
            </div>
            <div className="landing-how-divider" aria-hidden="true" />
            <div className="landing-how-step">
              <span className="landing-how-num">3</span>
              <strong>{t("landing.howStep3Title")}</strong>
              <span>{t("landing.howStep3Desc")}</span>
            </div>
          </div>
        </div>

        <div className="landing-testimonials">
          <blockquote className="landing-testimonial">
            <p>"Finally a tool that keeps me consistent with my Bible reading."</p>
            <cite>M.G. · México</cite>
          </blockquote>
          <blockquote className="landing-testimonial">
            <p>"The quiz levels and badges make studying feel like a game. I've learned so much."</p>
            <cite>D.K. · United Kingdom</cite>
          </blockquote>
          <blockquote className="landing-testimonial">
            <p>"Tracking all 66 books with the heatmap keeps me motivated every single day."</p>
            <cite>A.P. · Brasil</cite>
          </blockquote>
        </div>

        <p className="landing-signin">
          {t("landing.alreadyHaveAccount")}{" "}
          <button className="landing-signin-link" onClick={onGetStarted}>
            {t("landing.signIn")}
          </button>
        </p>
      </div>



      {featuredPosts.length > 0 && (
        <section className="landing-blog">
          <div className="landing-blog-header">
            <h2 className="landing-blog-title">From the Blog</h2>
            <p className="landing-blog-sub">Bible study insights for Jehovah&apos;s Witnesses</p>
          </div>
          <div className="landing-blog-grid">
            {featuredPosts.map((post: any) => (
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
