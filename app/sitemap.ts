import { createClient } from "@supabase/supabase-js";
import { STUDY_TOPICS } from "../src/data/studyTopics";
import { BOOKS } from "../src/data/books";
import { PLAN_TEMPLATES } from "../src/data/readingPlanTemplates";

function bookToSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export const revalidate = 3600; // regenerate hourly

const BASE = "https://nwtprogress.com";

export default async function sitemap() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  const CONTENT_UPDATED = new Date("2026-04-03");

  const staticPages = [
    { url: `${BASE}`,                lastModified: new Date("2026-03-01") },
    { url: `${BASE}/blog`,           lastModified: CONTENT_UPDATED },
    { url: `${BASE}/forum`,          lastModified: CONTENT_UPDATED },
    { url: `${BASE}/study-topics`,   lastModified: new Date("2026-03-01") },
    { url: `${BASE}/books`,          lastModified: new Date("2026-03-01") },
    { url: `${BASE}/plans`,          lastModified: new Date("2026-03-01") },
    { url: `${BASE}/about`,          lastModified: new Date("2026-02-01") },
    { url: `${BASE}/privacy`,        lastModified: new Date("2026-03-31") },
    { url: `${BASE}/terms`,          lastModified: new Date("2026-03-31") },
  ];

  const bookPages = BOOKS.map((b) => ({
    url: `${BASE}/books/${bookToSlug(b.name)}`,
    lastModified: new Date("2026-03-01"),
  }));

  const planPages = PLAN_TEMPLATES.map((p) => ({
    url: `${BASE}/plans/${p.key}`,
    lastModified: new Date("2026-03-01"),
  }));

  const studyTopicPages = STUDY_TOPICS.map((t) => ({
    url: `${BASE}/study-topics/${t.slug}`,
    lastModified: new Date("2026-03-01"),
  }));

  let blogPages = [];
  try {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, lang, translations")
      .eq("published", true);

    // Build a map of paired slugs for hreflang
    const pairedMap: Record<string, string> = {};
    for (const p of posts ?? []) {
      const paired = (p.translations as any)?.paired_slug;
      if (paired) pairedMap[p.slug] = paired;
    }

    blogPages = (posts ?? []).map((p) => {
      const lang = p.lang ?? "en";
      const pairedSlug = pairedMap[p.slug];
      const entry: Record<string, unknown> = {
        url: `${BASE}/blog/${p.slug}`,
        lastModified: new Date(p.updated_at),
      };
      if (pairedSlug) {
        const otherLang = lang === "en" ? "es" : "en";
        entry.alternates = {
          languages: {
            [lang]: `${BASE}/blog/${p.slug}`,
            [otherLang]: `${BASE}/blog/${pairedSlug}`,
            "x-default": lang === "en" ? `${BASE}/blog/${p.slug}` : `${BASE}/blog/${pairedSlug}`,
          },
        };
      }
      return entry;
    });
  } catch {
    // Supabase unavailable at build time — omit blog pages
  }

  return [...staticPages, ...studyTopicPages, ...bookPages, ...planPages, ...blogPages];
}
