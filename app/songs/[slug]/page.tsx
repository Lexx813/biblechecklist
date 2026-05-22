import { notFound, permanentRedirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { songsApi, localizedTitle, localizedDescription, localizedScriptureText } from "../../../src/api/songs";
import { blogApi } from "../../../src/api/blog";
import { bookSlugFromRef } from "../../../src/lib/songs/wolUrl";
import { BOOKS } from "../../../src/data/books";

// Shared across song-detail regenerations so each ISR miss doesn't pay a
// Supabase round-trip just for the related-blog rail.
const getRecentBlogForSongs = unstable_cache(
  async () => {
    try {
      return (await blogApi.listPublished(null)).slice(0, 3);
    } catch {
      return [];
    }
  },
  ["songs-related-blog-top3"],
  { revalidate: 600, tags: ["blog-list"] },
);

/**
 * Returns the Kingdom song number if the slug is an alias like "song-113"
 * or just "113"; otherwise null. Used to redirect aliases to canonical
 * slugs so search-discovery URLs (TikTok / Google) resolve cleanly.
 */
function aliasSongNumber(slug: string): number | null {
  const m = slug.match(/^(?:song-)?(\d{1,3})$/);
  if (!m) return null;
  const n = Number(m[1]);
  return n > 0 && n < 1000 ? n : null;
}
import { getSignedAudioUrl } from "../../../src/lib/songs/signedAudio";
import SongDetailPage from "../../../src/components/songs/SongDetailPage";
import PublicNav from "../../_components/PublicNav";
import PublicFooter from "../../_components/PublicFooter";

// Songs change rarely, edge cache hit rate matters more than freshness.
// 10 minutes lines up with how often we publish or update a song.
export const revalidate = 600;

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

    const titleWithNumber = song.song_number != null
      ? `Kingdom Song ${song.song_number} — ${title}`
      : title;
    return {
      title: `${titleWithNumber} | JW Study Music`,
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

  // /songs/song-113 or /songs/113 → permanent redirect to canonical slug.
  const aliasN = aliasSongNumber(slug);
  if (aliasN !== null) {
    const canonical = await songsApi.getSlugByNumber(aliasN).catch(() => null);
    if (canonical) permanentRedirect(`/songs/${canonical}`);
    notFound();
  }

  const song = await songsApi.getBySlug(slug, "en").catch(() => null);
  if (!song) notFound();

  const title = localizedTitle(song, "en");

  const [others, signedUrl, recentBlog] = await Promise.all([
    songsApi.listOthers(song.id, "en", 3).catch(() => []),
    getSignedAudioUrl(song.audio_url, 3600),
    getRecentBlogForSongs(),
  ]);

  const scriptureBookSlug = bookSlugFromRef(song.primary_scripture_ref);
  const scriptureBookName = scriptureBookSlug
    ? BOOKS.find((b) => b.name.toLowerCase().replace(/\s+/g, "-") === scriptureBookSlug)?.name ?? null
    : null;

  const description = localizedDescription(song, "en");
  const scriptureText = localizedScriptureText(song, "en");

  // Schema.org MusicRecording. Keep lyrics short for crawl-friendliness.
  const lyricsPlainText = song.lyrics?.sections
    ?.flatMap((s) => s.lines)
    .filter((l) => l && l.trim().length > 0)
    .join("\n") ?? "";

  // Guard duration: 0/null produces "PT0M0S" which is technically valid but
  // unusual — omit the field entirely in that case.
  const durationIso =
    song.duration_seconds && song.duration_seconds > 0
      ? `PT${Math.floor(song.duration_seconds / 60)}M${song.duration_seconds % 60}S`
      : undefined;

  const schemaMusic = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "@id": `${BASE}/songs/${song.slug}#recording`,
    name: title,
    description,
    inLanguage: "en",
    url: `${BASE}/songs/${song.slug}`,
    image: song.cover_image_url ?? `${BASE}/og-image.jpg`,
    ...(durationIso ? { duration: durationIso } : {}),
    keywords: [song.theme, song.primary_scripture_ref, "Jehovah's Witnesses", "Bible", "JW music"].join(", "),
    isFamilyFriendly: true,
    byArtist: {
      "@type": "MusicGroup",
      "@id": `${BASE}/#organization`,
      name: "JW Study",
      url: BASE,
    },
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

      {/* SSR-only "Continue your study" rail. Surfaces internal links to the
          Bible book, reading plans, study topics, and recent blog posts so
          Googlebot can crawl outward from high-traffic song pages. */}
      <section
        aria-label="Continue your study"
        className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8"
      >
        <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
          Continue your study
        </h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Study the scriptures
            </h3>
            <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed">
              {scriptureBookSlug && scriptureBookName && (
                <li>
                  <a
                    className="text-violet-700 underline decoration-violet-300/70 underline-offset-4 transition hover:text-violet-900 hover:decoration-violet-700 dark:text-violet-300 dark:hover:text-violet-100"
                    href={`/books/${scriptureBookSlug}`}
                  >
                    Read the Book of {scriptureBookName}
                  </a>
                </li>
              )}
              <li>
                <a
                  className="text-violet-700 underline decoration-violet-300/70 underline-offset-4 transition hover:text-violet-900 hover:decoration-violet-700 dark:text-violet-300 dark:hover:text-violet-100"
                  href="/books"
                >
                  All 66 Books of the Bible
                </a>
              </li>
              <li>
                <a
                  className="text-violet-700 underline decoration-violet-300/70 underline-offset-4 transition hover:text-violet-900 hover:decoration-violet-700 dark:text-violet-300 dark:hover:text-violet-100"
                  href="/plans"
                >
                  Bible Reading Plans
                </a>
              </li>
              <li>
                <a
                  className="text-violet-700 underline decoration-violet-300/70 underline-offset-4 transition hover:text-violet-900 hover:decoration-violet-700 dark:text-violet-300 dark:hover:text-violet-100"
                  href="/study-topics"
                >
                  Bible Study Topics
                </a>
              </li>
            </ul>
          </div>
          {recentBlog.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                From the JW Study Blog
              </h3>
              <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed">
                {recentBlog.map((p) => (
                  <li key={p.slug}>
                    <a
                      className="text-violet-700 underline decoration-violet-300/70 underline-offset-4 transition hover:text-violet-900 hover:decoration-violet-700 dark:text-violet-300 dark:hover:text-violet-100"
                      href={`/blog/${p.slug}`}
                    >
                      {p.title}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    className="text-violet-700 underline decoration-violet-300/70 underline-offset-4 transition hover:text-violet-900 hover:decoration-violet-700 dark:text-violet-300 dark:hover:text-violet-100"
                    href="/blog"
                  >
                    Browse all articles →
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
