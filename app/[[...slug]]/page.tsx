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

// Revalidate the root landing page every 5 minutes (ISR) so blog posts and user count stay fresh
export const revalidate = 300;

// All valid SPA client-side route first-segments
const KNOWN_SPA_ROUTES = new Set([
  "admin", "advanced-quiz", "blog-dash", "bookmarks", "checklist",
  "community", "family-quiz", "feed", "friends", "groups", "history", "home",
  "invite", "leaderboard", "login", "main", "meeting-prep", "messages",
  "notifications", "premium", "privacy", "profile", "quiz", "reading-plans",
  "referral", "search", "settings", "signup", "study-notes", "study-topics",
  "terms", "trivia", "try", "upgrade", "user", "videos",
]);

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
        <div style={SEO_HIDE}>
          <h1>JW Study — Free Bible Reading Tracker for Jehovah&apos;s Witnesses</h1>
          <p>
            Track your reading through all 66 books of the New World Translation, follow
            structured reading plans, study key Bible topics, and connect with fellow publishers.
            Use JW Study alongside JW Library and the research tools at wol.jw.org.
          </p>

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

  return <ClientShell />;
}
