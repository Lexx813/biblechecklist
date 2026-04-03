// @ts-nocheck
import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import ClientShell from "../_components/ClientShell";
import LandingPageStatic from "../_components/LandingPageStatic";

const landingCss = fs.readFileSync(path.join(process.cwd(), "src/styles/landing.css"), "utf8");

const FAQ_ITEMS = [
  {
    question: "What is NWT Progress?",
    answer:
      "NWT Progress is a free Bible reading tracker built for Jehovah's Witnesses. It lets you track reading progress through all 66 books of the New World Translation, follow structured reading plans, take study notes, and connect with fellow publishers in a community forum.",
  },
  {
    question: "Is NWT Progress free to use?",
    answer:
      "Yes — NWT Progress is free. A $3/month Premium plan unlocks reading plans, study notes, direct messaging, and study groups. The free tier includes full Bible reading tracking, community forum, blog, and quiz access.",
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
  "terms", "upgrade", "whosOnline",
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
        <div id="ssr-fallback">
          <style dangerouslySetInnerHTML={{ __html: landingCss }} />
          <LandingPageStatic />
        </div>
        <ClientShell />
      </>
    );
  }

  return <ClientShell />;
}
