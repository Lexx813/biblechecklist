import { get } from "@vercel/edge-config";

// Vercel's Fluid Compute (Node.js, default since 2025) replaces edge runtime
// with the same regions/price but full Node compatibility. Removed
// `runtime = "edge"` so this route can be statically generated where useful
// and avoid the "edge runtime disables static generation" build warning.

export async function GET() {
  let flags = { aiEnabled: true };
  try {
    flags = (await get("flags")) ?? { aiEnabled: true };
  } catch {
    // Edge Config not configured or unavailable — return defaults
  }
  return new Response(JSON.stringify(flags), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
    },
  });
}
