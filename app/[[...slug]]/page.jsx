import ClientShell from "../_components/ClientShell";

const SEO_HIDE = {
  position: "absolute", width: 1, height: 1,
  overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap",
};

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

export default async function Page({ params }) {
  const { slug } = await params;
  const isRoot = !slug || slug.length === 0;

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
            Track your New World Translation Bible reading across all 66 books, follow structured
            reading plans, earn quiz badges, and connect with a worldwide community of
            Jehovah&apos;s Witnesses. Free to use on any device.
          </p>

          <h2>Frequently Asked Questions</h2>
          {FAQ_ITEMS.map((item) => (
            <div key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}

          <h2>Explore Bible Books</h2>
          <ul>
            <li><a href="/books">All 66 Books of the Bible — NWT Study Guides</a></li>
            <li><a href="/books/genesis">Genesis — The Beginning of Jehovah&apos;s Purpose</a></li>
            <li><a href="/books/psalms">Psalms — Songs of Praise to Jehovah</a></li>
            <li><a href="/books/proverbs">Proverbs — Practical Wisdom from Jehovah</a></li>
            <li><a href="/books/isaiah">Isaiah — Prophecy of the Messiah and New World</a></li>
            <li><a href="/books/matthew">Matthew — The Life and Ministry of Jesus</a></li>
            <li><a href="/books/john">John — Jesus as the Son of Jehovah</a></li>
            <li><a href="/books/acts">Acts — Growth of the Early Congregation</a></li>
            <li><a href="/books/romans">Romans — Righteousness Through Faith in Jesus</a></li>
            <li><a href="/books/revelation">Revelation — Jehovah&apos;s Kingdom and Paradise Earth</a></li>
          </ul>

          <h2>Bible Reading Plans</h2>
          <ul>
            <li><a href="/plans">All Bible Reading Plans for Jehovah&apos;s Witnesses</a></li>
          </ul>

          <h2>Study Topics</h2>
          <ul>
            <li><a href="/study-topics">Bible Study Topics for Jehovah&apos;s Witnesses</a></li>
          </ul>

          <h2>Community</h2>
          <ul>
            <li><a href="/blog">NWT Progress Blog — Bible Study Articles</a></li>
            <li><a href="/forum">Community Forum for Jehovah&apos;s Witnesses</a></li>
          </ul>
        </div>
        <ClientShell />
      </>
    );
  }

  return <ClientShell />;
}
