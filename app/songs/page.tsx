import { songsApi } from "../../src/api/songs";
import SongIndexPage from "../../src/components/songs/SongIndexPage";
import PublicNav from "../_components/PublicNav";
import PublicFooter from "../_components/PublicFooter";

export const revalidate = 120;

const BASE = "https://jwstudy.org";

export const metadata = {
  title: "JW Music: Songs for Jehovah's Witnesses | JW Study",
  description:
    "Original Bible-based music for the JW community. Each song is rooted in scripture and aligned with the New World Translation. Listen here, then learn more at jw.org.",
  alternates: {
    canonical: `${BASE}/songs`,
    languages: {
      en: `${BASE}/songs`,
      es: `${BASE}/es/songs`,
      "x-default": `${BASE}/songs`,
    },
  },
  openGraph: {
    type: "website",
    url: `${BASE}/songs`,
    title: "JW Music: Songs for Jehovah's Witnesses",
    description:
      "Original Bible-based music for the JW community. Listen here, learn more at jw.org.",
    locale: "en_US",
    alternateLocale: ["es_ES"],
    images: [{ url: `${BASE}/og-image.jpg`, width: 1200, height: 630, alt: "JW Study Music" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "JW Music: Songs for Jehovah's Witnesses",
    description: "Original Bible-based music. Listen on jwstudy.org. Learn more at jw.org.",
    images: [{ url: `${BASE}/og-image.jpg`, width: 1200, height: 630 }],
  },
};

export default async function SongsIndexEn() {
  const songs = await songsApi.listPublished("en").catch(() => []);
  const featured = songs[0] ?? null;

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Songs", item: `${BASE}/songs` },
    ],
  };
  const schemaItemList = songs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${BASE}/songs#list`,
    name: "JW Study Songs",
    itemListElement: songs.slice(0, 30).map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE}/songs/${s.slug}`,
      name: s.title,
    })),
  } : null;

  const safeJson = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schemaBreadcrumb) }} />
      {schemaItemList && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schemaItemList) }} />
      )}
      <PublicNav />
      <SongIndexPage songs={songs} featured={featured} lang="en" />
      <PublicFooter />
    </>
  );
}
