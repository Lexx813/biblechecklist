import ClientShell from "../_components/ClientShell";
import { PLAN_TEMPLATES } from "../../src/data/readingPlanTemplates";

export const revalidate = false;

const BASE = "https://nwtprogress.com";
const SEO_HIDE = {
  position: "absolute" as const, width: 1, height: 1,
  overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap",
};

export const metadata = {
  title: "Bible Reading Plans for Jehovah's Witnesses | JW Study",
  description:
    "Free Bible reading plans using the New World Translation — NWT in 1 Year, New Testament in 90 Days, Gospels in 30 Days, and more. Track daily progress with JW Study.",
  alternates: { canonical: `${BASE}/plans` },
  openGraph: {
    title: "NWT Bible Reading Plans | JW Study",
    description:
      "Free Bible reading plans for Jehovah's Witnesses — track your daily progress with JW Study.",
    images: [{ url: "https://nwtprogress.com/og-image.jpg", width: 1200, height: 630, alt: "JW Study — Bible Reading Tracker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NWT Bible Reading Plans | JW Study",
    description: "Free Bible reading plans for Jehovah's Witnesses.",
    images: [{ url: "https://nwtprogress.com/og-image.jpg", width: 1200, height: 630, alt: "JW Study — Bible Reading Tracker" }],
  },
};

export default function PlansPage() {
  const schemaItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Bible Reading Plans — JW Study",
    description:
      "Free Bible reading plans for Jehovah's Witnesses using the New World Translation",
    url: `${BASE}/plans`,
    numberOfItems: PLAN_TEMPLATES.length,
    itemListElement: PLAN_TEMPLATES.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${BASE}/plans/${p.key}`,
      description: p.description,
    })),
  };

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Reading Plans", item: `${BASE}/plans` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaItemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <div style={SEO_HIDE}>
        <h1>Bible Reading Plans for Jehovah&apos;s Witnesses — New World Translation</h1>
        <p>
          Choose from {PLAN_TEMPLATES.length} structured Bible reading plans designed for NWT
          readers. Track your daily progress, build a reading streak, and stay consistent with your
          personal study using JW Study.
        </p>

        <h2>Available Reading Plans</h2>
        <ul>
          {PLAN_TEMPLATES.map((p) => (
            <li key={p.key}>
              <a href={`/plans/${p.key}`}>
                <strong>{p.name}</strong> — {p.totalDays} days, {p.totalChapters} chapters ({p.difficulty})
              </a>
              <p>{p.description}</p>
            </li>
          ))}
        </ul>

        <h2>Why Read the Bible with a Plan?</h2>
        <p>
          A structured reading plan helps Jehovah&apos;s Witnesses stay consistent with personal
          Bible reading — a key part of spiritual routine alongside meetings, field service, and
          family worship. JW Study tracks your daily readings, sends reminders, shows your
          streak, and lets you rejoin a plan if you fall behind with catch-up mode.
        </p>

        <h2>About JW Study</h2>
        <p>
          JW Study is a free Bible reading tracker built for Jehovah&apos;s Witnesses worldwide.
          Available in English, Spanish, Portuguese, French, Tagalog, and Chinese. Sign up free at
          nwtprogress.com.
        </p>
      </div>
      <ClientShell />
    </>
  );
}
