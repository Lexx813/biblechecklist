import ClientShell from "../_components/ClientShell";

export const metadata = {
  title: "About JW Study | Bible Reading Tracker for Jehovah's Witnesses",
  description:
    "JW Study is an independent Bible reading tracker built for Jehovah's Witnesses and Bible students. Track all 66 books of the New World Translation. Built by a Bible student for the community.",
  alternates: { canonical: "https://jwstudy.org/about" },
  openGraph: {
    title: "About JW Study | Bible Reading Tracker",
    description:
      "JW Study is an independent Bible reading tracker built for Jehovah's Witnesses and Bible students. Track all 66 books of the New World Translation.",
    images: [{ url: "https://jwstudy.org/og-image.jpg", width: 1200, height: 630, alt: "JW Study — Bible Reading Tracker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About JW Study | Bible Reading Tracker",
    description:
      "JW Study is an independent Bible reading tracker built for Jehovah's Witnesses and Bible students. Track all 66 books of the New World Translation.",
    images: [{ url: "https://jwstudy.org/og-image.jpg", width: 1200, height: 630, alt: "JW Study — Bible Reading Tracker" }],
  },
};

const schemaBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://jwstudy.org" },
    { "@type": "ListItem", position: 2, name: "About", item: "https://jwstudy.org/about" },
  ],
};

const schemaPerson = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://jwstudy.org/#creator",
  name: "Alexi",
  description:
    "Bible student and Jehovah's Witness who built JW Study — a free Bible reading tracker and study community for Jehovah's Witnesses.",
  url: "https://jwstudy.org/about",
  email: "support@jwstudy.org",
  knowsAbout: ["Bible reading", "New World Translation", "Jehovah's Witnesses"],
  worksFor: {
    "@type": "Organization",
    "@id": "https://jwstudy.org/#organization",
  },
};

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaPerson) }} />
      {/* Server-rendered trust content for SEO — visually hidden, SPA renders the actual UI */}
      <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
        <h1>A Home for Bible Readers</h1>
        <h2>Why This App Exists</h2>
        <p>
          JW Study was built with one simple goal: give Bible students a persistent,
          cross-device tracker for their Bible reading. Whether you&apos;re on your phone at the
          Kingdom Hall, on your laptop at home, or on a tablet during family worship — your
          progress is always with you.
        </p>
        <p>
          Beyond tracking, we wanted to create a space where people studying with
          Jehovah&apos;s Witnesses — and active Witnesses themselves — can encourage one another,
          share thoughts, and grow together as a community of Bible students.
        </p>
        <h2>Works Alongside JW Library</h2>
        <p>
          JW Study is designed as a companion to the JW Library app, not a replacement.
          Do your reading in JW Library — then come here to log your chapters, take notes,
          and share your journey with the community.
        </p>
        <h2>About the Creator</h2>
        <p>
          Alexi is a Bible student and Jehovah&apos;s Witness who built JW Study out of a
          personal need — a simple, reliable way to track Bible reading across any device,
          without losing progress. What started as a personal tool grew into a full community
          platform for others walking the same spiritual journey.
        </p>
        <h2>Free for Everyone</h2>
        <p>
          JW Study is completely free. There are no paid tiers, no locked features, and no
          ads. Hosting (Vercel), database (Supabase), and ongoing development are covered out
          of pocket by one Witness who wanted to build something useful for the community.
        </p>
        <p>
          JW Study is an independent community project and is not affiliated with or
          endorsed by Jehovah&apos;s Witnesses or the Watch Tower Society of Pennsylvania.
        </p>
        <address>
          Contact: <a href="mailto:support@jwstudy.org">support@jwstudy.org</a>
        </address>
      </div>
      <ClientShell />
    </>
  );
}
