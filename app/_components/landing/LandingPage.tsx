import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { GetStartedButton, GetStartedLink } from "./GetStartedButton";
import ThemeToggle from "./ThemeToggle";
import CommunityStats from "./CommunityStats";
import FeaturedPosts from "./FeaturedPosts";
import MotionDiv from "./MotionDiv";

/* ── Server-side data fetching ─────────────────────────────────── */

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
      .select("id, title, slug, excerpt, cover_url")
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
    return Math.max(count ?? 500, 500);
  } catch {
    return 500;
  }
}

/* ── SVG Icons (server-safe) ───────────────────────────────────── */

const BookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
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

/* ── Static data ───────────────────────────────────────────────── */

const FEATURES = [
  "66 Books tracked", "Reading plans", "Bible quiz",
  "Community forum", "Study notes", "Meeting prep",
];

const STEPS = [
  { num: "1", title: "Sign up free", desc: "Email or Google — 30 seconds, no credit card" },
  { num: "2", title: "Check off chapters", desc: "Mark chapters as you read across all 66 books" },
  { num: "3", title: "Build the habit", desc: "Streaks, badges, and a community keep you going" },
];

const TESTIMONIALS = [
  { quote: "Finally a tool that keeps me consistent with my Bible reading.", author: "M.G.", location: "M\u00e9xico" },
  { quote: "The quiz levels and badges make studying feel like a game. I've learned so much.", author: "D.K.", location: "United Kingdom" },
  { quote: "Tracking all 66 books with the heatmap keeps me motivated every single day.", author: "A.P.", location: "Brasil" },
];

const FAQS = [
  { q: "Is JW Study affiliated with the Watch Tower Society or jw.org?", a: "No. JW Study is an independent tool built by a publisher to help fellow Witnesses track Bible reading and study. We are not endorsed by, sponsored by, or connected to the Watch Tower Bible and Tract Society. All Bible text and references link out to the official jw.org and JW Library." },
  { q: "Is it really free?", a: "Yes. JW Study is 100% free — no trial, no card, no hidden tiers. Everything on the site is free to use." },
  { q: "Do I need to create an account to try it?", a: "No. You can use the full Bible reading tracker without signing up — just visit Try the tracker, check off chapters, and your progress is saved on your device. Create a free account when you're ready to sync across devices and unlock streaks, notes, and reading plans." },
  { q: "Is my data private?", a: "Yes. Your reading progress, notes, and study data are private to you by default. We never share or sell your data. You can delete your account and all data at any time." },
  { q: "Does it work offline / on my phone?", a: "Yes. JW Study is a Progressive Web App — install it on iPhone, Android, or desktop with one tap. It works like a native app, no App Store needed, and stays in sync across all your devices." },
  { q: "What if I'm not a Jehovah's Witness?", a: "You're welcome here too. JW Study is built around the New World Translation, but anyone studying the Bible is free to use it." },
];

const JW_CARDS = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    title: "JW Library on mobile",
    desc: "Tap any chapter or verse pill and it opens directly in the JW Library app — no copy-pasting, no searching.",
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    title: "JW.org on desktop",
    desc: "On desktop, chapter and verse links open the official NWT on JW.org — always the authorised New World Translation text.",
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    title: "Verse-level precision",
    desc: "Track reading down to the individual verse. Partially read chapters show a distinct state so you always know exactly where you left off.",
  },
];

const INSTALL_CARDS = [
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>,
    title: "iPhone / iPad",
    steps: ["Open in Safari", "Tap the Share button", 'Tap "Add to Home Screen"', "Tap Add"],
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24C15.12 8.29 13.62 8 12 8s-3.12.29-4.47.91L5.65 5.67c-.19-.29-.54-.38-.83-.22-.3.16-.42.54-.26.85L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25S6.31 12.75 7 12.75s1.25.56 1.25 1.25S7.69 15.25 7 15.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/></svg>,
    title: "Android",
    steps: ["Open in Chrome", "Tap the menu (\u22EE)", 'Tap "Install App"', "Tap Install"],
  },
  {
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
    title: "Desktop (Chrome / Edge)",
    steps: ["Open in Chrome or Edge", "Click the install icon in the address bar", 'Click "Install" in the popup', "App opens in its own window"],
  },
];

/* ── Async loader sub-components (stream independently) ────────── */

async function CommunityStatsLoader() {
  const count = await getUserCount();
  return <CommunityStats serverUserCount={count} />;
}

async function FeaturedPostsLoader() {
  const posts = await getLatestPosts();
  return <FeaturedPosts posts={posts} />;
}

/* ── Main server component ─────────────────────────────────────── */

export default function LandingPage() {

  return (
    <div className="flex min-h-screen flex-col bg-[var(--lp-bg)] font-sans text-[var(--lp-text)] transition-colors duration-200">

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 h-[61px] border-b border-[var(--lp-nav-border)] bg-[var(--lp-nav-bg)] backdrop-blur-xl" style={{ contain: "layout" }}>
        <div className="mx-auto flex h-[60px] max-w-[1080px] items-center gap-8 px-6">
          <a href="/" className="flex shrink-0 items-center gap-2.5 text-[15px] font-bold tracking-tight text-[var(--lp-text)] no-underline" aria-label="JW Study home">
            <span className="flex items-center text-[var(--lp-primary)]"><BookIcon /></span>
            <span>JW Study</span>
          </a>

          <nav className="mr-auto hidden gap-1 md:flex" aria-label="Main navigation">
            <a href="/blog" className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--lp-muted)] transition-colors duration-150 hover:bg-[var(--lp-pill-bg)] hover:text-[var(--lp-text)]">Blog</a>
            <a href="/about" className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--lp-muted)] transition-colors duration-150 hover:bg-[var(--lp-pill-bg)] hover:text-[var(--lp-text)]">About</a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <GetStartedButton
              label="Sign in"
              className="hidden cursor-pointer rounded-lg border border-[var(--lp-border)] bg-transparent px-3.5 py-[7px] text-sm font-medium text-[var(--lp-text)] transition-all duration-150 hover:border-[var(--lp-primary)] hover:bg-[var(--lp-pill-bg)] sm:block"
            />
            <GetStartedButton
              label="Get Started"
              className="cursor-pointer rounded-lg border-none bg-[var(--lp-primary)] px-4 py-[7px] text-sm font-semibold text-[var(--lp-primary-text)] transition-all duration-150 hover:bg-[var(--lp-primary-hover)]"
            />
          </div>
        </div>
      </header>

      <main>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="px-6 pb-16 pt-20 text-center md:pb-16 md:pt-20">
        <div className="mx-auto flex max-w-[720px] flex-col items-center gap-6">
          <MotionDiv variant="fadeUp" delay={0}>
            <div className="inline-flex items-center rounded-full bg-[var(--lp-badge-bg)] px-3.5 py-[5px] text-xs font-semibold uppercase tracking-wider text-[var(--lp-badge-text)]">
              Free Bible reading tracker
            </div>
          </MotionDiv>

          <h1 className="m-0 font-display text-[clamp(36px,6vw,60px)] font-semibold leading-[1.15] tracking-tight text-[var(--lp-text)]">
            Grow Closer to Jehovah<br />
            <span className="block text-[var(--lp-primary)]">One Chapter at a Time</span>
          </h1>

          <p className="m-0 max-w-[560px] text-[clamp(15px,2vw,17px)] leading-relaxed text-[var(--lp-muted)]">
            Track your New World Translation reading, earn quiz badges, prep for meetings, and connect with a worldwide community of Jehovah&apos;s Witnesses.
          </p>

          <MotionDiv variant="fadeUp" delay={0.3}>
            <div className="flex flex-wrap items-center justify-center gap-3 max-[480px]:w-full max-[480px]:flex-col">
              <GetStartedButton
                label="Get Started"
                className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border-none bg-[var(--lp-primary)] px-6 py-3.5 text-[15px] font-bold tracking-tight text-white transition-all duration-150 hover:-translate-y-px hover:bg-[var(--lp-primary-hover)] max-[480px]:w-full max-[480px]:justify-center"
              />
              <a href="/try" className="inline-flex items-center rounded-[10px] border border-[var(--lp-border)] bg-[var(--lp-card-bg)] px-6 py-3.5 text-[15px] font-semibold text-[var(--lp-text)] no-underline transition-all duration-150 hover:border-[var(--lp-primary)] hover:bg-[var(--lp-pill-bg)] max-[480px]:w-full max-[480px]:justify-center">
                Try the tracker — no signup
              </a>
            </div>
          </MotionDiv>

          <MotionDiv variant="fadeUp" delay={0.4}>
            <Suspense fallback={<p className="m-0 text-[13px] text-[var(--lp-muted)]">Loading stats…</p>}>
              <CommunityStatsLoader />
            </Suspense>
          </MotionDiv>
        </div>
      </section>

      {/* ── App Preview (phone mockup) ──────────────────────────── */}
      <section className="bg-[var(--lp-bg)] px-6 pb-20 md:px-6 max-md:px-5 max-md:pb-16" aria-label="App preview">
        <div className="mx-auto grid max-w-[1080px] items-center gap-16 md:grid-cols-2 max-md:gap-10 max-md:text-center">
          <MotionDiv variant="slideLeft" className="flex flex-col gap-4 max-md:items-center">
            <span className="inline-flex w-fit items-center rounded-full bg-[var(--lp-badge-bg)] px-3.5 py-[5px] text-xs font-semibold uppercase tracking-wider text-[var(--lp-badge-text)]">
              Bible Tracker
            </span>
            <h2 className="m-0 font-display text-[clamp(28px,4vw,42px)] font-semibold leading-tight tracking-tight text-[var(--lp-text)]">
              See every chapter at a glance
            </h2>
            <p className="m-0 max-w-[400px] text-[15px] leading-relaxed text-[var(--lp-muted)] max-md:max-w-full">
              Tap any chapter to mark it read — or select individual verses. Your progress is always saved and synced.
            </p>
          </MotionDiv>
          <MotionDiv variant="slideRight" className="relative flex items-start justify-center">
            <div className="lp-phone">
              <div className="lp-phone-bar">
                <span className="lp-phone-dot" /><span className="lp-phone-dot" /><span className="lp-phone-dot" />
                <span className="lp-phone-title">JW Study</span>
              </div>
              <div className="lp-phone-screen">
                <div className="lp-mock-appbar">
                  <span className="lp-mock-appbar-title">Bible Tracker</span>
                  <div className="lp-mock-tabs">
                    <span className="lp-mock-tab lp-mock-tab--active">All</span>
                    <span className="lp-mock-tab">OT</span>
                    <span className="lp-mock-tab">NT</span>
                  </div>
                </div>
                <div className="lp-mock-book-grid">
                  <div className="lp-mock-testament">Hebrew Scriptures</div>
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
                  <div className="lp-mock-tile lp-mock-tile--done">
                    <div className="lp-mock-tile-check">{"\u2713"}</div>
                    <div className="lp-mock-tile-name">Exodus</div>
                    <div className="lp-mock-tile-count">40/40</div>
                    <div className="lp-mock-tile-strip"><div className="lp-mock-tile-strip-fill" style={{width:"100%"}} /></div>
                  </div>
                  <div className="lp-mock-tile">
                    <div className="lp-mock-tile-name">Leviticus</div>
                    <div className="lp-mock-tile-count">14/27</div>
                    <div className="lp-mock-tile-strip"><div className="lp-mock-tile-strip-fill" style={{width:"52%"}} /></div>
                  </div>
                  <div className="lp-mock-tile">
                    <div className="lp-mock-tile-name">Numbers</div>
                    <div className="lp-mock-tile-count">0/36</div>
                    <div className="lp-mock-tile-strip"><div className="lp-mock-tile-strip-fill" style={{width:"0%"}} /></div>
                  </div>
                  <div className="lp-mock-tile">
                    <div className="lp-mock-tile-name">Deuteronomy</div>
                    <div className="lp-mock-tile-count">11/34</div>
                    <div className="lp-mock-tile-strip"><div className="lp-mock-tile-strip-fill" style={{width:"32%"}} /></div>
                  </div>
                  <div className="lp-mock-tile lp-mock-tile--done">
                    <div className="lp-mock-tile-check">{"\u2713"}</div>
                    <div className="lp-mock-tile-name">Joshua</div>
                    <div className="lp-mock-tile-count">24/24</div>
                    <div className="lp-mock-tile-strip"><div className="lp-mock-tile-strip-fill" style={{width:"100%"}} /></div>
                  </div>
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
            <div className="lp-phone-callout">
              <div className="lp-callout-dot lp-callout-dot--done" />
              <span>64% read</span>
            </div>
          </MotionDiv>
        </div>
      </section>

      {/* ── JW Integration ───────────────────────────────────────── */}
      <section className="px-6 py-[72px] max-md:px-5 max-md:py-14" style={{ background: "var(--lp-banner-bg)" }} aria-labelledby="lp-integ-title">
        <div className="mx-auto flex max-w-[1080px] flex-col items-center gap-12">
          <MotionDiv variant="fadeUp" className="flex max-w-[620px] flex-col items-center gap-3.5 text-center">
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/55">Built for Jehovah&apos;s Witnesses</div>
            <h2 id="lp-integ-title" className="m-0 font-display text-[clamp(28px,4vw,42px)] font-semibold leading-tight tracking-tight text-white">
              The perfect JW Library companion
            </h2>
            <p className="m-0 text-[15px] leading-relaxed text-white/70">
              Every book, chapter, and verse in the app links directly to the official New World Translation — one tap opens it right where you are.
            </p>
          </MotionDiv>
          <div className="grid w-full gap-5 md:grid-cols-3 max-md:mx-auto max-md:max-w-[440px] max-md:grid-cols-1">
            {JW_CARDS.map((card, i) => (
              <MotionDiv key={card.title} variant="fadeUp" delay={i * 0.1} className="flex cursor-default flex-col gap-3 rounded-2xl border border-white/12 bg-white/[0.07] p-7 transition-all duration-200 hover:border-white/22 hover:bg-white/[0.11]">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/12 text-white">
                  {card.icon}
                </div>
                <h3 className="m-0 text-[15px] font-bold leading-snug text-white">{card.title}</h3>
                <p className="m-0 text-[13px] leading-relaxed text-white/65">{card.desc}</p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Pills ────────────────────────────────────────── */}
      <section className="px-6 pb-16">
        <div className="mx-auto flex max-w-[800px] flex-wrap justify-center gap-2.5">
          {FEATURES.map((f, i) => (
            <MotionDiv key={f} variant="slideLeft" delay={i * 0.07} className="inline-flex items-center gap-[7px] rounded-full border border-[var(--lp-pill-border)] bg-[var(--lp-pill-bg)] px-4 py-2 text-[13px] font-semibold text-[var(--lp-pill-text)]">
              <span className="flex items-center text-[var(--lp-primary)]"><CheckIcon /></span>
              {f}
            </MotionDiv>
          ))}
        </div>
      </section>

      {/* ── Blog ─────────────────────────────────────────────────── */}
      <Suspense fallback={null}>
        <FeaturedPostsLoader />
      </Suspense>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="py-[72px] max-md:py-12">
        <div className="mx-auto max-w-[1080px] px-6">
          <div className="mb-10 text-center">
            <h2 className="m-0 font-display text-[clamp(26px,4vw,38px)] font-semibold tracking-tight text-[var(--lp-text)]">How it works</h2>
          </div>
          <div className="relative grid gap-8 md:grid-cols-3 max-md:mx-auto max-md:max-w-[440px] max-md:grid-cols-1">
            {STEPS.map((s, i) => (
              <MotionDiv key={s.num} variant="fadeUp" delay={i * 0.15} className="relative flex flex-col items-center gap-3 text-center">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--lp-step-num-bg)] text-lg font-extrabold text-[var(--lp-step-num-text)]">
                  {s.num}
                </div>
                <h3 className="m-0 text-[17px] font-bold text-[var(--lp-text)]">{s.title}</h3>
                <p className="m-0 text-sm leading-relaxed text-[var(--lp-muted)]">{s.desc}</p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="border-y border-[var(--lp-border)] bg-[var(--lp-bg-alt)] py-[72px] max-md:py-12">
        <div className="mx-auto max-w-[1080px] px-6">
          <div className="mb-10 text-center">
            <h2 className="m-0 font-display text-[clamp(26px,4vw,38px)] font-semibold tracking-tight text-[var(--lp-text)]">What publishers say</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3 max-md:mx-auto max-md:max-w-[440px] max-md:grid-cols-1">
            {TESTIMONIALS.map((t, i) => (
              <MotionDiv
                key={t.author}
                variant={i === 0 ? "slideLeft" : i === 2 ? "slideRight" : "fadeUp"}
                delay={i * 0.1}
              >
                <blockquote className="m-0 rounded-[14px] border border-[var(--lp-card-border)] bg-[var(--lp-card-bg)] p-6 shadow-[var(--lp-card-shadow)]">
                  <p className="m-0 mb-4 text-[15px] italic leading-relaxed text-[var(--lp-text)]">&ldquo;{t.quote}&rdquo;</p>
                  <cite className="text-xs font-bold uppercase not-italic tracking-wider text-[var(--lp-primary)]">{t.author} · {t.location}</cite>
                </blockquote>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── Install ──────────────────────────────────────────────── */}
      <section className="bg-[var(--lp-bg)] px-6 py-20 max-md:px-5 max-md:py-14" aria-labelledby="lp-install-title">
        <div className="mx-auto flex max-w-[1060px] flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="inline-flex items-center rounded-full bg-[var(--lp-badge-bg)] px-3.5 py-[5px] text-xs font-semibold uppercase tracking-wider text-[var(--lp-badge-text)]">Free App</span>
            <h2 className="m-0 text-[clamp(24px,4vw,34px)] font-extrabold leading-tight text-[var(--lp-text)]" id="lp-install-title">Install on any device</h2>
            <p className="m-0 max-w-[520px] text-base leading-relaxed text-[var(--lp-muted)]">JW Study works like a native app — no App Store needed. Add it to any device in seconds.</p>
          </div>
          <div className="grid w-full gap-5 md:grid-cols-3 max-md:mx-auto max-md:max-w-[400px] max-md:grid-cols-1">
            {INSTALL_CARDS.map((card, i) => (
              <MotionDiv key={card.title} variant="fadeUp" delay={i * 0.1} className="flex flex-col overflow-hidden rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-card-bg)]">
                <h3 className="m-0 mx-6 mt-5 flex items-center gap-[7px] text-[15px] font-bold text-[var(--lp-text)] [&_svg]:shrink-0 [&_svg]:text-[var(--lp-primary)]">
                  {card.icon}
                  {card.title}
                </h3>
                <ol className="m-0 flex list-none flex-col gap-2.5 px-6 pb-7 pt-3">
                  {card.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] leading-normal text-[var(--lp-muted)] [&_strong]:text-[var(--lp-text)]">
                      <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--lp-pill-bg)] text-[11px] font-bold text-[var(--lp-primary)]">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </MotionDiv>
            ))}
          </div>
          <p className="m-0 text-center text-[13px] text-[var(--lp-muted)]">Works on all devices — no download, no App Store, always up to date.</p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="px-6 py-20 max-sm:px-[18px] max-sm:py-14" aria-labelledby="lp-faq-title">
        <div className="mx-auto max-w-[1080px]">
          <MotionDiv variant="fadeUp" className="mb-10 text-center">
            <h2 id="lp-faq-title" className="m-0 mb-2.5 font-display text-[clamp(26px,4vw,38px)] font-semibold tracking-tight text-[var(--lp-text)]">Frequently asked questions</h2>
            <p className="m-0 text-[15px] text-[var(--lp-muted)]">Everything you need to know before you sign up.</p>
          </MotionDiv>
          <div className="mx-auto mt-8 flex max-w-[760px] flex-col gap-3">
            {FAQS.map((item, i) => (
              <MotionDiv key={item.q} variant={i % 2 === 0 ? "slideLeft" : "slideRight"} delay={i * 0.07}>
              <details className="group overflow-hidden rounded-[14px] border border-[var(--lp-border)] bg-[var(--lp-card-bg)] transition-all duration-200 open:border-brand-500/45 open:bg-brand-500/5">
                <summary className="lp-faq-q flex cursor-pointer select-none items-center justify-between gap-4 px-[22px] py-[18px] text-base font-semibold text-[var(--lp-text)] max-sm:px-[18px] max-sm:py-4 max-sm:text-[15px]">
                  <span>{item.q}</span>
                  <svg className="shrink-0 text-brand-500 transition-transform duration-200 group-open:rotate-180" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
                </summary>
                <p className="m-0 px-[22px] pb-5 text-[15px] leading-relaxed text-[var(--lp-muted)] max-sm:px-[18px] max-sm:pb-[18px] max-sm:text-sm">{item.a}</p>
              </details>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="px-6 py-20 text-center max-md:px-5 max-md:py-14" style={{ background: "var(--lp-banner-bg)" }}>
        <MotionDiv variant="fadeUp" className="mx-auto flex max-w-[560px] flex-col items-center gap-4">
          <h2 className="m-0 font-display text-[clamp(28px,4vw,42px)] font-semibold tracking-tight text-white">Start your reading journey today</h2>
          <p className="m-0 text-[15px] text-white/70">Join thousands of publishers tracking their Bible reading.</p>
          <GetStartedButton
            label="Create Your Account"
            className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-[10px] border-none bg-white px-8 py-4 text-base font-bold text-brand-900 transition-all duration-150 hover:bg-brand-50"
          />
          <p className="m-0 text-[13px] text-white/65">
            Already have an account?{" "}
            <GetStartedLink label="Sign in" className="cursor-pointer border-none bg-transparent p-0 text-[inherit] text-sm font-semibold text-white/90 underline hover:text-white" />
          </p>
        </MotionDiv>
      </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-[var(--lp-footer-bg)] px-6 py-8">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-6 max-md:flex-col max-md:items-start max-md:gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white/90">
            <span className="flex text-brand-500"><BookIcon /></span>
            <span>JW Study</span>
          </div>
          <nav className="mr-auto flex gap-1 max-md:mr-0" aria-label="Footer links">
            <a href="/blog" className="rounded-md px-2.5 py-1 text-[13px] text-[var(--lp-footer-link)] no-underline transition-colors duration-150 hover:bg-white/[0.08] hover:text-white">Blog</a>
            <a href="/about" className="rounded-md px-2.5 py-1 text-[13px] text-[var(--lp-footer-link)] no-underline transition-colors duration-150 hover:bg-white/[0.08] hover:text-white">About</a>
            <a href="/terms" className="rounded-md px-2.5 py-1 text-[13px] text-[var(--lp-footer-link)] no-underline transition-colors duration-150 hover:bg-white/[0.08] hover:text-white">Terms</a>
            <a href="/privacy" className="rounded-md px-2.5 py-1 text-[13px] text-[var(--lp-footer-link)] no-underline transition-colors duration-150 hover:bg-white/[0.08] hover:text-white">Privacy</a>
          </nav>
          <p className="m-0 text-xs text-[var(--lp-footer-text)]">&copy; {new Date().getFullYear()} JW Study &middot; Lexx Solutionz</p>
        </div>
      </footer>
    </div>
  );
}
