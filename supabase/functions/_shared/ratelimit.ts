/**
 * Rate limiting for Supabase Edge Functions (Deno runtime).
 * Uses the same Upstash Redis instance as the Vercel side via REST.
 *
 * Required env (set with `supabase secrets set …`):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Failure is "open" — missing env vars allow every request rather than
 * 500ing, so a missing integration doesn't break production paths.
 */

// deno-lint-ignore-file
// @ts-nocheck — esm.sh import, Deno-typed at deploy time.
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@2.0.8";
import { Redis } from "https://esm.sh/@upstash/redis@1.37.0";

type LimiterKind = "linkPreview" | "semanticSearch";

interface LimiterConfig {
  max: number;
  window: `${number} ${"s" | "m" | "h" | "d"}`;
  label: string;
}

const CONFIGS: Record<LimiterKind, LimiterConfig> = {
  linkPreview:    { max: 60, window: "1 m", label: "link preview" },
  semanticSearch: { max: 60, window: "1 m", label: "search" },
};

let _redis: Redis | null = null;
let _checked = false;

function getRedis(): Redis | null {
  if (_checked) return _redis;
  _checked = true;
  // Accept either the canonical Upstash names or the legacy KV_REST_API_*
  // names provisioned by the Vercel Marketplace integration.
  const url =
    Deno.env.get("UPSTASH_REDIS_REST_URL")?.trim() ||
    Deno.env.get("KV_REST_API_URL")?.trim();
  const token =
    Deno.env.get("UPSTASH_REDIS_REST_TOKEN")?.trim() ||
    Deno.env.get("KV_REST_API_TOKEN")?.trim();
  if (!url || !token) {
    console.warn("[ratelimit] Upstash env vars missing — limits disabled");
    return null;
  }
  _redis = new Redis({ url, token });
  return _redis;
}

const limiterCache = new Map<LimiterKind, Ratelimit | null>();

function getLimiter(kind: LimiterKind): Ratelimit | null {
  if (limiterCache.has(kind)) return limiterCache.get(kind)!;
  const redis = getRedis();
  if (!redis) {
    limiterCache.set(kind, null);
    return null;
  }
  const cfg = CONFIGS[kind];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.max, cfg.window),
    prefix: `rl:${kind}`,
    analytics: false,
  });
  limiterCache.set(kind, limiter);
  return limiter;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number;
  label: string;
  remaining: number;
}

export async function rateLimit(
  kind: LimiterKind,
  key: string
): Promise<RateLimitResult> {
  const cfg = CONFIGS[kind];
  const limiter = getLimiter(kind);
  if (!limiter) {
    return { ok: true, retryAfter: 0, label: cfg.label, remaining: cfg.max };
  }
  const res = await limiter.limit(key);
  const retryAfter = Math.max(0, Math.ceil((res.reset - Date.now()) / 1000));
  return { ok: res.success, retryAfter, label: cfg.label, remaining: res.remaining };
}

export function rateLimitResponse(
  result: RateLimitResult,
  cors: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limited",
      message: `Too many ${result.label} requests. Try again in ${result.retryAfter}s.`,
      retry_after: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Remaining": "0",
        ...cors,
      },
    }
  );
}
