import { notFound } from "next/navigation";
import { songsApi, localizedTitle, localizedDescription, localizedScriptureText } from "../../../src/api/songs";
import { getSignedAudioUrl } from "../../../src/lib/songs/signedAudio";
import SongDetailPage from "../../../src/components/songs/SongDetailPage";
import PublicNav from "../../_components/PublicNav";
import PublicFooter from "../../_components/PublicFooter";

export const revalidate = 60;

const BASE = "https://jwstudy.org";

export async function generateStaticParams() {
  try {
    const songs = await songsApi.listPublished("en");
    return songs.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const song = await songsApi.getBySlug(slug, "en");
    if (!song) return {};
    const title = localizedTitle(song, "en");
    const desc = localizedDescription(song, "en").slice(0, 160);
    const hasEs = !!(song.title_es && song.lyrics_es);

    const languages: Record<string, string> = {
      en: `${BASE}/songs/${song.slug}`,
      "x-default": `${BASE}/songs/${song.slug}`,
    };
    if (hasEs) languages.es = `${BASE}/es/songs/${song.slug}`;

    return {
      title: `${title} | JW Study Music`,
      description: desc,
      alternates: { canonical: `${BASE}/songs/${song.slug}`, languages },
      other: { "content-language": "en" },
      openGraph: {
        type: "music.song",
        url: `${BASE}/songs/${song.slug}`,
        title,
        description: desc,
        locale: "en_US",
        ...(hasEs ? { alternateLocale: ["es_ES"] } : {}),
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

export default async function SongDetailEn({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const song = await songsApi.getBySlug(slug, "en").catch(() => null);
  if (!song) notFound();

  const title = localizedTitle(song, "en");

  const [others, signedUrl] = await Promise.all([
    songsApi.listOthers(song.id, "en", 3).catch(() => []),
    getSignedAudioUrl(song.audio_url, 3600),
  ]);

  const description = localizedDescription(song, "en");
  const scriptureText = localizedScriptureText(song, "en");

  // Schema.org MusicRecording. Keep lyrics short for crawl-friendliness.
  const lyricsPlainText = song.lyrics?.sections
    ?.flatMap((s) => s.lines)
    .filter((l) => l && l.trim().length > 0)
    .join("\n") ?? "";

  const schemaMusic = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "@id": `${BASE}/songs/${song.slug}#recording`,
    name: title,
    description,
    inLanguage: "en",
    url: `${BASE}/songs/${song.slug}`,
    image: song.cover_image_url ?? `${BASE}/og-image.jpg`,
    duration: `PT${Math.floor(song.duration_seconds / 60)}M${song.duration_seconds % 60}S`,
    keywords: [song.theme, song.primary_scripture_ref, "Jehovah's Witnesses", "Bible", "JW music"].join(", "),
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
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE}/songs/${song.slug}` },
  };

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Songs", item: `${BASE}/songs` },
      { "@type": "ListItem", position: 3, name: title, item: `${BASE}/songs/${song.slug}` },
    ],
  };

  const safeJson = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schemaMusic) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schemaBreadcrumb) }} />
      <PublicNav />
      <SongDetailPage song={song} others={others} signedUrl={signedUrl} lang="en" />
      <PublicFooter />
    </>
  );
}
