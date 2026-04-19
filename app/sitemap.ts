import { createClient } from "@supabase/supabase-js";
import { STUDY_TOPICS } from "../src/data/studyTopics";
import { BOOKS } from "../src/data/books";
import { PLAN_TEMPLATES } from "../src/data/readingPlanTemplates";

function bookToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export const revalidate = 3600; // regenerate hourly

const BASE = "https://jwstudy.org";

export default async function sitemap() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const staticPages = [
    { url: `${BASE}`,              lastModified: new Date("2026-03-01") },
    { url: `${BASE}/blog`,         lastModified: new Date("2026-04-03") },
    { url: `${BASE}/study-topics`, lastModified: new Date("2026-03-01") },
    { url: `${BASE}/books`,        lastModified: new Date("2026-03-01") },
    { url: `${BASE}/plans`,        lastModified: new Date("2026-03-01") },
    { url: `${BASE}/about`,        lastModified: new Date("2026-02-01") },
    { url: `${BASE}/privacy`,      lastModified: new Date("2026-03-31") },
    { url: `${BASE}/terms`,        lastModified: new Date("2026-03-31") },
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
    lastModified: new Date(t.updatedAt),
  }));

  // ── Blog posts (with hreflang for EN/ES pairs) ────────────────────────────
  let blogPages: Record<string, unknown>[] = [];
  try {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, lang, translations")
      .eq("published", true);

    const pairedMap: Record<string, string> = {};
    for (const p of posts ?? []) {
      const paired = (p.translations as { paired_slug?: string } | null)?.paired_slug;
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
            // x-default always points to the EN version
            "x-default": lang === "en" ? `${BASE}/blog/${p.slug}` : `${BASE}/blog/${pairedSlug}`,
          },
        };
      }
      return entry;
    });
  } catch {
    // Supabase unavailable at build time — omit blog pages gracefully
  }

  // ── Forum: index page, category pages, and thread pages ──────────────────
  let forumPages: Record<string, unknown>[] = [];
  try {
    // Get the most recently created thread so /forum lastmod is accurate
    const { data: latestThread } = await supabase
      .from("forum_threads")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const forumLastmod = latestThread?.created_at
      ? new Date(latestThread.created_at)
      : new Date("2026-04-03");

    forumPages.push({ url: `${BASE}/forum`, lastModified: forumLastmod });

    // Forum categories
    const { data: categories } = await supabase
      .from("forum_categories")
      .select("id, updated_at, created_at");

    for (const cat of categories ?? []) {
      forumPages.push({
        url: `${BASE}/forum/${cat.id}`,
        lastModified: new Date(cat.updated_at ?? cat.created_at),
      });
    }

    const { data: threads } = await supabase
      .from("forum_threads")
      .select("id, category_id, updated_at, created_at");

    for (const thread of threads ?? []) {
      forumPages.push({
        url: `${BASE}/forum/${thread.category_id}/${thread.id}`,
        lastModified: new Date(thread.updated_at ?? thread.created_at),
      });
    }

  } catch {
    // Supabase unavailable — fall back to static /forum entry only
    forumPages = [{ url: `${BASE}/forum`, lastModified: new Date("2026-04-03") }];
  }

  return [
    ...staticPages,
    ...studyTopicPages,
    ...bookPages,
    ...planPages,
    ...blogPages,
    ...forumPages,
  ];
}
