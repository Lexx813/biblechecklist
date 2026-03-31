import { get } from "@vercel/edge-config";

export const config = { runtime: "edge" };

export default async function handler() {
  let flags = { aiEnabled: true };
  try {
    flags = (await get("flags")) ?? { aiEnabled: true };
  } catch {
    // Edge Config not configured or unavailable — return defaults
  }
  return new Response(JSON.stringify(flags), {
    headers: { "Content-Type": "application/json", "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
  });
}
