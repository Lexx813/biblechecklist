import { notFound } from "next/navigation";
import { songsApi, localizedTitle, localizedDescription, localizedScriptureText } from "../../../../src/api/songs";
import { getSignedAudioUrl } from "../../../../src/lib/songs/signedAudio";
import SongDetailPage from "../../../../src/components/songs/SongDetailPage";
import PublicNav from "../../../_components/PublicNav";
import PublicFooter from "../../../_components/PublicFooter";

export const revalidate = 600;

const BASE = "https://jwstudy.org";

export async function generateStaticParams() {
  try {
    const songs = await songsApi.listPublished("es");
    return songs.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const song = await songsApi.getBySlug(slug, "es");
    if (!song) return {};
    const title = localizedTitle(song, "es");
    const desc = localizedDescription(song, "es").slice(0, 160);

    return {
      title: `${title} | JW Study Música`,
      description: desc,
      alternates: {
        canonical: `${BASE}/es/songs/${song.slug}`,
        languages: {
          en: `${BASE}/songs/${song.slug}`,
          es: `${BASE}/es/songs/${song.slug}`,
          "x-default": `${BASE}/songs/${song.slug}`,
        },
      },
      other: { "content-language": "es" },
      openGraph: {
        type: "music.song",
        url: `${BASE}/es/songs/${song.slug}`,
        title,
        description: desc,
        locale: "es_ES",
        alternateLocale: ["en_US"],
        images: [{
          url: song.cover_image_url ?? `${BASE}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: [{ url: song.cover_image_url ?? `${BASE}/og-image.jpg`, width: 1200, height: 630 }],
      },
    };
  } catch {
    return {};
  }
}

export default async function SongDetailEs({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const song = await songsApi.getBySlug(slug, "es").catch(() => null);
  if (!song) notFound();

  const title = localizedTitle(song, "es");

  const [others, signedUrl] = await Promise.all([
    songsApi.listOthers(song.id, "es", 3).catch(() => []),
    getSignedAudioUrl(song.audio_url, 3600),
  ]);

  const description = localizedDescription(song, "es");
  const scriptureText = localizedScriptureText(song, "es");

  const lyrics = song.lyrics_es ?? song.lyrics;
  const lyricsPlainText = lyrics?.sections
    ?.flatMap((s) => s.lines)
    .filter((l) => l && l.trim().length > 0)
    .join("\n") ?? "";

  const schemaMusic = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "@id": `${BASE}/es/songs/${song.slug}#recording`,
    name: title,
    description,
    inLanguage: "es",
    url: `${BASE}/es/songs/${song.slug}`,
    image: song.cover_image_url ?? `${BASE}/og-image.jpg`,
    duration: `PT${Math.floor(song.duration_seconds / 60)}M${song.duration_seconds % 60}S`,
    keywords: [song.theme, song.primary_scripture_ref, "Testigos de Jehová", "Biblia", "música JW"].join(", "),
    isFamilyFriendly: true,
    lyrics: {
      "@type": "CreativeWork",
      text: lyricsPlainText,
    },
    citation: scriptureText,
    publisher: {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "JW Study",
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE}/es/songs/${song.slug}` },
  };

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: BASE },
      { "@type": "ListItem", position: 2, name: "Canciones", item: `${BASE}/es/songs` },
      { "@type": "ListItem", position: 3, name: title, item: `${BASE}/es/songs/${song.slug}` },
    ],
  };

  const safeJson = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schemaMusic) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schemaBreadcrumb) }} />
      <PublicNav />
      <SongDetailPage song={song} others={others} signedUrl={signedUrl} lang="es" />
      <PublicFooter />
    </>
  );
}
