import { get } from "@vercel/edge-config";

export const config = { runtime: "edge" };

export default async function handler() {
  let flags = {};
  try {
    flags = (await get("flags")) ?? {};
  } catch {
    // Edge Config not configured or unavailable — return empty flags
  }
  return new Response(JSON.stringify(flags), {
    headers: { "Content-Type": "application/json", "Cache-Control": "s-maxage=60" },
  });
}
