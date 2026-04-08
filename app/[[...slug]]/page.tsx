import { notFound } from "next/navigation";
import ClientShell from "../_components/ClientShell";
import { BOOKS } from "../../src/data/books";
import { PLAN_TEMPLATES } from "../../src/data/readingPlanTemplates";
import { STUDY_TOPICS } from "../../src/data/studyTopics";

const BASE = "https://nwtprogress.com";
const SEO_HIDE = {
  position: "absolute" as const, width: 1, height: 1,
  overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" as const,
};

function bookToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

const FAQ_ITEMS = [
  {
    question: "What is NWT Progress?",
    answer:
      "NWT Progress is a free Bible reading tracker built for Jehovah's Witnesses. It lets you track reading progress through all 66 books of the New World Translation, follow structured reading plans, take study notes, and connect with fellow publishers in a community forum.",
  },
  {
    question: "Is NWT Progress free to use?",
    answer:
      "Yes — NWT Progress is completely free. Every feature is included: Bible reading tracking across all 66 books, reading plans, study notes, direct messaging, study groups, community forum, blog, and quizzes.",
  },
  {
    question: "What Bible translation does NWT Progress use?",
    answer:
      "NWT Progress is built around the New World Translation (NWT) — the Bible used by Jehovah's Witnesses worldwide. It supports all 66 books across the Hebrew Scriptures and the Christian Greek Scriptures.",
  },
  {
    question: "Can I track a Bible reading plan with NWT Progress?",
    answer:
      "Yes. NWT Progress offers structured reading plans including the NWT in 1 Year, New Testament in 90 Days, Gospels in 30 Days, and more. Each plan tracks daily progress, shows your streak, and supports catch-up mode if you fall behind.",
  },
  {
    question: "Does NWT Progress work on mobile?",
    answer:
      "Yes — NWT Progress is a Progressive Web App (PWA). You can install it on your phone from your browser for an app-like experience on iOS and Android. It also supports offline access.",
  },
  {
    question: "What languages does NWT Progress support?",
    answer:
      "NWT Progress is available in English, Spanish, Portuguese, French, Tagalog, and Chinese.",
  },
  {
    question: "Is NWT Progress affiliated with Jehovah's Witnesses or the Watch Tower Society?",
    answer:
      "No. NWT Progress is an independent community project built by a Jehovah's Witness for Bible students. It is not affiliated with or endorsed by Jehovah's Witnesses or the Watch Tower Society of Pennsylvania.",
  },
  {
    question: "Can I use NWT Progress alongside JW Library?",
    answer:
      "Yes — NWT Progress is designed as a companion to JW Library, not a replacement. Do your reading in JW Library, then log your chapters here to track progress, build streaks, and share your journey with the community.",
  },
];

// All valid SPA client-side route first-segments
const KNOWN_SPA_ROUTES = new Set([
  "admin", "aiTools", "blogDash", "bookmarks", "checklist", "community",
  "familyQuiz", "feed", "friendRequests", "friends", "groupDetail", "groups",
  "history", "home", "invite", "leaderboard", "login", "main", "meetingPrep",
  "messages", "notifications", "premium", "privacy", "profile", "publicProfile",
  "quiz", "quizLevel", "readingPlans", "readingTracker", "referral", "search",
  "settings", "signup", "studyNotes", "studyTopicDetail", "studyTopics",
  "terms", "try", "upgrade", "whosOnline",
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
          <h1>NWT Progress — Free Bible Reading Tracker for Jehovah&apos;s Witnesses</h1>
          <p>
            Track your reading through all 66 books of the New World Translation, follow
            structured reading plans, study key Bible topics, and connect with fellow publishers.
            Use NWT Progress alongside JW Library and the research tools at wol.jw.org.
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

          <h2>More from NWT Progress</h2>
          <ul>
            <li><a href={`${BASE}/books`}>All Bible Books</a></li>
            <li><a href={`${BASE}/plans`}>All Reading Plans</a></li>
            <li><a href={`${BASE}/study-topics`}>All Study Topics</a></li>
            <li><a href={`${BASE}/blog`}>NWT Progress Blog</a></li>
            <li><a href={`${BASE}/forum`}>Community Forum</a></li>
          </ul>
        </div>
        <ClientShell />
      </>
    );
  }

  return <ClientShell />;
}
