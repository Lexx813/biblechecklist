/**
 * fetch-link-preview Edge Function
 *
 * Receives a POST request with { message_id, url }, fetches the URL server-side,
 * parses Open Graph meta tags, and writes the result to message_link_previews.
 *
 * Required secrets:
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 *   SUPABASE_ANON_KEY         — auto-injected
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit, rateLimitResponse } from "../_shared/ratelimit.ts";

const IS_DEV = Deno.env.get("ENV") === "dev";
const ALLOWED_ORIGINS = [
  "https://jwstudy.org",
  "https://www.jwstudy.org",
  ...(IS_DEV ? ["http://localhost:5173", "http://127.0.0.1:5173"] : []),
];

const MAX_HTML_BYTES = 50 * 1024; // 50 KB

function corsHeaders(req: Request): Record<string, string> {
  const requested = req.headers.get("origin") ?? "";
  const origin = ALLOWED_ORIGINS.includes(requested) ? requested : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/**
 * Extract the content attribute value from a meta tag string.
 * Handles both single and double quotes, and attribute order variations.
 */
function extractMetaContent(html: string, property: string): string | null {
  // Match <meta property="og:xxx" content="..."> in either attribute order
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*?)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*?)["'][^>]+property=["']${property}["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  }
  return null;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m?.[1] ? decodeHtmlEntities(m[1].trim()) : null;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&nbsp;/g, " ");
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, cors);
  }

  // --- Auth validation ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized" }, 401, cors);
  }

  const supabaseUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    return json({ error: "Unauthorized" }, 401, cors);
  }

  // Rate limit — guards bandwidth + outbound proxy abuse.
  const rl = await rateLimit("linkPreview", user.id);
  if (!rl.ok) return rateLimitResponse(rl, cors);

  // --- Parse body ---
  let body: { message_id?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, cors);
  }

  const { message_id, url } = body;
  if (!message_id || !url) {
    return json({ error: "message_id and url are required" }, 400, cors);
  }

  // URL sanity check — must be http/https and not target internal/private networks
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("invalid protocol");
    }
  } catch {
    return json({ error: "Invalid URL" }, 400, cors);
  }

  // Block SSRF — reject private/internal hostnames and IP ranges.
  // Covers RFC1918, CGNAT, link-local IPv4, IPv6 ULA/link-local/loopback, IPv4-mapped IPv6.
  function isBlockedHost(h: string): boolean {
    const host = h.toLowerCase().replace(/^\[|\]$/g, "");
    if (!host) return true;
    if (host === "localhost" || host.endsWith(".localhost")) return true;
    if (host.endsWith(".internal") || host.endsWith(".local")) return true;
    if (host === "metadata.google.internal") return true;
    // IPv4
    const m4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (m4) {
      const [a, b] = [parseInt(m4[1], 10), parseInt(m4[2], 10)];
      if (a === 10) return true;                             // 10/8
      if (a === 127) return true;                            // loopback
      if (a === 0) return true;                              // 0/8
      if (a === 169 && b === 254) return true;               // link-local
      if (a === 172 && b >= 16 && b <= 31) return true;      // 172.16/12
      if (a === 192 && b === 168) return true;               // 192.168/16
      if (a === 100 && b >= 64 && b <= 127) return true;     // CGNAT 100.64/10
      if (a === 224) return true;                            // multicast
      return false;
    }
    // IPv6
    if (host.includes(":")) {
      if (host === "::" || host === "::1") return true;
      if (host.startsWith("fc") || host.startsWith("fd")) return true;  // ULA
      if (host.startsWith("fe8") || host.startsWith("fe9") ||
          host.startsWith("fea") || host.startsWith("feb")) return true; // link-local
      if (host.startsWith("::ffff:")) return isBlockedHost(host.slice(7)); // IPv4-mapped
      return false;
    }
    return false;
  }
  if (isBlockedHost(parsedUrl.hostname)) {
    return json({ error: "URL not allowed" }, 400, cors);
  }

  // --- Service-role client for DB writes ---
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // --- Check for existing preview ---
  const { data: existing } = await supabaseAdmin
    .from("message_link_previews")
    .select("url, og_title, og_description, og_image")
    .eq("message_id", message_id)
    .maybeSingle();

  if (existing) {
    return json(
      {
        og_title: existing.og_title ?? null,
        og_description: existing.og_description ?? null,
        og_image: existing.og_image ?? null,
        url: existing.url,
      },
      200,
      cors,
    );
  }

  // --- Fetch the URL with a 5-second timeout ---
  let og_title: string | null = null;
  let og_description: string | null = null;
  let og_image: string | null = null;
  let fetchSucceeded = false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    // Manual redirect handling: each hop's Location is re-validated against the
    // SSRF blocklist to defeat public→private redirect attacks (DNS rebinding,
    // AWS metadata redirects, etc.).
    const MAX_HOPS = 5;
    let currentUrl = parsedUrl.toString();
    let response: Response | null = null;

    for (let hop = 0; hop <= MAX_HOPS; hop++) {
      const r = await fetch(currentUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; JWStudyBot/1.0; +https://jwstudy.org)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "manual",
      });

      if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
        if (hop === MAX_HOPS) throw new Error("Too many redirects");
        const nextUrl = new URL(r.headers.get("location")!, currentUrl);
        if (nextUrl.protocol !== "http:" && nextUrl.protocol !== "https:") {
          throw new Error("Invalid redirect protocol");
        }
        if (isBlockedHost(nextUrl.hostname)) {
          throw new Error("Redirect to blocked host");
        }
        currentUrl = nextUrl.toString();
        continue;
      }
      response = r;
      break;
    }

    if (!response) throw new Error("No response");

    clearTimeout(timer);

    if (response.ok) {
      // Read up to MAX_HTML_BYTES to avoid memory issues with huge pages
      const reader = response.body?.getReader();
      if (reader) {
        const chunks: Uint8Array[] = [];
        let totalBytes = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done || !value) break;

          const remaining = MAX_HTML_BYTES - totalBytes;
          if (value.byteLength >= remaining) {
            chunks.push(value.slice(0, remaining));
            totalBytes += remaining;
            reader.cancel();
            break;
          }
          chunks.push(value);
          totalBytes += value.byteLength;
        }

        const combined = new Uint8Array(totalBytes);
        let offset = 0;
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.byteLength;
        }

        const html = new TextDecoder("utf-8", { fatal: false }).decode(combined);

        og_title = extractMetaContent(html, "og:title") ?? extractTitle(html);
        og_description = extractMetaContent(html, "og:description");
        og_image = extractMetaContent(html, "og:image");
        fetchSucceeded = true;
      }
    }
  } catch (err) {
    // Timeout or network error — fall through and upsert with nulls
    console.warn("fetch-link-preview: fetch failed for", url, err instanceof Error ? err.message : err);
  }

  // --- Write result to DB ---
  const { error: upsertError } = await supabaseAdmin
    .from("message_link_previews")
    .upsert(
      {
        message_id,
        url: parsedUrl.toString(),
        og_title,
        og_description,
        og_image,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "message_id" },
    );

  if (upsertError) {
    console.error("fetch-link-preview: upsert error", upsertError);
    return json({ error: "Failed to save preview" }, 500, cors);
  }

  return json(
    { og_title, og_description, og_image, url: parsedUrl.toString() },
    fetchSucceeded ? 200 : 200, // always 200 — client knows fetch was attempted
    cors,
  );
});
