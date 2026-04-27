import { songsApi } from "../../../src/api/songs";
import SongIndexPage from "../../../src/components/songs/SongIndexPage";
import PublicNav from "../../_components/PublicNav";
import PublicFooter from "../../_components/PublicFooter";

export const revalidate = 120;

const BASE = "https://jwstudy.org";

export const metadata = {
  title: "Música JW: Canciones para Testigos de Jehová | JW Study",
  description:
    "Música original basada en la Biblia para la comunidad de los Testigos de Jehová. Cada canción se basa en las Escrituras y se alinea con la Traducción del Nuevo Mundo. Escucha aquí, aprende más en jw.org.",
  alternates: {
    canonical: `${BASE}/es/songs`,
    languages: {
      en: `${BASE}/songs`,
      es: `${BASE}/es/songs`,
      "x-default": `${BASE}/songs`,
    },
  },
  openGraph: {
    type: "website",
    url: `${BASE}/es/songs`,
    title: "Música JW: Canciones para Testigos de Jehová",
    description:
      "Música original basada en la Biblia. Escucha aquí, aprende más en jw.org.",
    locale: "es_ES",
    alternateLocale: ["en_US"],
    images: [{ url: `${BASE}/og-image.jpg`, width: 1200, height: 630, alt: "JW Study Música" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Música JW: Canciones para Testigos de Jehová",
    description: "Música original basada en la Biblia. Escucha en jwstudy.org. Aprende más en jw.org.",
    images: [{ url: `${BASE}/og-image.jpg`, width: 1200, height: 630 }],
  },
  other: { "content-language": "es" },
};

export default async function SongsIndexEs() {
  const songs = await songsApi.listPublished("es").catch(() => []);
  const featured = songs[0] ?? null;

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: BASE },
      { "@type": "ListItem", position: 2, name: "Canciones", item: `${BASE}/es/songs` },
    ],
  };
  const schemaItemList = songs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${BASE}/es/songs#list`,
    name: "Canciones de JW Study",
    itemListElement: songs.slice(0, 30).map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE}/es/songs/${s.slug}`,
      name: s.title_es ?? s.title,
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
      <SongIndexPage songs={songs} featured={featured} lang="es" />
      <PublicFooter />
    </>
  );
}
