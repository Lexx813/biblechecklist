import { notFound } from "next/navigation";
import ClientShell from "../_components/ClientShell";
import LandingPage from "../_components/landing/LandingPage";
import { BOOKS } from "../../src/data/books";
import { PLAN_TEMPLATES } from "../../src/data/readingPlanTemplates";
import { STUDY_TOPICS } from "../../src/data/studyTopics";

const BASE = "https://jwstudy.org";
const SEO_HIDE = {
  position: "absolute" as const, width: 1, height: 1,
  overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" as const,
};

function bookToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

const FAQ_ITEMS = [
  {
    question: "Is JW Study affiliated with the Watch Tower Society or jw.org?",
    answer:
      "No. JW Study is an independent tool built by a publisher to help fellow Witnesses track Bible reading and study. We are not endorsed by, sponsored by, or connected to the Watch Tower Bible and Tract Society. All Bible text and references link out to the official jw.org and JW Library.",
  },
  {
    question: "Is it really free?",
    answer:
      "Yes. JW Study is 100% free — no trial, no card, no hidden tiers. Everything on the site is free to use.",
  },
  {
    question: "Do I need to create an account to try it?",
    answer:
      "No. You can use the full Bible reading tracker without signing up — just visit Try the tracker, check off chapters, and your progress is saved on your device. Create a free account when you're ready to sync across devices and unlock streaks, notes, and reading plans.",
  },
  {
    question: "Is my data private?",
    answer:
      "Yes. Your reading progress, notes, and study data are private to you by default. We never share or sell your data. You can delete your account and all data at any time.",
  },
  {
    question: "Does it work offline / on my phone?",
    answer:
      "Yes. JW Study is a Progressive Web App — install it on iPhone, Android, or desktop with one tap. It works like a native app, no App Store needed, and stays in sync across all your devices.",
  },
  {
    question: "What if I'm not a Jehovah's Witness?",
    answer:
      "You're welcome here too. JW Study is built around the New World Translation, but anyone studying the Bible is free to use it.",
  },
];

// 24-hour ISR. The homepage rarely changes content, but Vercel deploys
// invalidate the ISR cache regardless of revalidate value. With multi-deploy
// days, a 1h revalidate was redundant (cache rebuilt on every deploy anyway).
// 24h means every CDN-cache hit between deploys serves at ~50ms TTFB.
export const revalidate = 86400;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const isRoot = !slug || slug.length === 0;
  if (isRoot) return {}; // layout.tsx metadata covers the root
  return { robots: { index: false, follow: false } };
}

// All valid SPA client-side route first-segments
const KNOWN_SPA_ROUTES = new Set([
  "admin", "advanced-quiz", "blog-dash", "bookmarks", "checklist",
  "community", "family-quiz", "feed", "friends", "groups", "history", "home",
  "invite", "leaderboard", "learn", "login", "main", "meeting-prep", "messages",
  "notifications", "premium", "privacy", "profile", "quiz", "reading-plans",
  "referral", "search", "settings", "signup", "study-notes", "study-topics",
  "terms", "trivia", "try", "upgrade", "user", "videos",
]);

// SSR teasers for SPA routes so AI crawlers (GPTBot, PerplexityBot, ClaudeBot —
// which don't execute JS) see useful content instead of the skeleton spinner.
const ROUTE_TEASERS: Record<string, { title: string; description: string }> = {
  "learn": {
    title: "Learn to Study the Bible",
    description: "A free interactive course teaching Jehovah's Witnesses and Bible students how to study the Bible deeply — S.O.A.P., cross-referencing, meditation, and highlighting. Nine short lessons with hands-on exercises.",
  },
  "quiz": {
    title: "Bible Quiz — New World Translation",
    description: "Test your knowledge of the Hebrew and Christian Greek Scriptures. 12 progressive levels of Bible questions drawn from the New World Translation, with badge rewards.",
  },
  "advanced-quiz": {
    title: "Advanced Bible Quiz",
    description: "Deeper Bible knowledge quizzes for experienced students — scripture recall, prophecy, and chronology drawn from the New World Translation.",
  },
  "family-quiz": {
    title: "Family Bible Quiz",
    description: "Challenge your family to a Bible quiz. Share a code, take turns answering, and make family worship fun.",
  },
  "trivia": {
    title: "Bible Trivia Battle",
    description: "Real-time Bible trivia for two teams. Create a room, invite friends, and play head-to-head Bible questions from the New World Translation.",
  },
  "leaderboard": {
    title: "JW Study Leaderboard",
    description: "See the top Bible students by chapters read, badges earned, and community contributions.",
  },
  "reading-plans": {
    title: "Bible Reading Plans",
    description: "Structured reading plans — One Year Bible, Chronological, Gospel-Focused, and more — with progress tracking and streak rewards.",
  },
  "study-notes": {
    title: "Personal Study Notes",
    description: "Save private study notes tied to any Bible chapter or verse. Tag, search, and export your personal Bible study journal.",
  },
  "meeting-prep": {
    title: "Meeting Prep — CLAM and Watchtower Study",
    description: "Prepare for the Christian Life and Ministry meeting and Watchtower study with checklists, scripture references, and notes tied to the week's material.",
  },
  "community": {
    title: "JW Study Community",
    description: "An activity feed of what Bible students are reading, studying, and discussing — reactions, replies, and encouragement.",
  },
  "feed": {
    title: "Study Activity Feed",
    description: "Follow what fellow Bible students are reading and studying across JW Study.",
  },
  "videos": {
    title: "JW Study Videos",
    description: "Short study videos and reflections from the JW Study community.",
  },
  "friends": {
    title: "Friends on JW Study",
    description: "Connect with fellow Bible students, share progress, and send direct messages.",
  },
  "groups": {
    title: "Study Groups",
    description: "Join or create a study group to read the Bible and discuss scripture together.",
  },
  "messages": {
    title: "Messages",
    description: "Private direct messaging between JW Study members, with end-to-end encryption.",
  },
  "history": {
    title: "Reading History",
    description: "A timeline of every chapter you've read, with dates and reading plans.",
  },
  "bookmarks": {
    title: "Bookmarks",
    description: "Scriptures and study notes you've saved for later.",
  },
  "profile": {
    title: "Your Profile",
    description: "Your JW Study profile — reading stats, badges, and study activity.",
  },
  "settings": {
    title: "Account Settings",
    description: "Manage your JW Study account, language, and notification preferences.",
  },
  "premium": {
    title: "JW Study — Free for Everyone",
    description: "JW Study is 100% free. No paid tiers, no locked features, no ads.",
  },
  "search": {
    title: "Search the Bible",
    description: "Semantic search across scriptures, study topics, blog posts, and forum discussions.",
  },
  "notifications": {
    title: "Notifications",
    description: "Your JW Study notifications — replies, reactions, friend requests, and reminders.",
  },
};

export default async function Page({ params }) {
  const { slug } = await params;
  const isRoot = !slug || slug.length === 0;

  if (!isRoot && !KNOWN_SPA_ROUTES.has(slug[0])) {
    notFound();
  }

  if (isRoot) {
    const schemaFAQ = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }}
        />
        {/* Crawler-only sitemap-as-content. The visible H1 lives in LandingPage;
            this section is link-density for AI crawlers (no duplicated H1 to avoid
            cloaking-style flags from Google). */}
        <div style={SEO_HIDE} aria-hidden="true">
          <h2>Explore All 66 Bible Books</h2>
          <ul>
            {BOOKS.map((b) => (
              <li key={b.name}>
                <a href={`${BASE}/books/${bookToSlug(b.name)}`}>Book of {b.name}</a>
              </li>
            ))}
          </ul>

          <h2>Bible Reading Plans</h2>
          <ul>
            {PLAN_TEMPLATES.map((p) => (
              <li key={p.key}>
                <a href={`${BASE}/plans/${p.key}`}>
                  {p.name} — {p.totalDays} days, {p.totalChapters} chapters
                </a>
              </li>
            ))}
          </ul>

          <h2>Bible Study Topics</h2>
          <ul>
            {STUDY_TOPICS.map((t) => (
              <li key={t.slug}>
                <a href={`${BASE}/study-topics/${t.slug}`}>
                  {t.title} — {t.subtitle}
                </a>
              </li>
            ))}
          </ul>

          <h2>More from JW Study</h2>
          <ul>
            <li><a href={`${BASE}/books`}>All Bible Books</a></li>
            <li><a href={`${BASE}/plans`}>All Reading Plans</a></li>
            <li><a href={`${BASE}/study-topics`}>All Study Topics</a></li>
            <li><a href={`${BASE}/messianic-prophecies`}>Messianic Prophecies Fulfilled in Jesus</a></li>
            <li><a href={`${BASE}/blog`}>JW Study Blog</a></li>
            <li><a href={`${BASE}/forum`}>Community Forum</a></li>
          </ul>
        </div>
        {/* Server-rendered landing page for unauthenticated visitors (instant FCP/LCP).
            The inline script in layout.tsx sets [data-authed] when a session exists —
            the CSS rule `[data-authed] #ssr-landing { display:none }` hides this
            immediately so authed users never see a flash of the landing page. */}
        <div id="ssr-landing">
          <LandingPage />
        </div>
        <ClientShell />
      </>
    );
  }

  // SSR teaser for AI crawlers on known SPA routes. Hidden from users via CSS
  // (`[data-authed] #ssr-fallback` rule in layout.tsx) and visually when JS boots.
  const teaser = ROUTE_TEASERS[slug[0]];
  return (
    <>
      {teaser && (
        <noscript>
          <style>{`#ssr-fallback{display:block!important}`}</style>
        </noscript>
      )}
      {teaser && (
        <div id="ssr-fallback" style={SEO_HIDE}>
          <h1>{teaser.title}</h1>
          <p>{teaser.description}</p>
          <p>
            <a href={`${BASE}/`}>Open JW Study</a> — free Bible reading tracker and study community for Jehovah&apos;s Witnesses.
          </p>
        </div>
      )}
      <ClientShell />
    </>
  );
}
