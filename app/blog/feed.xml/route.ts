import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

const BASE = "https://jwstudy.org";

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export async function GET() {
  // Vercel preview prerenders this route without project env vars; fall back
  // to an empty post list rather than crashing the build.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let posts: any[] = [];
  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const { data } = await supabase
        .from("blog_posts")
        .select("title, slug, excerpt, content, cover_url, created_at, updated_at, profiles!author_id(display_name)")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(50);
      posts = data ?? [];
    } catch {}
  }

  const lastBuild = posts[0]?.updated_at ?? new Date().toISOString();

  const items = posts
    .map(
      (p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${BASE}/blog/${escapeXml(p.slug)}</link>
      <guid isPermaLink="true">${BASE}/blog/${escapeXml(p.slug)}</guid>
      <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>
      <description>${escapeXml(p.excerpt || stripHtml(p.content).slice(0, 300))}</description>
      ${p.profiles?.display_name ? `<author>${escapeXml(p.profiles.display_name)}</author>` : ""}
      ${p.cover_url ? `<enclosure url="${escapeXml(p.cover_url)}" type="image/jpeg" />` : ""}
    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>JW Study Blog</title>
    <link>${BASE}/blog</link>
    <description>Bible study tips, reading insights, and community updates from JW Study.</description>
    <language>en</language>
    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>
    <atom:link href="${BASE}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE}/icon-512.png</url>
      <title>JW Study</title>
      <link>${BASE}</link>
    </image>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
