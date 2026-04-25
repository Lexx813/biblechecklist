/**
 * Rate limiting for Vercel-side handlers (Next.js App Router routes + legacy
 * /api Pages-style routes). Uses Upstash Redis via the Vercel Marketplace.
 *
 * Required env (Marketplace auto-provisions):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * If env vars are missing (e.g. local dev without Upstash) the limiter
 * silently allows every request rather than 500ing — failure mode is "open"
 * by design so a missing integration doesn't break production.
 *
 * Usage:
 *   import { rateLimit, RATE_LIMITS } from "@/lib/ratelimit";
 *   const { ok, retryAfter } = await rateLimit(RATE_LIMITS.aiChat, userId);
 *   if (!ok) return rateLimitResponse(retryAfter);
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type LimiterKind =
  | "aiChat"
  | "aiSkills"
  | "translate"
  | "trivia"
  | "renderVideo"
  | "linkPreview"
  | "semanticSearch";

interface LimiterConfig {
  /** Max requests in the window */
  max: number;
  /** Sliding window length, e.g. "1 m", "1 h" */
  window: `${number} ${"s" | "m" | "h" | "d"}`;
  /** Friendly label included in 429 messages */
  label: string;
}

export const RATE_LIMITS: Record<LimiterKind, LimiterConfig> = {
  // AI Companion — Anthropic call per turn, expensive. Tight cap.
  aiChat:         { max: 30, window: "1 h",  label: "AI chat" },
  // AI skills (sermons / outlines / etc.) — also Anthropic-backed.
  aiSkills:       { max: 30, window: "1 h",  label: "AI tools" },
  // Translation — tighter, single-shot calls but cumulative cost.
  translate:      { max: 60, window: "1 h",  label: "translation" },
  // Trivia generation.
  trivia:         { max: 30, window: "1 h",  label: "trivia generation" },
  // Render-progress-video — heavy CPU.
  renderVideo:    { max: 5,  window: "1 h",  label: "video render" },
  // Link previews — SSRF-adjacent + outbound bandwidth.
  linkPreview:    { max: 60, window: "1 m",  label: "link preview" },
  // Semantic search — OpenAI embedding cost.
  semanticSearch: { max: 60, window: "1 m",  label: "search" },
};

let _redis: Redis | null = null;
let _checked = false;

function getRedis(): Redis | null {
  if (_checked) return _redis;
  _checked = true;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      // eslint-disable-next-line no-console
      console.warn("[ratelimit] Upstash env vars missing — limits disabled");
    }
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
  const cfg = RATE_LIMITS[kind];
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
  /** Seconds until the limit resets (only meaningful when !ok). */
  retryAfter: number;
  /** Human-friendly label for the limited action. */
  label: string;
  /** Remaining hits in the current window. */
  remaining: number;
}

/**
 * Check + decrement the limiter. `key` should uniquely identify the actor
 * (typically the Supabase user id; falls back to an IP for unauthenticated
 * paths if you ever need it).
 */
export async function rateLimit(
  kind: LimiterKind,
  key: string
): Promise<RateLimitResult> {
  const cfg = RATE_LIMITS[kind];
  const limiter = getLimiter(kind);
  if (!limiter) {
    return { ok: true, retryAfter: 0, label: cfg.label, remaining: cfg.max };
  }
  const res = await limiter.limit(key);
  const retryAfter = Math.max(0, Math.ceil((res.reset - Date.now()) / 1000));
  return { ok: res.success, retryAfter, label: cfg.label, remaining: res.remaining };
}

/** Standard 429 response. */
export function rateLimitResponse(result: RateLimitResult): Response {
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
      },
    }
  );
}
