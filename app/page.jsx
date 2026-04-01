import ClientShell from "./_components/ClientShell";

export const metadata = {
  alternates: { canonical: "https://nwtprogress.com" },
};

const schemaFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is NWT Progress?", acceptedAnswer: { "@type": "Answer", text: "NWT Progress is a free Bible reading tracker designed specifically for the New World Translation (NWT). It lets you track your reading progress chapter by chapter through all 66 books of the Bible — both the Hebrew Scriptures and the Christian Greek Scriptures. You can also take Bible knowledge quizzes to earn badges, join a community forum, and read spiritual blog posts." } },
    { "@type": "Question", name: "Is NWT Progress free?", acceptedAnswer: { "@type": "Answer", text: "Yes. NWT Progress has a free plan that includes the full Bible reading tracker for all 66 books, Bible knowledge quizzes, badge rewards, the community blog and forum, and basic study tools. A premium plan ($3/month) unlocks additional features including structured reading plans, personal study notes, direct messaging with other users, and study groups." } },
    { "@type": "Question", name: "How many books does the Bible tracker cover?", acceptedAnswer: { "@type": "Answer", text: "The NWT Progress tracker covers all 66 books of the Bible as organized in the New World Translation — 39 books of the Hebrew Scriptures and 27 books of the Christian Greek Scriptures. You can mark individual chapters as read and see your overall progress for each book and for the entire Bible." } },
    { "@type": "Question", name: "Can I track my Bible reading offline?", acceptedAnswer: { "@type": "Answer", text: "Yes. NWT Progress is built as a Progressive Web App (PWA), which means you can install it on your phone or tablet's home screen just like a native app. Once installed, the app works offline — you can view your reading progress and mark chapters as read even without an internet connection. Your changes will sync automatically when you reconnect." } },
    { "@type": "Question", name: "What languages does NWT Progress support?", acceptedAnswer: { "@type": "Answer", text: "NWT Progress currently supports six languages: English, Spanish (Español), Portuguese (Português), French (Français), Tagalog, and Mandarin Chinese (中文). The app automatically detects your browser language and can be switched at any time from the navigation menu." } },
    { "@type": "Question", name: "How does the Bible quiz work?", acceptedAnswer: { "@type": "Answer", text: "The Bible quiz tests your knowledge of the New World Translation with questions drawn from across the entire Bible. You earn badge rewards for completing quizzes and demonstrating knowledge of different books." } },
    { "@type": "Question", name: "Can I connect with other Bible readers on NWT Progress?", acceptedAnswer: { "@type": "Answer", text: "Yes. NWT Progress includes a community forum where you can start or join discussions about Bible topics, ask questions, and share insights. There is also a blog with spiritual articles. Premium members can send direct messages to other users and join or create study groups." } },
  ],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />
      <ClientShell />
    </>
  );
}
