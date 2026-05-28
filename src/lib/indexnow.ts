/**
 * IndexNow — fire-and-forget submission to Bing/Yandex/Seznam/Naver so they
 * crawl newly published URLs within hours instead of days. Google doesn't
 * participate yet but everyone else does, which dramatically expands
 * discoverability beyond Googlebot.
 *
 * Usage from a server context (Route Handler, Server Action, edge function):
 *
 *   import { submitToIndexNow } from "@/lib/indexnow";
 *   await submitToIndexNow(["https://jwstudy.org/blog/new-post"]);
 *
 * The function is non-throwing — IndexNow failures must never block the
 * actual publish flow.
 */

const INDEXNOW_KEY = "a5962282d4404d8139932072b9e3d90f";
const HOST = "jwstudy.org";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

export async function submitToIndexNow(urls: string[]): Promise<void> {
  if (!urls.length) return;

  // De-dupe and force the production host — preview URLs (vercel.app) would
  // fail the host-match check on the IndexNow side.
  const productionUrls = Array.from(
    new Set(urls.filter((u) => u.startsWith(`https://${HOST}/`))),
  );
  if (!productionUrls.length) return;

  try {
    await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: KEY_LOCATION,
        urlList: productionUrls,
      }),
    });
  } catch {
    // Swallow — publish flow must not depend on IndexNow availability.
  }
}
