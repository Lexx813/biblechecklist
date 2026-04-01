/**
 * scrape-meeting-content Edge Function
 *
 * Scrapes WOL (wol.jw.org) for the CLAM + Watchtower study content for a given week
 * and stores it in the meeting_weeks table.
 *
 * POST body: { week_start: "2026-04-06" }  (Monday of the target week)
 * If omitted, uses the current week's Monday.
 *
 * Secrets required:
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const HEADERS = { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" };
const WOL = "https://wol.jw.org";

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&#x27;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#\d+;/g, "").replace(/\s+/g, " ").trim();
}

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

async function wol(path: string): Promise<string> {
  const res = await fetch(`${WOL}${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`WOL fetch failed: ${res.status} ${path}`);
  return res.text();
}

// ── Step 1: Get docIds from the date endpoint ─────────────────────────────────

function extractDocId(html: string, pubClass: string): string | null {
  // <div class="todayItem ... pub-mwb docId-202026086 ...">
  const re = new RegExp(`pub-${pubClass}\\s+docId-(\\d+)`);
  return html.match(re)?.[1] ?? null;
}

function extractWtAnchorPid(html: string): number | null {
  // href="/en/wol/d/r1/lp-e/2026247?#h=9:0-11:0"
  const m = html.match(/pub-w[^"]*href="[^"]*\?#h=(\d+)/);
  return m ? parseInt(m[1]) : null;
}

// ── Step 2: Parse the CLAM article ───────────────────────────────────────────

interface ClamPart { num: number; section: "treasures" | "ministry" | "living"; title: string }
interface ClamData {
  weekTitle: string;
  bibleReading: string;
  openingSong: number | null;
  midpointSong: number | null;
  closingSong: number | null;
  parts: ClamPart[];
  wolUrl: string;
}

function parseClamArticle(html: string, docId: string): ClamData {
  // Week title — <h1 class="...du-fontSize--basePlus2...">...<span class="pageNum">...</span>APRIL 6-12</h1>
  const weekTitleMatch = html.match(/<h1[^>]*du-fontSize--basePlus2[^>]*>([\s\S]*?)<\/h1>/);
  const weekTitle = weekTitleMatch ? stripHtml(weekTitleMatch[1]) : "";

  // Bible reading — second h2 (data-pid="2"), contains <strong>ISAIAH 50-51</strong>
  const brMatch = html.match(/<h2[^>]*data-pid="2"[^>]*>[\s\S]*?<strong>([^<]+)<\/strong>/);
  const bibleReading = brMatch ? brMatch[1].trim() : "";

  // All songs — h3 elements with dc-icon--music class containing "Song N"
  const songMatches = [...html.matchAll(/dc-icon--music[^>]*>[\s\S]*?Song\s+(\d+)/gi)];
  const openingSong = songMatches[0] ? parseInt(songMatches[0][1]) : null;
  const midpointSong = songMatches[1] ? parseInt(songMatches[1][1]) : null;

  // Closing song — "Concluding Comments ... Song N and Prayer"
  const closingMatch = html.match(/Concluding Comments[\s\S]{0,200}Song\s+(\d+)/i);
  const closingSong = closingMatch ? parseInt(closingMatch[1]) : null;

  // Parts — h3 elements with teal/gold/maroon color class containing "N. Title"
  const parts: ClamPart[] = [];
  const sectionMap: Record<string, ClamPart["section"]> = {
    "teal-700": "treasures",
    "gold-700": "ministry",
    "maroon-600": "living",
  };

  // Match h3 elements with section color and numbered part titles
  const partRe = /<h3[^>]*class="[^"]*du-color--(teal-700|gold-700|maroon-600)[^"]*"[^>]*>([\s\S]*?)<\/h3>/gi;
  for (const m of html.matchAll(partRe)) {
    const content = stripHtml(m[2]);
    const numMatch = content.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      parts.push({
        num: parseInt(numMatch[1]),
        section: sectionMap[m[1]],
        title: numMatch[2].trim(),
      });
    }
  }

  return {
    weekTitle,
    bibleReading,
    openingSong,
    midpointSong,
    closingSong,
    parts,
    wolUrl: `${WOL}/en/wol/d/r1/lp-e/${docId}`,
  };
}

// ── Step 3: Find + parse the WT study article ─────────────────────────────────

interface WtData {
  articleTitle: string;
  themeScripture: string;
  paragraphCount: number;
  wolUrl: string;
  docId: string;
}

async function getWtData(wtDocId: string, anchorPid: number): Promise<WtData> {
  // Load the TOC and find the article link at pid = anchorPid + 1
  const tocHtml = await wol(`/en/wol/d/r1/lp-e/${wtDocId}`);

  // Find <p ... data-pid="{anchorPid+1}" class="...se..."><number>  <a class="it" href="/en/wol/tc/...">Title</a>
  const articlePid = anchorPid + 1;
  const tocEntryRe = new RegExp(
    `data-pid="${articlePid}"[^>]*>[\\s\\S]*?<a[^>]*class="it"[^>]*href="([^"]+)"[^>]*>([\\s\\S]*?)<\\/a>`
  );
  const tocMatch = tocHtml.match(tocEntryRe);

  let articlePath = tocMatch?.[1] ?? null;
  let articleTitle = tocMatch ? stripHtml(tocMatch[2]) : "";

  // Fallback: scan for any tc link near anchorPid
  if (!articlePath) {
    const fallbackRe = /href="(\/en\/wol\/tc\/r1\/lp-e\/\d+\/\d+)"/g;
    const allTcLinks = [...tocHtml.matchAll(fallbackRe)];
    const idx = Math.max(0, Math.floor(anchorPid / 2) - 1);
    articlePath = allTcLinks[idx]?.[1] ?? allTcLinks[0]?.[1] ?? null;
  }

  if (!articlePath) {
    return {
      articleTitle: "Watchtower Study",
      themeScripture: "",
      paragraphCount: 20,
      wolUrl: `${WOL}/en/wol/d/r1/lp-e/${wtDocId}`,
      docId: wtDocId,
    };
  }

  const articleHtml = await wol(articlePath);

  // Title from h1
  const titleMatch = articleHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (!articleTitle && titleMatch) articleTitle = stripHtml(titleMatch[1]);

  // Theme scripture — <p class="...themeScrp..."><em>...</em>
  const themeMatch = articleHtml.match(/class="[^"]*themeScrp[^"]*"[^>]*>[\s\S]*?<em>([\s\S]*?)<\/em>/);
  const themeScripture = themeMatch ? stripHtml(themeMatch[1]) : "";

  // Count numbered paragraphs — <p ... class="...sb..."
  const paraMatches = [...articleHtml.matchAll(/class="[^"]*\bsb\b[^"]*"/g)];
  const paragraphCount = paraMatches.length || 20;

  return {
    articleTitle,
    themeScripture,
    paragraphCount,
    wolUrl: `${WOL}${articlePath}`,
    docId: wtDocId,
  };
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" } });
  }

  try {
    let weekStart: Date;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      weekStart = body.week_start ? new Date(body.week_start + "T00:00:00") : getMondayOfWeek(new Date());
    } else {
      weekStart = getMondayOfWeek(new Date());
    }

    const weekStartStr = weekStart.toISOString().slice(0, 10);

    // Helper: fetch docIds for a given Monday
    async function fetchDocIds(monday: Date) {
      // MWB appears on Mon/Tue; use Tuesday (index 1) for best coverage
      const tuesday = new Date(monday);
      tuesday.setDate(monday.getDate() + 1);
      const yr = tuesday.getFullYear();
      const mo = tuesday.getMonth() + 1;
      const dy = tuesday.getDate();
      const html = await wol(`/en/wol/dt/r1/lp-e/${yr}/${mo}/${dy}`);
      return {
        html,
        mwbDocId: extractDocId(html, "mwb"),
        wtDocId: extractDocId(html, "w"),
        wtAnchorPid: extractWtAnchorPid(html),
      };
    }

    console.log(`Scraping week ${weekStartStr}`);

    // Step 1: Get docIds — if MWB missing for current week (already passed), try next week
    let { mwbDocId, wtDocId, wtAnchorPid } = await fetchDocIds(weekStart);
    let actualWeekStart = weekStart;

    if (!mwbDocId) {
      console.log("MWB not found for current week, trying next week");
      const nextMonday = new Date(weekStart);
      nextMonday.setDate(weekStart.getDate() + 7);
      const next = await fetchDocIds(nextMonday);
      if (next.mwbDocId) {
        mwbDocId = next.mwbDocId;
        wtDocId = next.wtDocId ?? wtDocId;
        wtAnchorPid = next.wtAnchorPid ?? wtAnchorPid;
        actualWeekStart = nextMonday;
      }
    }

    if (!mwbDocId) throw new Error("Could not find MWB docId for this week");
    if (!wtDocId) throw new Error("Could not find WT docId for this week");

    console.log(`MWB docId: ${mwbDocId}, WT docId: ${wtDocId}, WT anchor pid: ${wtAnchorPid}`);

    // Step 2: Scrape CLAM
    const clamHtml = await wol(`/en/wol/d/r1/lp-e/${mwbDocId}`);
    const clam = parseClamArticle(clamHtml, mwbDocId);

    // Step 3: Scrape WT
    const wt = await getWtData(wtDocId, wtAnchorPid ?? 3);

    console.log(`CLAM: "${clam.weekTitle}", ${clam.parts.length} parts`);
    console.log(`WT: "${wt.articleTitle}", ${wt.paragraphCount} paragraphs`);

    const actualWeekStartStr = actualWeekStart.toISOString().slice(0, 10);

    // Step 4: Upsert into meeting_weeks
    const { error } = await supabase
      .from("meeting_weeks")
      .upsert({
        week_start: actualWeekStartStr,
        clam_doc_id: mwbDocId,
        clam_week_title: clam.weekTitle,
        clam_bible_reading: clam.bibleReading,
        clam_opening_song: clam.openingSong,
        clam_midpoint_song: clam.midpointSong,
        clam_closing_song: clam.closingSong,
        clam_parts: clam.parts,
        clam_wol_url: clam.wolUrl,
        wt_doc_id: wt.docId,
        wt_article_title: wt.articleTitle,
        wt_theme_scripture: wt.themeScripture,
        wt_paragraph_count: wt.paragraphCount,
        wt_wol_url: wt.wolUrl,
        scraped_at: new Date().toISOString(),
      }, { onConflict: "week_start" });

    if (error) throw error;

    return new Response(JSON.stringify({
      ok: true,
      week_start: actualWeekStartStr,
      clam_week_title: clam.weekTitle,
      clam_parts: clam.parts.length,
      wt_article_title: wt.articleTitle,
      wt_paragraphs: wt.paragraphCount,
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error("scrape-meeting-content error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
